import { z } from "zod";
import superjson from "superjson";

const householdMemberSchema = z.object({
  fullName: z.string().min(1),
  relationship: z.string().min(1),
  dateOfBirth: z.string().optional(),
  employmentStatus: z.string().optional(),
});

const incomeRecordSchema = z.object({
  incomeType: z.string().min(1),
  amount: z.union([z.number(), z.string()]),
  frequency: z.string().min(1),
});

const needsSchema = z.object({
  accessibilityNeeds: z.string().optional(),
  medicalNeeds: z.string().optional(),
  supportNeeds: z.string().optional(),
  structuredNeeds: z.record(z.any()).optional(),
});

export const schema = z.object({
  applicationId: z.number().int().positive(),
  title: z.string().min(2).optional(),
  householdMembers: z.array(householdMemberSchema).optional(),
  incomeRecords: z.array(incomeRecordSchema).optional(),
  needs: needsSchema.optional(),
});

export type InputType = z.infer<typeof schema>;
export type OutputType = { ok: true };

export async function postUpdateApplication(
  body: InputType,
  init?: RequestInit
): Promise<OutputType> {
  const result = await fetch(`/_api/applications/update`, {
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
    throw new Error((typeof parsed?.error === "string" ? parsed.error : parsed?.error?.message) ?? "Failed to update application");
  }

  const parsedBody = superjson.parse<any>(text);
  return (parsedBody && typeof parsedBody === "object" && "data" in parsedBody ? parsedBody.data : parsedBody) as OutputType;
}
