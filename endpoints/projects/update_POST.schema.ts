import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Projects, ProjectStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  status: z.enum(ProjectStatusArrayValues),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  project: Selectable<Projects>;
};

export const updateProject = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/projects/update`, {
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