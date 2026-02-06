import { db } from "../../helpers/db";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";
import { requirePermission } from "../../helpers/authorize";

export async function handle(request: Request) {
  try {
    const ctx = await requirePermission(request, "applicant:read_self");

    let profile = await db
      .selectFrom("applicantProfiles")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("userId", "=", ctx.user.id)
      .executeTakeFirst();

    if (!profile) {
      profile = await db
        .insertInto("applicantProfiles")
        .values({
          organizationId: ctx.activeOrganizationId,
          userId: ctx.user.id,
          legalFullName: ctx.user.displayName,
          consentAccepted: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return jsonResponse({ profile });
  } catch (error) {
    return handleEndpointError(error);
  }
}
