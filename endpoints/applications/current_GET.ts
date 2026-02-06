import { db } from "../../helpers/db";
import { requirePermission } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await requirePermission(request, "application:update_self");

    const application = await db
      .selectFrom("applications")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("applicantUserId", "=", ctx.user.id)
      .orderBy("createdAt", "desc")
      .executeTakeFirst();

    if (!application) {
      return jsonResponse({ application: null, householdMembers: [], incomeRecords: [], needs: null });
    }

    const [householdMembers, incomeRecords, needs] = await Promise.all([
      db
        .selectFrom("applicationHouseholdMembers")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicationId", "=", application.id)
        .execute(),
      db
        .selectFrom("applicationIncomeRecords")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicationId", "=", application.id)
        .execute(),
      db
        .selectFrom("applicationNeeds")
        .selectAll()
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicationId", "=", application.id)
        .executeTakeFirst(),
    ]);

    return jsonResponse({ application, householdMembers, incomeRecords, needs: needs ?? null });
  } catch (error) {
    return handleEndpointError(error);
  }
}
