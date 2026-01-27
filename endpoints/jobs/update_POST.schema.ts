import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Jobs } from "../../helpers/schema";

export const schema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  isCurrent: z.boolean().default(false),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  job: Selectable<Jobs>;
};

export const updateJob = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/jobs/update`, {
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