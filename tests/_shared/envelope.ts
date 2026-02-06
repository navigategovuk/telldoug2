import superjson from "superjson";

export function successEnvelope<T>(data: T) {
  return {
    data,
    correlationId: "test-correlation-id",
  };
}

export function errorEnvelope(message: string, code = "bad_request") {
  return {
    error: {
      code,
      message,
    },
    correlationId: "test-correlation-id",
  };
}

export async function parseResponse(response: Response) {
  const text = await response.text();
  return text ? superjson.parse<any>(text) : null;
}
