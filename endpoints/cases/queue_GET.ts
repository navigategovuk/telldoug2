import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);

    const rows = await db
      .selectFrom("caseFiles")
      .innerJoin("applications", "caseFiles.applicationId", "applications.id")
      .leftJoin("users", "applications.applicantUserId", "users.id")
      .leftJoin("applicantProfiles", (join) =>
        join
          .onRef("applicantProfiles.userId", "=", "applications.applicantUserId")
          .onRef("applicantProfiles.organizationId", "=", "applications.organizationId")
      )
      .select([
        "caseFiles.id as id",
        "caseFiles.applicationId as applicationId",
        "caseFiles.status as status",
        "caseFiles.priority as priority",
        "caseFiles.slaDueAt as slaDueAt",
        "caseFiles.assignedCaseworkerUserId as assignedCaseworkerUserId",
        "users.displayName as displayName",
        "applicantProfiles.legalFullName as legalFullName",
      ])
      .where("caseFiles.organizationId", "=", ctx.activeOrganizationId)
      .orderBy("caseFiles.slaDueAt", "asc")
      .execute();

    const cases = rows.map((row) => ({
      id: row.id,
      applicationId: row.applicationId,
      status: row.status,
      priority: row.priority,
      slaDueAt: row.slaDueAt ? new Date(row.slaDueAt as any).toISOString() : null,
      assignedCaseworkerUserId: row.assignedCaseworkerUserId,
      applicantName: row.legalFullName || row.displayName || "Applicant",
    }));

    return jsonResponse({ cases });
  } catch (error) {
    return handleEndpointError(error);
  }
}
