import superjson from "superjson";
import { SessionContext } from "../../helpers/User";

export type OutputType = {
  memberships: SessionContext["memberships"];
  activeOrganizationId: number;
};

export async function getMyOrganizations(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/orgs/mine`, {
    method: "GET",
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to load organizations");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
