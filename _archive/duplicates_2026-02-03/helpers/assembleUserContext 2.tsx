import { db } from "./db";
import { Selectable } from "kysely";
import {
  People,
  Jobs,
  Skills,
  Projects,
  Institutions,
  Events,
  Feedback,
  Achievements,
  Goals,
  Compensation,
  Interactions,
  Relationships,
  Learning,
  Content,
  Profiles,
  ResumeVariants,
  WorkExperiences,
  EducationEntries,
} from "./schema";

export async function assembleUserContext(personId?: string, workspaceId?: string): Promise<string> {
  // If personId is provided, we focus on data related to that person
  // Otherwise, we fetch a broad summary of everything

  let context = "";

  if (personId) {
    context += await assemblePersonContext(personId);
  } else {
    // Include canonical profile context first
    context += await assembleCanonicalProfileContext(workspaceId);
    context += await assembleGlobalContext(workspaceId);
  }

  return context;
}

// ============================================================================
// CANONICAL PROFILE CONTEXT (Helm)
// ============================================================================

async function assembleCanonicalProfileContext(workspaceId?: string): Promise<string> {
  let context = "CANONICAL PROFILE (Professional Record):\n\n";

  // Get the user's profile
  let profileQuery = db.selectFrom("profiles").selectAll();
  if (workspaceId) {
    profileQuery = profileQuery.where("workspaceId", "=", workspaceId);
  }
  const profile = await profileQuery.executeTakeFirst();

  if (!profile) {
    context += "No profile has been created yet.\n\n";
    return context;
  }

  // Profile basics
  context += `NAME: ${profile.fullName}\n`;
  context += `LABEL: ${profile.label || "Not set"}\n`;
  context += `SUMMARY: ${profile.summary || "Not set"}\n`;
  context += `LOCATION: ${profile.location ? JSON.stringify(profile.location) : "Not set"}\n`;
  context += `EMAIL: ${profile.email || "Not set"}\n`;
  context += `WEBSITE: ${profile.url || "Not set"}\n`;
  // Extract LinkedIn from socialProfiles JSON if available
  const socialProfiles = profile.socialProfiles as Record<string, string> | null;
  context += `LINKEDIN: ${socialProfiles?.linkedin || socialProfiles?.linkedIn || "Not set"}\n\n`;

  // Work experiences from profile
  const workExperiences = await db
    .selectFrom("workExperiences")
    .selectAll()
    .where("profileId", "=", profile.id)
    .orderBy("startDate", "desc")
    .execute();

  if (workExperiences.length > 0) {
    context += `WORK EXPERIENCE (${workExperiences.length} entries):\n`;
    workExperiences.forEach((w) => {
      const dates = `${w.startDate ? formatDate(w.startDate) : "?"} - ${w.endDate ? formatDate(w.endDate) : "Present"}`;
      context += `- ${w.position} at ${w.company} (${dates})\n`;
      if (w.summary) {context += `  Summary: ${w.summary}\n`;}
      // highlights is Json type - safely handle it
      const highlights = Array.isArray(w.highlights) ? w.highlights : [];
      if (highlights.length > 0) {
        context += `  Highlights: ${highlights.join("; ")}\n`;
      }
    });
    context += "\n";
  }

  // Education from profile
  const education = await db
    .selectFrom("educationEntries")
    .selectAll()
    .where("profileId", "=", profile.id)
    .orderBy("startDate", "desc")
    .execute();

  if (education.length > 0) {
    context += `EDUCATION (${education.length} entries):\n`;
    education.forEach((e) => {
      const dates = `${e.startDate ? formatDate(e.startDate) : "?"} - ${e.endDate ? formatDate(e.endDate) : "Present"}`;
      context += `- ${e.studyType || "Degree"} in ${e.area || "General"} at ${e.institution} (${dates})\n`;
    });
    context += "\n";
  }

  // Resume variants
  const variants = await db
    .selectFrom("resumeVariants")
    .selectAll()
    .where("profileId", "=", profile.id)
    .execute();

  if (variants.length > 0) {
    context += `RESUME VARIANTS (${variants.length} versions):\n`;
    variants.forEach((v) => {
      context += `- "${v.name}" ${v.isPrimary ? "[PRIMARY]" : ""}\n`;
      if (v.targetRole) {context += `  Target Role: ${v.targetRole}\n`;}
      if (v.description) {context += `  Description: ${v.description}\n`;}
    });
    context += "\n";
  }

  return context;
}

