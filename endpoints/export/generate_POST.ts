/**
 * Export Generate Endpoint - Creates export in various formats
 * 
 * Uses correct schema fields:
 * - profile.label (not headline)
 * - profile.location (JSON, not city/region/country)
 * - skill.proficiency (not level)
 * - variant has: name, targetRole, profileId, viewDefinitionId, isPrimary
 */

import { exportSchema, ExportOutputType } from "./export.schema";
import { getAuthenticatedWorkspace } from "../../helpers/workspaceUtils";
import { NotAuthenticatedError } from "../../helpers/getSetServerSession";
import { db } from "../../helpers/db";
import superjson from "superjson";

// Helper to extract location info from JSON
function getLocationString(location: unknown): { city?: string; region?: string; country?: string } {
  if (!location || typeof location !== "object") {return {};}
  const loc = location as Record<string, unknown>;
  return {
    city: loc.city as string | undefined,
    region: loc.region as string | undefined,
    country: loc.country as string | undefined,
  };
}

// Helper to build resume data from variant
async function buildResumeData(variantId: string, snapshotId?: string) {
  // If snapshot specified, use that data
  if (snapshotId) {
    const snapshot = await db.selectFrom("versionSnapshots").selectAll()
      .where("id", "=", snapshotId)
      .executeTakeFirst();
    if (snapshot) {
      return snapshot.snapshotData;
    }
  }

  // Otherwise build from current state
  const variant = await db.selectFrom("resumeVariants").selectAll()
    .where("id", "=", variantId)
    .executeTakeFirstOrThrow();

  const profile = await db.selectFrom("profiles").selectAll()
    .where("id", "=", variant.profileId)
    .executeTakeFirstOrThrow();

  const work = await db.selectFrom("workExperiences").selectAll()
    .where("profileId", "=", variant.profileId)
    .orderBy("startDate", "desc")
    .execute();

  const education = await db.selectFrom("educationEntries").selectAll()
    .where("profileId", "=", variant.profileId)
    .orderBy("startDate", "desc")
    .execute();

  const skills = await db.selectFrom("skills").selectAll()
    .where("profileId", "=", variant.profileId)
    .orderBy("category", "asc")
    .execute();

  const projects = await db.selectFrom("projects").selectAll()
    .where("profileId", "=", variant.profileId)
    .orderBy("startDate", "desc")
    .execute();

  const loc = getLocationString(profile.location);

  return {
    basics: {
      name: profile.fullName,
      label: profile.label, // Correct: use label not headline
      email: profile.email,
      phone: profile.phone,
      url: profile.url,
      summary: profile.summary,
      location: {
        city: loc.city,
        region: loc.region,
        country: loc.country,
      },
      profiles: profile.socialProfiles,
    },
    work: work.map(w => ({
      name: w.company,
      position: w.position,
      startDate: w.startDate,
      endDate: w.endDate,
      summary: w.summary,
      highlights: w.highlights,
      url: w.url,
    })),
    education: education.map(e => ({
      institution: e.institution,
      area: e.area,
      studyType: e.studyType,
      startDate: e.startDate,
      endDate: e.endDate,
      score: e.score,
      courses: e.courses,
    })),
    skills: skills.map(s => ({
      name: s.name,
      level: s.proficiency, // Map proficiency to level for JSON Resume compatibility
      category: s.category,
    })),
    projects: projects.map(p => ({
      name: p.name,
      description: p.description,
      startDate: p.startDate,
      endDate: p.endDate,
      highlights: p.highlights,
      url: p.url,
    })),
    variant: {
      name: variant.name,
      targetRole: variant.targetRole,
    },
  };
}

// Generate content based on format
function generateContent(data: unknown, format: string): { content?: string; contentType: string } {
  switch (format) {
    case "json":
      return {
        content: JSON.stringify(data, null, 2),
        contentType: "application/json",
      };
    case "markdown":
      return {
        content: generateMarkdown(data as Record<string, unknown>),
        contentType: "text/markdown",
      };
    case "txt":
      return {
        content: generatePlainText(data as Record<string, unknown>),
        contentType: "text/plain",
      };
    case "html":
      return {
        content: generateHtml(data as Record<string, unknown>),
        contentType: "text/html",
      };
    default:
      return { contentType: "application/octet-stream" };
  }
}

