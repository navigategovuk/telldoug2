import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Achievements, AchievementCategoryArrayValues } from "../../helpers/schema";

export const schema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  achievedDate: z.date(),
  category: z.enum(AchievementCategoryArrayValues),
  quantifiableImpact: z.string().optional().nullable(),
  evidenceUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  achievement: Selectable<Achievements>;
};

export const updateAchievement = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/achievements/update`, {
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