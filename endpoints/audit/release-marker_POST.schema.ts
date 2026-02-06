import { z } from "zod";
import superjson from "superjson";
import { ReleaseMarker } from "../../contracts/platformTypes";

export const schema = z.object({
  version: z.string().min(1),
  environment: z.enum(["dev", "staging", "production"]),
  commitSha: z.string().min(7),
  imageDigest: z.string().min(10),
  migrationVersion: z.string().min(1),
  organizationId: z.number().int().positive().optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  marker: ReleaseMarker & {
    createdAt: string;
  };
};

export async function postReleaseMarker(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/audit/release-marker`, {
    method: "POST",
    body: superjson.stringify(schema.parse(body)),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const text = await result.text();
  if (!result.ok) {
    const parsed = text ? superjson.parse<any>(text) : null;
    throw new Error(
      (typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ??
        "Failed to create release marker"
    );
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody
    ? parsedBody.data
    : parsedBody) as OutputType;
}
