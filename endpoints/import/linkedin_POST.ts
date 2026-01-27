import { schema, OutputType } from "./linkedin_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";
import { parse } from "date-fns";

// Helper to parse CSV line handling quotes
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(csvData: string): { headers: string[], rows: string[][] } {
  const lines = csvData.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {return { headers: [], rows: [] };}

  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(line => parseCSVLine(line));
  
  return { headers, rows };
}

// Helper to parse dates from LinkedIn format (usually "DD MMM YYYY" or "MMM YYYY" or "YYYY")
function parseLinkedInDate(dateStr: string | undefined): Date | null {
  if (!dateStr || !dateStr.trim()) {return null;}
  
  const cleanStr = dateStr.trim();
  
  try {
    // Try different formats
    // "12 Jan 2023"
    if (cleanStr.match(/^\d{1,2} [A-Za-z]{3} \d{4}$/)) {
      return parse(cleanStr, "d MMM yyyy", new Date());
    }
    // "Jan 2023"
    if (cleanStr.match(/^[A-Za-z]{3} \d{4}$/)) {
      return parse(cleanStr, "MMM yyyy", new Date());
    }
    // "2023"
    if (cleanStr.match(/^\d{4}$/)) {
      return parse(cleanStr, "yyyy", new Date());
    }
    // "1/12/23" or similar
    const date = new Date(cleanStr);
    if (!isNaN(date.getTime())) {return date;}
  } catch (e) {
    // Ignore parsing errors
  }
  return null;
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { headers, rows } = parseCSV(input.csvData);

    let detectedType = "Unknown";
    const imported: OutputType['imported'] = [];
    let skipped = 0;
    const errors: string[] = [];

    // Helper to get column index safely
    const getIdx = (name: string) => headers.indexOf(name);
    const getVal = (row: string[], name: string) => {
      const idx = getIdx(name);
      return idx !== -1 ? row[idx]?.trim() : undefined;
    };

    // Detection Logic
    if (headers.includes("Connected On") && headers.includes("First Name")) {
      detectedType = "Connections";
    } else if (headers.includes("Endorser First Name") && headers.includes("Skill Name")) {
      detectedType = "Endorsements";
    } else if (headers.includes("School Name") && headers.includes("Degree Name")) {
      detectedType = "Education";
    } else if (headers.includes("Authority") && headers.includes("License Number")) {
      detectedType = "Certifications";
    } else if (headers.includes("Company Name") && headers.includes("Title")) {
      detectedType = "Positions";
    } else if (headers.length === 1 && headers[0] === "Name") {
      detectedType = "Skills";
    }

    if (detectedType === "Unknown") {
      return new Response(superjson.stringify({
        detectedType,
        imported: [],
        skipped: rows.length,
        errors: ["Could not detect CSV type from headers. Please check if this is a valid LinkedIn export file."]
      } satisfies OutputType));
    }

    await db.transaction().execute(async (trx) => {
      if (detectedType === "Connections") {
        let count = 0;
        for (const row of rows) {
          const firstName = getVal(row, "First Name");
          const lastName = getVal(row, "Last Name");
          const email = getVal(row, "Email Address");
          const company = getVal(row, "Company");
          const role = getVal(row, "Position");
          const connectedOn = getVal(row, "Connected On");

          if (!firstName && !lastName) {
            skipped++;
            continue;
          }

          const fullName = `${firstName || ''} ${lastName || ''}`.trim();
          
          // Check for existing person by email or name
          let existingPerson = null;
          if (email) {
            existingPerson = await trx.selectFrom('people').selectAll().where('email', '=', email).executeTakeFirst();
          }
          if (!existingPerson) {
            existingPerson = await trx.selectFrom('people').selectAll().where('name', '=', fullName).executeTakeFirst();
          }

          if (!existingPerson) {
            await trx.insertInto('people').values({
              id: nanoid(),
              name: fullName,
              email: email || null,
              company: company || null,
              role: role || null,
              relationshipType: "LinkedIn Connection",
              lastContactedAt: parseLinkedInDate(connectedOn),
              updatedAt: new Date(),
            }).execute();
            count++;
          } else {
            // Optional: Update existing person? For now, we skip to avoid overwriting user data
            skipped++; 
          }
        }
        imported.push({ entity: "People", count });
      }

      else if (detectedType === "Endorsements") {
        let peopleCount = 0;
        let skillsCount = 0;
        let interactionsCount = 0;

        for (const row of rows) {
          const firstName = getVal(row, "Endorser First Name");
          const lastName = getVal(row, "Endorser Last Name");
          const dateStr = getVal(row, "Endorsement Date");
          const skillName = getVal(row, "Skill Name");

          if ((!firstName && !lastName) || !skillName) {
            skipped++;
            continue;
          }

          const endorserName = `${firstName || ''} ${lastName || ''}`.trim();

          // 1. Handle Person (Endorser)
          let personId: string;
          const existingPerson = await trx.selectFrom('people').select('id').where('name', '=', endorserName).executeTakeFirst();
          
          if (existingPerson) {
            personId = existingPerson.id;
          } else {
            const newPerson = await trx.insertInto('people').values({
              id: nanoid(),
              name: endorserName,
              relationshipType: "LinkedIn Endorser",
              updatedAt: new Date(),
            }).returning('id').executeTakeFirstOrThrow();
            personId = newPerson.id;
            peopleCount++;
          }

          // 2. Handle Skill
          let skillId: string; // Not strictly needed for interaction but good to have
          const existingSkill = await trx.selectFrom('skills').select('id').where('name', '=', skillName).executeTakeFirst();
          
          if (!existingSkill) {
            await trx.insertInto('skills').values({
              id: nanoid(),
              name: skillName,
              proficiency: "intermediate",
              updatedAt: new Date(),
            }).execute();
            skillsCount++;
          }

          // 3. Handle Interaction
          const interactionDate = parseLinkedInDate(dateStr) || new Date();
          // Check duplicate interaction roughly
          const existingInteraction = await trx.selectFrom('interactions')
            .select('id')
            .where('personId', '=', personId)
            .where('interactionType', '=', 'email') // Using email as proxy for notification
            .where('notes', 'like', `%${skillName}%`)
            .executeTakeFirst();

          if (!existingInteraction) {
            await trx.insertInto('interactions').values({
              id: nanoid(),
              personId: personId,
              interactionType: "email",
              interactionDate: interactionDate,
              notes: `LinkedIn endorsement for ${skillName}`,
              tags: "linkedin,endorsement",
              updatedAt: new Date(),
            }).execute();
            interactionsCount++;
          }
        }
        imported.push({ entity: "People", count: peopleCount });
        imported.push({ entity: "Skills", count: skillsCount });
        imported.push({ entity: "Interactions", count: interactionsCount });
      }

      else if (detectedType === "Education") {
        let count = 0;
        for (const row of rows) {
          const schoolName = getVal(row, "School Name");
          const startDate = getVal(row, "Start Date");
          const endDate = getVal(row, "End Date");
          const degree = getVal(row, "Degree Name");
          const notes = getVal(row, "Notes");
          const activities = getVal(row, "Activities");

          if (!schoolName) {
            skipped++;
            continue;
          }

          const combinedNotes = [notes, activities].filter(Boolean).join("\nActivities: ");

          // Check duplicate
          const existing = await trx.selectFrom('institutions')
            .select('id')
            .where('name', '=', schoolName)
            .where('degree', '=', degree || null)
            .executeTakeFirst();

          if (!existing) {
            await trx.insertInto('institutions').values({
              id: nanoid(),
              name: schoolName,
              type: "university",
              degree: degree || null,
              startDate: parseLinkedInDate(startDate),
              endDate: parseLinkedInDate(endDate),
              notes: combinedNotes || null,
              updatedAt: new Date(),
            }).execute();
            count++;
          } else {
            skipped++;
          }
        }
        imported.push({ entity: "Institutions", count });
      }

      else if (detectedType === "Certifications") {
        let count = 0;
        for (const row of rows) {
          const name = getVal(row, "Name");
          const url = getVal(row, "Url");
          const authority = getVal(row, "Authority");
          const startDate = getVal(row, "Start Date");
          const endDate = getVal(row, "End Date");
          const license = getVal(row, "License Number");

          if (!name) {
            skipped++;
            continue;
          }

          const combinedNotes = [license ? `License: ${license}` : null, url].filter(Boolean).join("\nURL: ");

          const existing = await trx.selectFrom('learning')
            .select('id')
            .where('title', '=', name)
            .where('provider', '=', authority || null)
            .executeTakeFirst();

          if (!existing) {
            await trx.insertInto('learning').values({
              id: nanoid(),
              title: name,
              provider: authority || null,
              learningType: "certification",
              status: "completed",
              startDate: parseLinkedInDate(startDate),
              completionDate: parseLinkedInDate(endDate),
              notes: combinedNotes || null,
              updatedAt: new Date(),
            }).execute();
            count++;
          } else {
            skipped++;
          }
        }
        imported.push({ entity: "Learning", count });
      }

      else if (detectedType === "Positions") {
        let count = 0;
        for (const row of rows) {
          const company = getVal(row, "Company Name");
          const title = getVal(row, "Title");
          const description = getVal(row, "Description");
          const location = getVal(row, "Location");
          const start = getVal(row, "Started On");
          const end = getVal(row, "Finished On");

          if (!company || !title) {
            skipped++;
            continue;
          }

          const existing = await trx.selectFrom('jobs')
            .select('id')
            .where('company', '=', company)
            .where('title', '=', title)
            .executeTakeFirst();

          if (!existing) {
            await trx.insertInto('jobs').values({
              id: nanoid(),
              company: company,
              title: title,
              description: description || null,
              location: location || null,
              startDate: parseLinkedInDate(start),
              endDate: parseLinkedInDate(end),
              isCurrent: !end,
              updatedAt: new Date(),
            }).execute();
            count++;
          } else {
            skipped++;
          }
        }
        imported.push({ entity: "Jobs", count });
      }

      else if (detectedType === "Skills") {
        let count = 0;
        for (const row of rows) {
          const name = getVal(row, "Name");

          if (!name) {
            skipped++;
            continue;
          }

          const existing = await trx.selectFrom('skills')
            .select('id')
            .where('name', '=', name)
            .executeTakeFirst();

          if (!existing) {
            await trx.insertInto('skills').values({
              id: nanoid(),
              name: name,
              proficiency: "intermediate",
              updatedAt: new Date(),
            }).execute();
            count++;
          } else {
            skipped++;
          }
        }
        imported.push({ entity: "Skills", count });
      }
    });

    return new Response(superjson.stringify({
      detectedType,
      imported,
      skipped,
      errors
    } satisfies OutputType));

  } catch (error) {
    return new Response(superjson.stringify({ 
      detectedType: "Error",
      imported: [],
      skipped: 0,
      errors: [error instanceof Error ? error.message : "Unknown error occurred"] 
    } satisfies OutputType), { status: 400 });
  }
}