import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Achievements, AchievementCategoryArrayValues } from "../../helpers/schema";

export const schema = z.object({
  category: z.enum(AchievementCategoryArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  achievements: Selectable<Achievements>[];
};

export const getAchievementsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.category) {
    params.append("category", input.category);
  }

  const result = await fetch(`/_api/achievements/list?${params.toString()}`, {
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