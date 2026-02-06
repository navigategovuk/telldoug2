import superjson from "superjson";
import { Selectable } from "kysely";
import { ApplicantProfiles } from "../../helpers/schema";

export type OutputType = { profile: Selectable<ApplicantProfiles> };

export async function getApplicantProfile(init?: RequestInit): Promise<OutputType> {
  const result = await fetch(`/_api/applicant/profile`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to fetch profile");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
