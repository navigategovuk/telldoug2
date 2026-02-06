import { db } from "../../helpers/db";
import { requirePermission } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./submit_POST.schema";
import { moderateArtifact } from "../../helpers/moderationEngine";
import { getCorrelationId } from "../../helpers/requestContext";

export async function handle(request: Request) {
  try {
    const ctx = await requirePermission(request, "application:submit_self");
    const input = schema.parse(await parseRequestBody(request));
    const correlationId = getCorrelationId(request);

    const application = await db
      .selectFrom("applications")
      .selectAll()
      .where("id", "=", input.applicationId)
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("applicantUserId", "=", ctx.user.id)
      .executeTakeFirst();

    if (!application) {
      return jsonResponse({ error: "Application not found" }, 404, { correlationId });
    }

    const profile = await db
      .selectFrom("applicantProfiles")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("userId", "=", ctx.user.id)
      .executeTakeFirst();

    if (!profile?.legalFullName || !profile?.postcode) {
      return jsonResponse(
        { error: "Profile is incomplete. Full name and postcode are required before submission." },
        400,
        { correlationId }
      );
    }

    const documentCountRow = await db
      .selectFrom("documents")
      .select(({ fn }) => fn.countAll<number>().as("count"))
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("applicationId", "=", application.id)
      .executeTakeFirst();

    const docCount = Number(documentCountRow?.count ?? 0);
    if (docCount < 1) {
      return jsonResponse({ error: "At least one supporting document is required." }, 400, {
        correlationId,
      });
    }

    const needs = await db
      .selectFrom("applicationNeeds")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .where("applicationId", "=", application.id)
      .executeTakeFirst();

    const textForModeration = [
      application.title,
      profile.legalFullName,
      profile.addressLine1,
      profile.postcode,
      needs?.accessibilityNeeds,
      needs?.medicalNeeds,
      needs?.supportNeeds,
    ]
      .filter(Boolean)
      .join("\n");

    let moderationDecision: "approved" | "pending_review" | "blocked" = "pending_review";

    try {
      const moderation = await moderateArtifact({
        organizationId: ctx.activeOrganizationId,
        createdByUserId: ctx.user.id,
        targetType: "application_field",
        targetId: String(application.id),
        text: textForModeration,
        correlationId,
      });
      moderationDecision = moderation.decision;
    } catch (error) {
      // AI outage fallback: keep strict gate and queue for manual review.
      moderationDecision = "pending_review";
    }

    const status = moderationDecision === "blocked" ? "needs_info" : "submitted";
    const caseStatus =
      moderationDecision === "approved"
        ? "in_review"
        : moderationDecision === "pending_review"
          ? "pending_moderation"
          : "needs_info";

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("applications")
        .set({
          status,
          submittedAt: moderationDecision === "blocked" ? null : new Date(),
          updatedAt: new Date(),
        })
        .where("id", "=", application.id)
        .execute();

      const existingCase = await trx
        .selectFrom("caseFiles")
        .select("id")
        .where("organizationId", "=", ctx.activeOrganizationId)
        .where("applicationId", "=", application.id)
        .executeTakeFirst();

      if (!existingCase) {
        await trx
          .insertInto("caseFiles")
          .values({
            organizationId: ctx.activeOrganizationId,
            applicationId: application.id,
            assignedCaseworkerUserId: null,
            priority: "medium",
            status: caseStatus,
            slaDueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          })
          .execute();
      } else {
        await trx
          .updateTable("caseFiles")
          .set({ status: caseStatus, updatedAt: new Date() })
          .where("id", "=", existingCase.id)
          .execute();
      }
    });

    return jsonResponse({
      applicationId: application.id,
      status,
      moderationDecision,
    }, 200, { correlationId });
  } catch (error) {
    return handleEndpointError(error);
  }
}
