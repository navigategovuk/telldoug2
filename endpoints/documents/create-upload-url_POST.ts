import { requireAnyRole } from "../../helpers/authorize";
import { handleEndpointError } from "../../helpers/endpointError";
import { parseRequestBody, jsonResponse } from "../../helpers/http";
import { schema } from "./create-upload-url_POST.schema";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
]);

export async function handle(request: Request) {
  try {
    const ctx = await requireAnyRole(request, ["applicant", "caseworker", "platform_admin"]);
    const input = schema.parse(await parseRequestBody(request));

    if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
      return jsonResponse({ error: "Unsupported file type" }, 400);
    }

    if (input.fileSize > 25 * 1024 * 1024) {
      return jsonResponse({ error: "File exceeds 25MB limit" }, 400);
    }

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${ctx.activeOrganizationId}/${crypto.randomUUID()}-${safeName}`;

    // Placeholder URL for local/dev mode. Replace with object-storage presigned URL in production.
    return jsonResponse({
      uploadUrl: `/uploads/${storageKey}`,
      storageKey,
      expiresInSeconds: 900,
    });
  } catch (error) {
    return handleEndpointError(error);
  }
}
