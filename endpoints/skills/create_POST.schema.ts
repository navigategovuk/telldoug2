import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Skills, SkillProficiencyArrayValues } from "../../helpers/schema";

export const schema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional().nullable(),
  proficiency: z.enum(SkillProficiencyArrayValues).default("beginner"),
  notes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  skill: Selectable<Skills>;
};

export const createSkill = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/skills/create`, {
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