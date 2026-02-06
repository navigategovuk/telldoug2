import { db } from "../../helpers/db";
import { requirePermission } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./create_POST.schema";

export async function handle(request: Request) {
  try {
    const ctx = await requirePermission(request, "application:create_self");
    const input = schema.parse(await parseRequestBody(request));

    const application = await db
      .insertInto("applications")
      .values({
        organizationId: ctx.activeOrganizationId,
        applicantUserId: ctx.user.id,
        status: "draft",
        title: input.title ?? "Housing Support Application",
        lockVersion: 1,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return jsonResponse({ application });
  } catch (error) {
    return handleEndpointError(error);
  }
}
