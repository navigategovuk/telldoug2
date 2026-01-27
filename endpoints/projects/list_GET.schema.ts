import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Projects, ProjectStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  status: z.enum(ProjectStatusArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  projects: Selectable<Projects>[];
};

export const getProjectsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.status) {
    params.append("status", input.status);
  }

  const result = await fetch(`/_api/projects/list?${params.toString()}`, {
    method: "GET",
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