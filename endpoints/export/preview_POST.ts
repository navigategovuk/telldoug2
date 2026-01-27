/**
 * Export Preview Endpoint - Returns HTML preview of resume
 * 
 * Uses correct schema fields:
 * - profile.label (not headline)
 * - profile.location (JSON, not city/region/country)
 * - skill.proficiency (not level)
 * - No variant.targetCompany, contentOverrides, etc.
 */

import { previewSchema, PreviewOutputType } from "./export.schema";
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

async function buildResumeData(variantId: string, snapshotId?: string) {
  if (snapshotId) {
    const snapshot = await db.selectFrom("versionSnapshots").selectAll()
      .where("id", "=", snapshotId)
      .executeTakeFirst();
    if (snapshot) {return snapshot.snapshotData;}
  }

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

  return { profile, work, education, skills, projects, variant };
}

function generatePreviewHtml(data: Record<string, unknown>): string {
  const profile = data.profile as Record<string, unknown>;
  const work = data.work as Array<Record<string, unknown>>;
  const education = data.education as Array<Record<string, unknown>>;
  const skills = data.skills as Array<Record<string, unknown>>;
  const projects = data.projects as Array<Record<string, unknown>>;
  const variant = data.variant as Record<string, unknown>;

  const formatDate = (d: unknown) => d ? new Date(d as string).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "";
  
  // Extract location from JSON field
  const loc = getLocationString(profile.location);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${profile.fullName} - Resume Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.5; color: #1a1a1a; background: #f5f5f5; padding: 20px; }
    .resume { max-width: 850px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 40px; }
    .header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
    .header .headline { font-size: 1.25rem; opacity: 0.9; margin-bottom: 16px; }
    .contact { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.9rem; }
    .contact span { display: flex; align-items: center; gap: 6px; }
    .content { padding: 40px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 1.25rem; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .summary { font-size: 1rem; color: #4a4a4a; }
    .entry { margin-bottom: 24px; }
    .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .entry-title { font-weight: 600; font-size: 1.1rem; }
    .entry-subtitle { color: #666; font-size: 0.95rem; }
    .entry-date { color: #888; font-size: 0.85rem; white-space: nowrap; }
    .entry-description { color: #4a4a4a; margin-bottom: 8px; }
    .highlights { list-style: none; }
    .highlights li { position: relative; padding-left: 20px; margin-bottom: 6px; color: #4a4a4a; }
    .highlights li::before { content: "▸"; position: absolute; left: 0; color: #2563eb; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .skill-tag { background: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 20px; font-size: 0.9rem; }
    .target-info { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 24px; font-size: 0.9rem; }
    @media print { body { background: white; padding: 0; } .resume { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="resume">
    <header class="header">
      <h1>${profile.fullName || "Your Name"}</h1>
      ${profile.label ? `<div class="headline">${profile.label}</div>` : ""}
      <div class="contact">
        ${profile.email ? `<span>📧 ${profile.email}</span>` : ""}
        ${profile.phone ? `<span>📞 ${profile.phone}</span>` : ""}
        ${loc.city || loc.region ? `<span>📍 ${[loc.city, loc.region].filter(Boolean).join(", ")}</span>` : ""}
        ${profile.url ? `<span>🔗 ${profile.url}</span>` : ""}
      </div>
    </header>
    <div class="content">
      ${variant.targetRole ? `
      <div class="target-info">
        <strong>Tailored for:</strong> ${variant.targetRole}
      </div>` : ""}

      ${profile.summary ? `
      <section class="section">
        <h2>Professional Summary</h2>
        <p class="summary">${profile.summary}</p>
      </section>` : ""}

      ${work.length ? `
      <section class="section">
        <h2>Experience</h2>
        ${work.map(w => `
        <div class="entry">
          <div class="entry-header">
            <div>
              <div class="entry-title">${w.position}</div>
              <div class="entry-subtitle">${w.company}${w.location ? ` • ${w.location}` : ""}</div>
            </div>
            <div class="entry-date">${formatDate(w.startDate)} - ${w.endDate ? formatDate(w.endDate) : "Present"}</div>
          </div>
          ${w.summary ? `<p class="entry-description">${w.summary}</p>` : ""}
          ${Array.isArray(w.highlights) && w.highlights.length ? `
          <ul class="highlights">
            ${(w.highlights as string[]).map(h => `<li>${h}</li>`).join("")}
          </ul>` : ""}
        </div>`).join("")}
      </section>` : ""}

      ${education.length ? `
      <section class="section">
        <h2>Education</h2>
        ${education.map(e => `
        <div class="entry">
          <div class="entry-header">
            <div>
              <div class="entry-title">${e.institution}</div>
              <div class="entry-subtitle">${[e.studyType, e.area].filter(Boolean).join(" in ")}${e.score ? ` • GPA: ${e.score}` : ""}</div>
            </div>
            <div class="entry-date">${formatDate(e.startDate)} - ${e.endDate ? formatDate(e.endDate) : "Present"}</div>
          </div>
        </div>`).join("")}
      </section>` : ""}

      ${skills.length ? `
      <section class="section">
        <h2>Skills</h2>
        <div class="skills-grid">
          ${skills.map(s => `<span class="skill-tag">${s.name}${s.proficiency ? ` (${s.proficiency})` : ""}</span>`).join("")}
        </div>
      </section>` : ""}

      ${projects.length ? `
      <section class="section">
        <h2>Projects</h2>
        ${projects.map(p => `
        <div class="entry">
          <div class="entry-header">
            <div>
              <div class="entry-title">${p.name}</div>
            </div>
            ${p.startDate ? `<div class="entry-date">${formatDate(p.startDate)} - ${p.endDate ? formatDate(p.endDate) : "Present"}</div>` : ""}
          </div>
          ${p.description ? `<p class="entry-description">${p.description}</p>` : ""}
          ${Array.isArray(p.highlights) && p.highlights.length ? `
          <ul class="highlights">
            ${(p.highlights as string[]).map(h => `<li>${h}</li>`).join("")}
          </ul>` : ""}
        </div>`).join("")}
      </section>` : ""}
    </div>
  </div>
</body>
</html>`;
}

export async function handle(request: Request) {
  try {
    const workspace = await getAuthenticatedWorkspace(request);
    const body = await request.text();
    const input = previewSchema.parse(superjson.parse(body));

    const variant = await db.selectFrom("resumeVariants").selectAll()
      .where("id", "=", input.variantId)
      .where("workspaceId", "=", workspace.id)
      .executeTakeFirst();

    if (!variant) {
      return new Response(superjson.stringify({ error: "Variant not found" }), { status: 404 });
    }

    const resumeData = await buildResumeData(input.variantId, input.snapshotId);
    const html = generatePreviewHtml(resumeData as Record<string, unknown>);

    return new Response(superjson.stringify({ success: true, html } satisfies PreviewOutputType));
  } catch (error) {
    if (error instanceof NotAuthenticatedError) {
      return new Response(superjson.stringify({ error: "Not authenticated" }), { status: 401 });
    }
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
