import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Goals, GoalTypeArrayValues, GoalStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  goalType: z.enum(GoalTypeArrayValues).optional(),
  status: z.enum(GoalStatusArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  goals: Selectable<Goals>[];
};

export const getGoalsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.goalType) {
    params.append("goalType", input.goalType);
  }
  if (input.status) {
    params.append("status", input.status);
  }

  const result = await fetch(`/_api/goals/list?${params.toString()}`, {
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