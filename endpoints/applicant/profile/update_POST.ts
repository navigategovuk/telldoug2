import { db } from "../../../helpers/db";
import { handleEndpointError } from "../../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../../helpers/http";
import { requirePermission } from "../../../helpers/authorize";
import { schema } from "./update_POST.schema";

export async function handle(request: Request) {
  try {
    const ctx = await requirePermission(request, "application:update_self");
    const input = schema.parse(await parseRequestBody(request));

    const now = new Date();

    const existing = await db
      .selectFrom("applicantProfiles")
      .select("id")
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("userId", "=", ctx.user.id)
      .executeTakeFirst();

    const values: Record<string, unknown> = {
      ...input,
      updatedAt: now,
    };

    if (input.consentAccepted) {
      values.consentAcceptedAt = now;
    }

    let profile;
    if (!existing) {
      profile = await db
        .insertInto("applicantProfiles")
        .values({
          organizationId: ctx.activeOrganizationId,
          userId: ctx.user.id,
          legalFullName: input.legalFullName ?? ctx.user.displayName,
          nationalInsuranceNumber: input.nationalInsuranceNumber ?? null,
          phone: input.phone ?? null,
          addressLine1: input.addressLine1 ?? null,
          addressLine2: input.addressLine2 ?? null,
          city: input.city ?? null,
          postcode: input.postcode ?? null,
          consentAccepted: input.consentAccepted ?? false,
          consentAcceptedAt: input.consentAccepted ? now : null,
          updatedAt: now,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    } else {
      profile = await db
        .updateTable("applicantProfiles")
        .set(values as any)
        .where("id", "=", existing.id)
        .returningAll()
        .executeTakeFirstOrThrow();
    }

    return jsonResponse({ profile });
  } catch (error) {
    return handleEndpointError(error);
  }
}