function formatDate(date: Date | string | null): string {
  if (!date) {return "?";}
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

async function assemblePersonContext(personId: string): Promise<string> {
  const person = await db
    .selectFrom("people")
    .selectAll()
    .where("id", "=", personId)
    .executeTakeFirst();

  if (!person) {return "Person not found.";}

  let context = `FOCUS PERSON CONTEXT:\n`;
  context += `Name: ${person.name}\n`;
  context += `Role: ${person.role || "N/A"}\n`;
  context += `Company: ${person.company || "N/A"}\n`;
  context += `Relationship: ${person.relationshipType || "N/A"}\n`;
  context += `Notes: ${person.notes || "N/A"}\n\n`;

  // Interactions
  const interactions = await db
    .selectFrom("interactions")
    .selectAll()
    .where("personId", "=", personId)
    .orderBy("interactionDate", "desc")
    .limit(10)
    .execute();

  context += `RECENT INTERACTIONS (${interactions.length}):\n`;
  interactions.forEach((i) => {
    context += `- ${i.interactionDate.toString().split("T")[0]} (${i.interactionType}): ${i.notes || "No notes"}\n`;
  });
  context += "\n";

  // Feedback
  const feedback = await db
    .selectFrom("feedback")
    .selectAll()
    .where("personId", "=", personId)
    .orderBy("feedbackDate", "desc")
    .limit(5)
    .execute();

  if (feedback.length > 0) {
    context += `FEEDBACK RECEIVED (${feedback.length}):\n`;
    feedback.forEach((f) => {
      context += `- ${f.feedbackDate.toString().split("T")[0]} (${f.feedbackType}): ${f.notes}\n`;
    });
    context += "\n";
  }

  // Relationships (connections to other entities)
  const relationships = await db
    .selectFrom("relationships")
    .selectAll()
    .where((eb) =>
      eb.or([
        eb("sourceId", "=", personId),
        eb("targetId", "=", personId),
      ])
    )
    .limit(10)
    .execute();

  if (relationships.length > 0) {
    context += `RELATED ENTITIES:\n`;
    for (const r of relationships) {
      const isSource = r.sourceId === personId;
      const otherId = isSource ? r.targetId : r.sourceId;
      const otherType = isSource ? r.targetType : r.sourceType;
      context += `- Connected to ${otherType} (ID: ${otherId}) as "${r.relationshipLabel}"\n`;
    }
  }

  return context;
}

async function assembleGlobalContext(workspaceId?: string): Promise<string> {
  let context = "CAREER OS ENTITIES:\n\n";

  // Helper to add workspace filter
  const addWorkspaceFilter = <T extends { workspaceId?: string | null }>(
    query: any,
    wsId?: string
  ) => {
    if (wsId) {
      return query.where("workspaceId", "=", wsId);
    }
    return query;
  };

  // 1. Jobs (Current & Past)
  let jobsQuery = db.selectFrom("jobs").selectAll().orderBy("startDate", "desc");
  if (workspaceId) {jobsQuery = jobsQuery.where("workspaceId", "=", workspaceId);}
  const jobs = await jobsQuery.execute();
  
  context += `JOBS (${jobs.length}):\n`;
  jobs.forEach((j) => {
    const dates = `${j.startDate ? j.startDate.toString().split("T")[0] : "?"} to ${j.endDate ? j.endDate.toString().split("T")[0] : "Present"}`;
    context += `- ${j.title} at ${j.company} (${dates}). ${j.isCurrent ? "[CURRENT]" : ""}\n`;
  });
  context += "\n";

  // 2. Skills
  let skillsQuery = db.selectFrom("skills").selectAll().orderBy("proficiency", "asc");
  if (workspaceId) {skillsQuery = skillsQuery.where("workspaceId", "=", workspaceId);}
  const skills = await skillsQuery.execute();
  
  context += `SKILLS (${skills.length}):\n`;
  skills.forEach((s) => {
    context += `- ${s.name} (${s.proficiency})\n`;
  });
  context += "\n";

  // 3. Projects (Recent 10)
  let projectsQuery = db.selectFrom("projects").selectAll().orderBy("startDate", "desc").limit(10);
  if (workspaceId) {projectsQuery = projectsQuery.where("workspaceId", "=", workspaceId);}
  const projects = await projectsQuery.execute();
  
  context += `RECENT PROJECTS:\n`;
  projects.forEach((p) => {
    context += `- ${p.name} (${p.status}): ${p.description || "No description"}\n`;
  });
  context += "\n";

  // 4. Goals (Active)
  let goalsQuery = db.selectFrom("goals").selectAll().where("status", "in", ["in_progress", "not_started"]);
  if (workspaceId) {goalsQuery = goalsQuery.where("workspaceId", "=", workspaceId);}
  const goals = await goalsQuery.execute();
  
  context += `ACTIVE GOALS:\n`;
  goals.forEach((g) => {
    context += `- ${g.title} (${g.goalType}): ${g.status}\n`;
  });
  context += "\n";

  // 5. People (Key contacts - just a summary count and maybe recent ones)
  let peopleCountQuery = db.selectFrom("people").select(db.fn.count("id").as("count"));
  if (workspaceId) {peopleCountQuery = peopleCountQuery.where("workspaceId", "=", workspaceId);}
  const peopleCount = await peopleCountQuery.executeTakeFirst();
  
  let recentPeopleQuery = db.selectFrom("people").selectAll().orderBy("createdAt", "desc").limit(5);
  if (workspaceId) {recentPeopleQuery = recentPeopleQuery.where("workspaceId", "=", workspaceId);}
  const recentPeople = await recentPeopleQuery.execute();
  
  context += `PEOPLE NETWORK: Total ${peopleCount?.count || 0} contacts.\n`;
  context += `Recently added: ${recentPeople.map((p) => p.name).join(", ")}\n\n`;

  // 6. Achievements (Recent 5)
  let achievementsQuery = db.selectFrom("achievements").selectAll().orderBy("achievedDate", "desc").limit(5);
  if (workspaceId) {achievementsQuery = achievementsQuery.where("workspaceId", "=", workspaceId);}
  const achievements = await achievementsQuery.execute();
  
  context += `RECENT ACHIEVEMENTS:\n`;
  achievements.forEach((a) => {
    context += `- ${a.title} (${a.category})\n`;
  });
  context += "\n";

  // 7. Events (Upcoming)
  const now = new Date();
  let upcomingEventsQuery = db
    .selectFrom("events")
    .selectAll()
    .where("eventDate", ">", now)
    .orderBy("eventDate", "asc")
    .limit(5);
  if (workspaceId) {upcomingEventsQuery = upcomingEventsQuery.where("workspaceId", "=", workspaceId);}
  const upcomingEvents = await upcomingEventsQuery.execute();
  
  if (upcomingEvents.length > 0) {
    context += `UPCOMING EVENTS:\n`;
    upcomingEvents.forEach((e) => {
    context += `- ${e.eventDate?.toString().split("T")[0]}: ${e.title} (${e.eventType})\n`;
    });
    context += "\n";
  }

  // 8. Learning (Recent/Active)
  let learningQuery = db.selectFrom("learning").selectAll().orderBy("startDate", "desc").limit(10);
  if (workspaceId) {learningQuery = learningQuery.where("workspaceId", "=", workspaceId);}
  const learning = await learningQuery.execute();
  
  if (learning.length > 0) {
    context += `LEARNING & DEVELOPMENT:\n`;
    learning.forEach((l) => {
      const dates = `${l.startDate ? l.startDate.toString().split("T")[0] : "?"} to ${l.completionDate ? l.completionDate.toString().split("T")[0] : "..."}`;
      context += `- ${l.title} (${l.learningType}): ${l.status}. Provider: ${l.provider || "N/A"}. Dates: ${dates}. Cost: ${l.cost || "N/A"}. Skills: ${l.skillsGained || "N/A"}. Notes: ${l.notes || ""}\n`;
    });
    context += "\n";
  }

  // 9. Content (Recent)
  let contentQuery = db.selectFrom("content").selectAll().orderBy("publicationDate", "desc").limit(10);
  if (workspaceId) {contentQuery = contentQuery.where("workspaceId", "=", workspaceId);}
  const content = await contentQuery.execute();
  
  if (content.length > 0) {
    context += `CONTENT & PUBLICATIONS:\n`;
    content.forEach((c) => {
      context += `- ${c.title} (${c.contentType}) on ${c.platform || "N/A"}. Published: ${c.publicationDate.toString().split("T")[0]}. URL: ${c.url || "N/A"}. Metrics: ${c.engagementMetrics || "N/A"}. Desc: ${c.description || ""}\n`;
    });
    context += "\n";
  }

  return context;
}
