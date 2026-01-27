import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Learning, LearningTypeArrayValues, LearningStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  title: z.string().min(1, "Title is required"),
  provider: z.string().optional().nullable(),
  learningType: z.enum(LearningTypeArrayValues).default("course"),
  status: z.enum(LearningStatusArrayValues).default("planned"),
  startDate: z.date().optional().nullable(),
  completionDate: z.date().optional().nullable(),
  cost: z.number().optional().nullable(),
  skillsGained: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  learning: Selectable<Learning>;
};

export const createLearning = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/learning/create`, {
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