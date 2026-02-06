import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

function getCaseId(request: Request): number | null {
  const url = new URL(request.url);
  const raw = url.searchParams.get("caseId");
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const caseId = getCaseId(request);

    if (!caseId) {
      return jsonResponse({ error: "caseId query param is required" }, 400);
    }

    const caseFile = await db
      .selectFrom("caseFiles")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", caseId)
      .executeTakeFirst();

    if (!caseFile) {
      return jsonResponse({ error: "Case file not found" }, 404);
    }

    const application = await db
      .selectFrom("applications")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", caseFile.applicationId)
      .executeTakeFirst();

    if (!application) {
      return jsonResponse({ error: "Application not found" }, 404);
    }

    const [profile, notes, documents, messages] = await Promise.all([
      db
        .selectFrom("applicantProfiles")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("userId", "=", application.applicantUserId)
        .executeTakeFirst(),
      db
        .selectFrom("caseNotes")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("caseFileId", "=", caseFile.id)
        .orderBy("createdAt", "desc")
        .execute(),
      db
        .selectFrom("documents")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicationId", "=", application.id)
        .orderBy("createdAt", "desc")
        .execute(),
      db
        .selectFrom("messages")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicationId", "=", application.id)
        .orderBy("createdAt", "asc")
        .execute(),
    ]);

    return jsonResponse({
      caseFile,
      application,
      profile: profile ?? null,
      notes,
      documents,
      messages,
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
