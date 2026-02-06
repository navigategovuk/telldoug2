import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { ApplicantProfiles } from "../../../helpers/schema";

export const schema = z.object({
  legalFullName: z.string().optional(),
  nationalInsuranceNumber: z.string().optional(),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  consentAccepted: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { profile: Selectable<ApplicantProfiles> };

export async function postUpdateApplicantProfile(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/applicant/profile/update`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to update profile");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
