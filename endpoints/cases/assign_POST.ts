import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./assign_POST.schema";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const input = schema.parse(await parseRequestBody(request));

    const caseFile = await db
      .selectFrom("caseFiles")
      .select("id")
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", input.caseFileId)
      .executeTakeFirst();

    if (!caseFile) {
      return jsonResponse({ error: "Case file not found" }, 404);
    }

    const assigneeId = input.caseworkerUserId ?? ctx.user.id;

    const membership = await db
      .selectFrom("organizationMemberships")
      .select("role")
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("userId", "=", assigneeId)
      .executeTakeFirst();

    if (!membership || (membership.role !== "caseworker" && membership.role !== "platform_admin")) {
      return jsonResponse({ error: "Assignee is not a caseworker in this organization" }, 400);
    }

    await db
      .updateTable("caseFiles")
      .set({ assignedCaseworkerUserId: assigneeId, updatedAt: new Date() })
      .where("id", "=", input.caseFileId)
      .execute();

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleEndpointError(error);
  }
}
