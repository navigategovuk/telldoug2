import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Goals, GoalTypeArrayValues, GoalStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  targetDate: z.date(),
  goalType: z.enum(GoalTypeArrayValues),
  status: z.enum(GoalStatusArrayValues),
  notes: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  goal: Selectable<Goals>;
};

export const updateGoal = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/goals/update`, {
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