import { db } from "../../helpers/db";
import { requirePermission } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./update_POST.schema";

export async function handle(request: Request) {
  try {
    const ctx = await requirePermission(request, "application:update_self");
    const input = schema.parse(await parseRequestBody(request));

    const application = await db
      .selectFrom("applications")
      .selectAll()
      .where("id", "=", input.applicationId)
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("applicantUserId", "=", ctx.user.id)
      .executeTakeFirst();

    if (!application) {
      return jsonResponse({ error: "Application not found" }, 404);
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("applications")
        .set({
          title: input.title ?? application.title,
          lockVersion: application.lockVersion + 1,
          updatedAt: new Date(),
        })
        .where("id", "=", application.id)
        .execute();

      if (input.householdMembers) {
        await trx
          .deleteFrom("applicationHouseholdMembers")
          .where("organizationId", "=", ctx.activeOrganizationId)
          .where("applicationId", "=", application.id)
          .execute();

        if (input.householdMembers.length > 0) {
          await trx
            .insertInto("applicationHouseholdMembers")
            .values(
              input.householdMembers.map((member) => ({
                organizationId: ctx.activeOrganizationId,
                applicationId: application.id,
                fullName: member.fullName,
                relationship: member.relationship,
                dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
                employmentStatus: member.employmentStatus ?? null,
              }))
            )
            .execute();
        }
      }

      if (input.incomeRecords) {
        await trx
          .deleteFrom("applicationIncomeRecords")
          .where("organizationId", "=", ctx.activeOrganizationId)
          .where("applicationId", "=", application.id)
          .execute();

        if (input.incomeRecords.length > 0) {
          await trx
            .insertInto("applicationIncomeRecords")
            .values(
              input.incomeRecords.map((income) => ({
                organizationId: ctx.activeOrganizationId,
                applicationId: application.id,
                incomeType: income.incomeType,
                amount: income.amount as any,
                frequency: income.frequency,
                evidenceDocumentId: null,
              }))
            )
            .execute();
        }
      }

      if (input.needs) {
        const existingNeeds = await trx
          .selectFrom("applicationNeeds")
          .select("id")
          .where("organizationId", "=", ctx.activeOrganizationId)
          .where("applicationId", "=", application.id)
          .executeTakeFirst();

        const values = {
          accessibilityNeeds: input.needs.accessibilityNeeds ?? null,
          medicalNeeds: input.needs.medicalNeeds ?? null,
          supportNeeds: input.needs.supportNeeds ?? null,
          structuredNeeds: (input.needs.structuredNeeds ?? null) as any,
          updatedAt: new Date(),
        };

        if (!existingNeeds) {
          await trx
            .insertInto("applicationNeeds")
            .values({
              organizationId: ctx.activeOrganizationId,
              applicationId: application.id,
              ...values,
            })
            .execute();
        } else {
          await trx
            .updateTable("applicationNeeds")
            .set(values)
            .where("id", "=", existingNeeds.id)
            .execute();
        }
      }
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return handleEndpointError(error);
  }
}
