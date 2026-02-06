import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { handleEndpointError } from "../../helpers/endpointError";
import { jsonResponse } from "../../helpers/http";

export async function handle(request: Request) {
  try {
    const ctx = await getServerUserSession(request);

    let query = db
      .selectFrom("documents")
      .selectAll()
      .where("organizationId", "=", ctx.activeOrganizationId)
      .orderBy("createdAt", "desc");

    if (ctx.activeMembershipRole === "applicant") {
      query = query.where("uploadedByUserId", "=", ctx.user.id);
    }

    const documents = await query.execute();
    return jsonResponse({ documents });
  } catch (error) {
    return handleEndpointError(error);
  }
}
