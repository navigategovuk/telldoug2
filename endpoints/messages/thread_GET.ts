import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

function getApplicationId(request: Request): number | null {
  const url = new URL(request.url);
  const raw = url.searchParams.get("applicationId");
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);
    let applicationId = getApplicationId(request);

    if (!applicationId && ctx.activeMembershipRole === "applicant") {
      const latest = await db
        .selectFrom("applications")
        .select("id")
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicantUserId", "=", ctx.user.id)
        .orderBy("createdAt", "desc")
        .executeTakeFirst();
      applicationId = latest?.id ?? null;
    }

    if (!applicationId) {
      return jsonResponse({ messages: [] });
    }

    const app = await db
      .selectFrom("applications")
      .select(["id", "applicantUserId"])
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", applicationId)
      .executeTakeFirst();

    if (!app) {
      return jsonResponse({ error: "Application not found" }, 404);
    }

    if (ctx.activeMembershipRole === "applicant" && app.applicantUserId !== ctx.user.id) {
      return jsonResponse({ error: "Access denied" }, 403);
    }

    let query = db
      .selectFrom("messages")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("applicationId", "=", applicationId)
      .orderBy("createdAt", "asc");

    if (ctx.activeMembershipRole === "applicant") {
      query = query.where((eb) =>
        eb.or([
          eb("visibility", "=", "visible"),
          eb("senderUserId", "=", ctx.user.id),
        ])
      );
    }

    const messages = await query.execute();
    return jsonResponse({ messages });
  } catch (error) {
    return handleEndpointError(error);
  }
}
