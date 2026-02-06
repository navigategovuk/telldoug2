import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);

    const rows = await db
      .selectFrom("moderationItems")
      .select(["id", "targetType", "targetId", "decision", "riskScore", "createdAt"])
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("decision", "=", "pending_review")
      .orderBy("createdAt", "desc")
      .limit(200)
      .execute();

    return jsonResponse({
      items: rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt as any).toISOString(),
      })),
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