function generateMarkdown(data: Record<string, unknown>): string {
  const basics = data.basics as Record<string, unknown>;
  const work = data.work as Array<Record<string, unknown>>;
  const education = data.education as Array<Record<string, unknown>>;
  const skills = data.skills as Array<Record<string, unknown>>;

  let md = `# ${basics.name}\n`;
  if (basics.label) {md += `**${basics.label}**\n\n`;}
  if (basics.email) {md += `📧 ${basics.email}  `;}
  if (basics.phone) {md += `📞 ${basics.phone}  `;}
  if (basics.url) {md += `🔗 ${basics.url}`;}
  md += "\n\n";
  if (basics.summary) {md += `## Summary\n${basics.summary}\n\n`;}

  if (work?.length) {
    md += "## Experience\n\n";
    for (const w of work) {
      md += `### ${w.position} at ${w.name}\n`;
      md += `*${w.startDate} - ${w.endDate || "Present"}*\n\n`;
      if (w.summary) {md += `${w.summary}\n\n`;}
      if (Array.isArray(w.highlights) && w.highlights.length) {
        for (const h of w.highlights) {md += `- ${h}\n`;}
        md += "\n";
      }
    }
  }

  if (education?.length) {
    md += "## Education\n\n";
    for (const e of education) {
      md += `### ${e.institution}\n`;
      md += `${e.studyType || ""} ${e.area || ""}`.trim() + "\n\n";
    }
  }

  if (skills?.length) {
    md += "## Skills\n\n";
    for (const s of skills) {
      md += `- **${s.name}**`;
      if (s.level) {md += ` (${s.level})`;}
      md += "\n";
    }
  }

  return md;
}

function generatePlainText(data: Record<string, unknown>): string {
  const basics = data.basics as Record<string, unknown>;
  const work = data.work as Array<Record<string, unknown>>;

  let txt = `${basics.name}\n${"=".repeat(String(basics.name).length)}\n\n`;
  if (basics.label) {txt += `${basics.label}\n\n`;}
  if (basics.email) {txt += `Email: ${basics.email}\n`;}
  if (basics.phone) {txt += `Phone: ${basics.phone}\n`;}
  txt += "\n";
  if (basics.summary) {txt += `SUMMARY\n${basics.summary}\n\n`;}

  if (work?.length) {
    txt += "EXPERIENCE\n";
    for (const w of work) {
      txt += `\n${w.position} at ${w.name}\n`;
      txt += `${w.startDate} - ${w.endDate || "Present"}\n`;
      if (w.summary) {txt += `${w.summary}\n`;}
    }
  }

  return txt;
}

function generateHtml(data: Record<string, unknown>): string {
  const basics = data.basics as Record<string, unknown>;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${basics.name} - Resume</title>
<style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}
h1{margin-bottom:0}h2{border-bottom:1px solid #ccc;padding-bottom:5px}</style></head>
<body><h1>${basics.name}</h1><p><strong>${basics.label || ""}</strong></p>
<p>${basics.email || ""} | ${basics.phone || ""}</p>
${basics.summary ? `<h2>Summary</h2><p>${basics.summary}</p>` : ""}
</body></html>`;
}

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = exportSchema.parse(superjson.parse(body));

    // Verify variant belongs to workspace
    const variant = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.variantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    const resumeData = await buildResumeData(input.variantId, input.snapshotId);
    const { content, contentType } = generateContent(resumeData, input.format);
    const filename = `${variant.name.replace(/\s+/g, "_")}_resume.${input.format}`;

    // For text-based formats, return content directly
    if (["json", "markdown", "txt", "html"].includes(input.format)) {
      return new Response(superjson.stringify({
        success: true,
        format: input.format,
        filename,
        contentType,
        content,
      } satisfies ExportOutputType));
    }

    // For PDF/DOCX, would integrate with export helpers here
    // For now, return placeholder indicating async generation needed
    return new Response(superjson.stringify({
      success: true,
      format: input.format,
      filename,
      contentType,
      content: input.format === "pdf" || input.format === "docx"
        ? "Binary export requires additional processing. Use export helpers."
        : content,
    } satisfies ExportOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
