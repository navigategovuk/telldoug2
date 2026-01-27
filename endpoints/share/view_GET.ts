/**
 * Share Link View Endpoint - Public access via token
 * This endpoint does NOT require authentication
 */

import { viewSchema, ViewOutputType } from "./share.schema";
import { db } from "../../helpers/db";
import superjson from "superjson";

// Simple hash function for password verification (use bcrypt in production)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(36)}`;
}

// Helper to extract location info from JSON
function getLocationString(location: unknown): { city?: string; region?: string } {
  if (!location || typeof location !== "object") {return {};}
  const loc = location as Record<string, unknown>;
  return {
    city: loc.city as string | undefined,
    region: loc.region as string | undefined,
  };
}

async function buildResumeHtml(variantId: string, snapshotId?: string | null) {
  // If snapshot specified, use that data
  if (snapshotId) {
    const snapshot = await db.selectFrom("versionSnapshots").selectAll()
      .where("id", "=", snapshotId)
      .executeTakeFirst();
    if (snapshot && snapshot.snapshotData) {
      // Would render from snapshot data
      return `<div>Resume from snapshot ${snapshotId}</div>`;
    }
  }

  // Build from current state
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

  const loc = getLocationString(profile.location);
  const formatDate = (d: Date | string | null) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${profile.fullName} - Resume</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; background: #f5f5f5; padding: 20px; }
    .resume { max-width: 850px; margin: 0 auto; background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 40px; }
    .header h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
    .header .headline { font-size: 1.25rem; opacity: 0.9; margin-bottom: 16px; }
    .contact { display: flex; flex-wrap: wrap; gap: 16px; font-size: 0.9rem; }
    .content { padding: 40px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 1.25rem; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 20px; }
    .entry { margin-bottom: 24px; }
    .entry-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .entry-title { font-weight: 600; font-size: 1.1rem; }
    .entry-subtitle { color: #666; }
    .entry-date { color: #888; font-size: 0.85rem; }
    .skills-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .skill-tag { background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 0.9rem; }
  </style>
</head>
<body>
  <div class="resume">
    <header class="header">
      <h1>${profile.fullName || "Resume"}</h1>
      ${profile.label ? `<div class="headline">${profile.label}</div>` : ""}
      <div class="contact">
        ${profile.email ? `<span>📧 ${profile.email}</span>` : ""}
        ${profile.phone ? `<span>📞 ${profile.phone}</span>` : ""}
        ${loc.city || loc.region ? `<span>📍 ${[loc.city, loc.region].filter(Boolean).join(", ")}</span>` : ""}
      </div>
    </header>
    <div class="content">
      ${profile.summary ? `<section class="section"><h2>Summary</h2><p>${profile.summary}</p></section>` : ""}
      ${work.length ? `<section class="section"><h2>Experience</h2>${work.map(w => `
        <div class="entry">
          <div class="entry-header">
            <div><div class="entry-title">${w.position}</div><div class="entry-subtitle">${w.company}</div></div>
            <div class="entry-date">${formatDate(w.startDate)} - ${w.endDate ? formatDate(w.endDate) : "Present"}</div>
          </div>
          ${w.summary ? `<p>${w.summary}</p>` : ""}
        </div>`).join("")}</section>` : ""}
      ${education.length ? `<section class="section"><h2>Education</h2>${education.map(e => `
        <div class="entry">
          <div class="entry-header">
            <div><div class="entry-title">${e.institution}</div><div class="entry-subtitle">${[e.studyType, e.area].filter(Boolean).join(" in ")}</div></div>
            <div class="entry-date">${formatDate(e.startDate)} - ${e.endDate ? formatDate(e.endDate) : "Present"}</div>
          </div>
        </div>`).join("")}</section>` : ""}
      ${skills.length ? `<section class="section"><h2>Skills</h2><div class="skills-grid">${skills.map(s => `<span class="skill-tag">${s.name}</span>`).join("")}</div></section>` : ""}
    </div>
  </div>
</body>
</html>`;
}

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const input = viewSchema.parse(Object.fromEntries(url.searchParams.entries()));

    // Find share link by token
    const shareLink = await db.selectFrom("publicShareLinks").selectAll()
      .where("token", "=", input.token)
      .executeTakeFirst();

    if (!shareLink) {
      return new Response(superjson.stringify({ error: "Share link not found" }), { status: 404 });
    }

    // Check if revoked
    if (shareLink.isRevoked) {
      return new Response(superjson.stringify({ error: "This share link has been revoked" }), { status: 410 });
    }

    // Check if live
    if (shareLink.isLive === false) {
      return new Response(superjson.stringify({ error: "This share link is not active" }), { status: 410 });
    }

    // Check expiration
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return new Response(superjson.stringify({ error: "This share link has expired" }), { status: 410 });
    }

    // Check password
    if (shareLink.passwordHash) {
      if (!input.password) {
        return new Response(superjson.stringify({ error: "Password required" }), { status: 401 });
      }
      if (simpleHash(input.password) !== shareLink.passwordHash) {
        return new Response(superjson.stringify({ error: "Invalid password" }), { status: 401 });
      }
    }

    // Update view count and last viewed
    await db.updateTable("publicShareLinks")
      .set({
        viewCount: (shareLink.viewCount ?? 0) + 1,
        lastViewedAt: new Date(),
      })
      .where("id", "=", shareLink.id)
      .execute();

    // Build resume HTML
    const resumeHtml = await buildResumeHtml(shareLink.resumeVariantId, shareLink.snapshotId);

    // Return updated share link
    const updated = await db.selectFrom("publicShareLinks").selectAll()
      .where("id", "=", shareLink.id)
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify({ shareLink: updated, resumeHtml } satisfies ViewOutputType));
  } catch (error) {
    return new Response(superjson.stringify({ error: (error as Error).message }), { status: 500 });
  }
}
