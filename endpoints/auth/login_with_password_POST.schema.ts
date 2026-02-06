import { z } from "zod";
import superjson from "superjson";
import { SessionContext } from "../../helpers/User";

export const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type OutputType = {
  mfaRequired: boolean;
  message?: string;
  context?: SessionContext;
};

export async function postLogin(
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/auth/login_with_password`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? parsed?.message ?? "Login failed");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
