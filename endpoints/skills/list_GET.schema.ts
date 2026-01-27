import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Skills } from "../../helpers/schema";

export const schema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  skills: Selectable<Skills>[];
};

export const getSkillsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.search) {
    params.append("search", input.search);
  }
  if (input.category) {
    params.append("category", input.category);
  }

  const result = await fetch(`/_api/skills/list?${params.toString()}`, {
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