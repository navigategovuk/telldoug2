import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  applicationId: z.number().int().positive().optional(),
  profile: z.record(z.any()).optional(),
  application: z.record(z.any()).optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = {
  provisionalOutcome: "likely_eligible" | "uncertain" | "likely_ineligible";
  confidence: number;
  missingEvidence: string[];
  nextSteps: string[];
  rationale: string;
  label: string;
  providerFallback?: boolean;
};

export async function postEligibilityPrecheck(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/ai/eligibility/precheck`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Eligibility precheck failed");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
