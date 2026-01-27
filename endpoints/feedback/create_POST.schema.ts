import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Feedback, FeedbackTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  personId: z.string().min(1, "Person is required"),
  feedbackDate: z.date(),
  feedbackType: z.enum(FeedbackTypeArrayValues),
  context: z.string().optional().nullable(),
  notes: z.string().min(1, "Notes are required"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  feedback: Selectable<Feedback>;
};

export const createFeedback = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/feedback/create`, {
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