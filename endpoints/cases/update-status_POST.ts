import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./update-status_POST.schema";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const input = schema.parse(await parseRequestBody(request));

    const existing = await db
      .selectFrom("caseFiles")
      .select("id")
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("id", "=", input.caseFileId)
      .executeTakeFirst();

    if (!existing) {
      return jsonResponse({ error: "Case file not found" }, 404);
    }

    await db
      .updateTable("caseFiles")
      .set({
        status: input.status,
        priority: input.priority,
        lastReviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where("id", "=", input.caseFileId)
      .execute();

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleEndpointError(error);
  }
}
