import { db } from "../../../helpers/db";
import { requireAnyRole } from "../../../helpers/authorize";
import { handleEndpointError } from "../../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../../helpers/http";
import { schema } from "./publish_POST.schema";
import { writeAuditEvent } from "../../../helpers/audit";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);
    const input = schema.parse(await parseRequestBody(request));

    const versionNumber = await db.transaction().execute(async (trx) => {
      const current = await trx
        .selectFrom("policyVersions")
        .select(({ fn }) => fn.max<number>("versionNumber").as("maxVersion"))
        .where("organizationId", "=", ctx.activeOrganizationId)
        .executeTakeFirst();

      const nextVersion = Number(current?.maxVersion ?? 0) + 1;

      await trx
        .updateTable("policyVersions")
        .set({ isActive: false })
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("isActive", "=", true)
        .execute();

      await trx
        .insertInto("policyVersions")
        .values({
          organizationId: ctx.activeOrganizationId,
          versionNumber: nextVersion,
          title: input.title,
          rules: input.rules as any,
          isActive: true,
          publishedByUserId: ctx.user.id,
        })
        .execute();

      return nextVersion;
    });

    await writeAuditEvent({
      organizationId: ctx.activeOrganizationId,
      actorUserId: ctx.user.id,
      eventType: "policy.published",
      entityType: "policy_version",
      metadata: { versionNumber },
    });

    return jsonResponse({ ok: true, versionNumber });
  } catch (error) {
    return handleEndpointError(error);
  }
}
