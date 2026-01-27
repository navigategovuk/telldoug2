import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Learning, LearningTypeArrayValues, LearningStatusArrayValues } from "../../helpers/schema";

export const schema = z.object({
  search: z.string().optional(),
  learningType: z.enum(LearningTypeArrayValues).optional(),
  status: z.enum(LearningStatusArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  learning: Selectable<Learning>[];
};

export const getLearningList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.search) {
    params.append("search", input.search);
  }
  if (input.learningType) {
    params.append("learningType", input.learningType);
  }
  if (input.status) {
    params.append("status", input.status);
  }

  const result = await fetch(`/_api/learning/list?${params.toString()}`, {
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