import { schema, OutputType, StagingRecordOutput } from "./upload_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";
import { parseLinkedInZip, parseLinkedInCSV, ParsedRecord } from "../../helpers/linkedInParser";
import {
  findJobDuplicate,
  findLearningDuplicate,
  findSkillDuplicate,
  findProjectDuplicate,
  findPersonDuplicate,
  findAchievementDuplicate,
  findInstitutionDuplicate,
  getDefaultDecision,
  DuplicateCheck,
} from "../../helpers/duplicateDetection";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { workspaceId, filename, fileData, quickImport } = input;

    // Decode base64 file data
    const binaryData = Buffer.from(fileData, "base64");

    // Parse the file (ZIP or CSV)
    let parseResult;
    if (filename.toLowerCase().endsWith(".zip")) {
      // Convert Buffer to ArrayBuffer for parseLinkedInZip
      const arrayBuffer = binaryData.buffer.slice(
        binaryData.byteOffset,
        binaryData.byteOffset + binaryData.byteLength
      );
      parseResult = await parseLinkedInZip(arrayBuffer);
    } else if (filename.toLowerCase().endsWith(".csv")) {
      const csvContent = binaryData.toString("utf-8");
      parseResult = await parseLinkedInCSV(csvContent, filename);
    } else {
      return new Response(
        superjson.stringify({
          success: false,
          importSessionId: "",
          sourceArtifactId: "",
          stats: { totalRecords: 0, byType: {}, duplicatesFound: 0 },
          stagingRecords: [],
          errors: ["Unsupported file type. Please upload a ZIP or CSV file."],
        } as OutputType),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!parseResult.success) {
      return new Response(
        superjson.stringify({
          success: false,
          importSessionId: "",
          sourceArtifactId: "",
          stats: { totalRecords: 0, byType: {}, duplicatesFound: 0 },
          stagingRecords: [],
          errors: parseResult.errors,
        } as OutputType),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create source artifact record
    const sourceArtifactId = nanoid();
    await db
      .insertInto("sourceArtifacts")
      .values({
        id: sourceArtifactId,
        workspaceId,
        filename,
        mimeType: filename.endsWith(".zip")
          ? "application/zip"
          : "text/csv",
        fileSizeBytes: binaryData.length,
        uploadedAt: new Date(),
        label: `LinkedIn Import - ${new Date().toLocaleDateString()}`,
        metadata: JSON.stringify({
          stats: parseResult.stats,
          parsedAt: new Date().toISOString(),
        }),
      })
      .execute();

    // Create import session
    const importSessionId = nanoid();
    await db
      .insertInto("importSessions")
      .values({
        id: importSessionId,
        workspaceId,
        sourceArtifactId,
        sourceType: "linkedin_zip",
        status: "pending",
        totalRecords: parseResult.records.length,
        processedRecords: 0,
        createdAt: new Date(),
        completedAt: null,
      })
      .execute();

    // Fetch existing records for duplicate detection
    const [existingJobs, existingLearning, existingSkills, existingProjects, existingPeople, existingAchievements, existingInstitutions] =
      await Promise.all([
        db.selectFrom("jobs").where("workspaceId", "=", workspaceId).selectAll().execute(),
        db.selectFrom("learning").where("workspaceId", "=", workspaceId).selectAll().execute(),
        db.selectFrom("skills").where("workspaceId", "=", workspaceId).selectAll().execute(),
        db.selectFrom("projects").where("workspaceId", "=", workspaceId).selectAll().execute(),
        db.selectFrom("people").where("workspaceId", "=", workspaceId).selectAll().execute(),
        db.selectFrom("achievements").where("workspaceId", "=", workspaceId).selectAll().execute(),
        db.selectFrom("institutions").where("workspaceId", "=", workspaceId).selectAll().execute(),
      ]);

    // Process each record and run duplicate detection
    const stagingRecords: StagingRecordOutput[] = [];
    let duplicatesFound = 0;

    for (const record of parseResult.records) {
      let duplicateCheck: DuplicateCheck | null = null;

      // Run duplicate detection based on primary entity type
      switch (record.entityMappings.primary) {
        case "job":
          duplicateCheck = findJobDuplicate(
            {
              company: (record.mappedData.company as string) || "",
              title: (record.mappedData.title as string) || "",
              startDate: (record.mappedData.startDate as string) || null,
              endDate: (record.mappedData.endDate as string) || null,
            },
            existingJobs
          );
          break;
        case "learning":
          duplicateCheck = findLearningDuplicate(
            {
              institution: (record.mappedData.institution as string) || "",
              degree: (record.mappedData.title as string) || "",
              field: (record.mappedData.description as string) || "",
              startDate: (record.mappedData.startDate as string) || null,
              endDate: (record.mappedData.endDate as string) || null,
            },
            existingLearning
          );
          break;
        case "skill":
          duplicateCheck = findSkillDuplicate(
            {
              name: (record.mappedData.name as string) || "",
              category: (record.mappedData.category as string) || null,
            },
            existingSkills
          );
          break;
        case "project":
          duplicateCheck = findProjectDuplicate(
            {
              name: (record.mappedData.name as string) || "",
              description: (record.mappedData.description as string) || null,
            },
            existingProjects
          );
          break;
        case "person":
          duplicateCheck = findPersonDuplicate(
            {
              name: (record.mappedData.name as string) || "",
              email: (record.mappedData.email as string) || null,
              company: (record.mappedData.company as string) || null,
            },
            existingPeople
          );
          break;
        case "achievement":
          duplicateCheck = findAchievementDuplicate(
            {
              title: (record.mappedData.title as string) || "",
              issuer: (record.mappedData.issuer as string) || null,
              date: (record.mappedData.date as string) || null,
            },
            existingAchievements
          );
          break;
        case "institution":
          duplicateCheck = findInstitutionDuplicate(
            {
              name: (record.mappedData.name as string) || "",
              type: (record.mappedData.type as string) || null,
            },
            existingInstitutions
          );
          break;
      }

      if (duplicateCheck && duplicateCheck.confidence !== "none") {
        duplicatesFound++;
      }

      const userDecision = duplicateCheck
        ? getDefaultDecision(duplicateCheck.confidence)
        : "create";

      // Create staging record
      const stagingId = nanoid();
      await db
        .insertInto("stagingRecords")
        .values({
          id: stagingId,
          importSessionId,
          recordType: record.entityMappings.primary,
          sourceData: JSON.stringify(record.sourceData),
          mappedData: JSON.stringify({
            ...record.mappedData,
            entityMappings: record.entityMappings,
          }),
          status: "pending",
          userDecision: quickImport ? "create" : userDecision,
          duplicateOfId: duplicateCheck?.matchedId || null,
          mergeSuggestion: duplicateCheck?.existingRecord
            ? JSON.stringify(duplicateCheck.existingRecord)
            : null,
          fieldMappings: JSON.stringify({
            fingerprint: record.fingerprint,
            linkedInRecordType: record.recordType,
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();

      stagingRecords.push({
        id: stagingId,
        recordType: record.entityMappings.primary,
        sourceData: record.sourceData,
        mappedData: record.mappedData,
        status: "pending",
        userDecision: quickImport ? "create" : userDecision,
        duplicateCheck: duplicateCheck
          ? {
              confidence: duplicateCheck.confidence,
              matchedId: duplicateCheck.matchedId,
              matchedFields: duplicateCheck.matchedFields,
              score: duplicateCheck.score,
            }
          : null,
        entityMappings: {
          primary: record.entityMappings.primary,
          secondary: record.entityMappings.secondary,
        },
      });
    }

    // If quick import, auto-commit
    if (quickImport) {
      // Trigger commit logic (will be handled by commit endpoint)
      // For now, just mark session as ready for commit
      await db
        .updateTable("importSessions")
        .set({ status: "ready_to_commit" })
        .where("id", "=", importSessionId)
        .execute();
    }

    const output: OutputType = {
      success: true,
      importSessionId,
      sourceArtifactId,
      stats: {
        totalRecords: parseResult.records.length,
        byType: parseResult.stats.byType as Record<string, number>,
        duplicatesFound,
      },
      stagingRecords,
      errors: parseResult.errors,
    };

    return new Response(superjson.stringify(output), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Import upload error:", error);
    return new Response(
      superjson.stringify({
        success: false,
        importSessionId: "",
        sourceArtifactId: "",
        stats: { totalRecords: 0, byType: {}, duplicatesFound: 0 },
        stagingRecords: [],
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      } as OutputType),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
