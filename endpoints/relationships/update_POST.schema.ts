import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Relationships } from "../../helpers/schema";

export const schema = z.object({
  id: z.string(),
  relationshipLabel: z.string().min(1, "Relationship label is required"),
  notes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  relationship: Selectable<Relationships>;
};

export const updateRelationship = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/relationships/update`, {
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