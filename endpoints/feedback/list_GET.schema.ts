import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Feedback, FeedbackTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  feedbackType: z.enum(FeedbackTypeArrayValues).optional(),
  personId: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type FeedbackWithPerson = Selectable<Feedback> & { personName: string };

export type OutputType = {
  feedback: FeedbackWithPerson[];
};

export const getFeedbackList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.feedbackType) {
    params.append("feedbackType", input.feedbackType);
  }
  if (input.personId) {
    params.append("personId", input.personId);
  }

  const result = await fetch(`/_api/feedback/list?${params.toString()}`, {
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