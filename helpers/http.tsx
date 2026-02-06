import superjson from "superjson";
import { ApiErrorEnvelope, ApiSuccessEnvelope } from "../contracts/apiEnvelope";

export async function parseRequestBody<T>(request: Request): Promise<T> {
  const text = await request.text();
  if (!text) {
    return {} as T;
  }

  try {
    return superjson.parse<T>(text);
  } catch {
    return JSON.parse(text) as T;
  }
}

function errorCodeForStatus(status: number): string {
  if (status === 400) return "bad_request";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation_error";
  if (status >= 500) return "internal_error";
  return `http_${status}`;
}

function errorMessageFromBody(body: unknown): string {
  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }
  if (body && typeof body === "object") {
    const maybeBody = body as Record<string, unknown>;
    const error = maybeBody.error;
    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }
    const message = maybeBody.message;
    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }
  return "Unexpected error";
}

export function jsonResponse(
  body: unknown,
  status = 200,
  init: {
    correlationId?: string;
  } = {}
): Response {
  const correlationId = init.correlationId ?? crypto.randomUUID();
  const payload: ApiSuccessEnvelope<unknown> | ApiErrorEnvelope =
    status >= 400
      ? {
          error: {
            code: errorCodeForStatus(status),
            message: errorMessageFromBody(body),
          },
          correlationId,
        }
      : {
          data: body,
          correlationId,
        };

  return new Response(superjson.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "x-correlation-id": correlationId,
    },
  });
}
