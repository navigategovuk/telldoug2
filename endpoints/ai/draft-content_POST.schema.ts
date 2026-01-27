import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  content_type: z.enum(["linkedin_post", "article", "email"]),
  topic: z.string().min(1, "Topic is required"),
  context_notes: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  draft: string;
  contentType: string;
};

export const generateContentDraft = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/ai/draft-content`, {
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