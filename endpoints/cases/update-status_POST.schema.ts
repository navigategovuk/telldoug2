import { z } from "zod";
import superjson from "superjson";
import { CasePriority } from "../../helpers/schema";

export const schema = z.object({
  caseFileId: z.number().int().positive(),
  status: z.string().min(2),
  priority: z.enum(["low", "medium", "high", "urgent"] as [CasePriority, ...CasePriority[]]).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true };

export async function postUpdateCaseStatus(body: InputType, init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/cases/update-status`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to update case status");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
