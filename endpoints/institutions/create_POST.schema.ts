import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Institutions, InstitutionTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(InstitutionTypeArrayValues).default("university"),
  location: z.string().optional().nullable(),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  institution: Selectable<Institutions>;
};

export const createInstitution = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/institutions/create`, {
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