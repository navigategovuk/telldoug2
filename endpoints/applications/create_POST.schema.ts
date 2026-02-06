import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Applications } from "../../helpers/schema";

export const schema = z.object({
  title: z.string().min(2).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { application: Selectable<Applications> };

export async function postCreateApplication(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/applications/create`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to create application");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
