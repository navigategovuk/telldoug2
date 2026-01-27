import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Compensation } from "../../helpers/schema";

export const schema = z.object({
  id: z.string(),
  jobId: z.string().min(1, "Job is required"),
  effectiveDate: z.date(),
  baseSalary: z.number().min(0, "Base salary must be positive"),
  currency: z.string().default("GBP"),
  bonus: z.number().optional().nullable(),
  equityValue: z.number().optional().nullable(),
  benefitsNote: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  compensation: Selectable<Compensation>;
};

export const updateCompensation = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/compensation/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }
  return superjson.parse<OutputType>(await result.text());
};