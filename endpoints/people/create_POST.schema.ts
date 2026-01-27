import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { People } from "../../helpers/schema";

export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  role: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  relationshipType: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  person: Selectable<People>;
};

export const createPerson = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/people/create`, {
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