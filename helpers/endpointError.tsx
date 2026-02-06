import { jsonResponse } from "./http";
import { ForbiddenError } from "./getServerUserSession";
import { NotAuthenticatedError } from "./getSetServerSession";

export function handleEndpointError(error: unknown): Response {
  if (error instanceof NotAuthenticatedError) {
    return jsonResponse({ error: error.message || "Not authenticated" }, 401);
  }

  if (error instanceof ForbiddenError) {
    return jsonResponse({ error: error.message || "Forbidden" }, 403);
  }

  if (error instanceof Error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ error: "Unexpected error" }, 500);
}
