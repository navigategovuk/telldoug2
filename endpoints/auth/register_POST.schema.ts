import { z } from "zod";
import superjson from "superjson";
import { SessionContext } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2),
  organizationId: z.number().optional(),
});

export type OutputType = SessionContext;

export async function postRegister(
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/auth/register`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? parsed?.message ?? "Registration failed");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
