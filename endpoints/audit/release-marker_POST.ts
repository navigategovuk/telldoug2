import { requireAnyRole } from "../../helpers/authorize";
import { db } from "../../helpers/db";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./release-marker_POST.schema";

export async function handle(request: Request) {
  try {
    const input = schema.parse(await parseRequestBody(request));
    const serviceToken = request.headers.get("x-release-marker-token");
    const configuredServiceToken = process.env.RELEASE_MARKER_TOKEN;

    let organizationId: number;
    let actorUserId: number | null;
    let markerSource: "platform_admin" | "release_service_token";

    if (
      configuredServiceToken &&
      serviceToken &&
      serviceToken.length > 0 &&
      serviceToken === configuredServiceToken
    ) {
      organizationId = Number(input.organizationId ?? process.env.RELEASE_MARKER_ORG_ID ?? 0);
      if (!Number.isFinite(organizationId) || organizationId <= 0) {
        return jsonResponse(
          { error: "organizationId is required for service-token release markers" },
          400
        );
      }
      actorUserId = null;
      markerSource = "release_service_token";
    } else {
      const ctx = await requireAnyRole(request, ["platform_admin"]);
      organizationId = ctx.activeOrganizationId;
      actorUserId = ctx.user.id;
      markerSource = "platform_admin";
    }

    const inserted = await db
      .insertInto("auditEvents")
      .values({
        organizationId,
        actorUserId,
        eventType: "release.marker",
        entityType: "release",
        entityId: input.version,
        metadata: {
          environment: input.environment,
          commitSha: input.commitSha,
          imageDigest: input.imageDigest,
          migrationVersion: input.migrationVersion,
          markerSource,
          ...((input.metadata ?? null) as any),
        } as any,
        correlationId: input.correlationId ?? null,
      })
      .returning(["id", "createdAt"])
      .executeTakeFirstOrThrow();

    return jsonResponse({
      marker: {
        id: inserted.id,
        version: input.version,
        environment: input.environment,
        commitSha: input.commitSha,
        imageDigest: input.imageDigest,
        migrationVersion: input.migrationVersion,
        metadata: input.metadata ?? null,
        createdAt: new Date(inserted.createdAt as any).toISOString(),
      },
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
