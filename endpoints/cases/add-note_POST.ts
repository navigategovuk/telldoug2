import { db } from "../../helpers/db";
import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./add-note_POST.schema";
import { writeAuditEvent } from "../../helpers/audit";

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
      .insertInto("caseNotes")
      .values({
        organizationId: ctx.activeOrganizationId,
        caseFileId: input.caseFileId,
        authorUserId: ctx.user.id,
        body: input.body,
      })
      .execute();

    await writeAuditEvent({
      organizationId: ctx.activeOrganizationId,
      actorUserId: ctx.user.id,
      eventType: "case.note_added",
      entityType: "case_file",
      entityId: String(input.caseFileId),
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleEndpointError(error);
  }
}
