import { requireAnyRole } from "../../../helpers/authorize";
import { handleEndpointError } from "../../../helpers/endpointError";
import { jsonResponse } from "../../../helpers/http";
import { getActivePolicyVersion } from "../../../helpers/policyEngine";

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["caseworker", "platform_admin"]);

    const policy = await getActivePolicyVersion(ctx.activeOrganizationId);
    return jsonResponse({
      policy: policy
        ? {
            id: policy.id,
            versionNumber: policy.versionNumber,
            title: policy.title,
            rules: policy.rules,
            isActive: policy.isActive,
            createdAt: new Date(policy.createdAt as any).toISOString(),
          }
        : null,
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
