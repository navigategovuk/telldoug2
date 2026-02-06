import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);

    const [applicationCounts, pendingModeration, openCases, caseAges] = await Promise.all([
      db
        .selectFrom("applications")
        .select(["status", ({ fn }) => fn.countAll<number>().as("count")])
        .where("organizationId", "=", ctx.activeOrganizationId)
        .groupBy("status")
        .execute(),
      db
        .selectFrom("moderationItems")
        .select(({ fn }) => fn.countAll<number>().as("count"))
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("decision", "=", "pending_review")
        .executeTakeFirst(),
      db
        .selectFrom("caseFiles")
        .select(({ fn }) => fn.countAll<number>().as("count"))
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("status", "not in", ["closed"])
        .executeTakeFirst(),
      db
        .selectFrom("caseFiles")
        .select(["createdAt"])
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("status", "not in", ["closed"])
        .execute(),
    ]);

    const avgCaseAgeHours =
      caseAges.length === 0
        ? 0
        : caseAges.reduce((sum, row) => {
            const created = new Date(row.createdAt as any).getTime();
            return sum + (Date.now() - created) / (1000 * 60 * 60);
          }, 0) / caseAges.length;

    return jsonResponse({
      applicationsByStatus: applicationCounts.map((item) => ({
        status: item.status,
        count: Number(item.count),
      })),
      pendingModeration: Number(pendingModeration?.count ?? 0),
      openCases: Number(openCases?.count ?? 0),
      avgCaseAgeHours: Number(avgCaseAgeHours.toFixed(2)),
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
