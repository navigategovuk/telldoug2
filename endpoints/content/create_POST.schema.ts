import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Content, ContentTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  title: z.string().min(1, "Title is required"),
  contentType: z.enum(ContentTypeArrayValues).default("article"),
  publicationDate: z.date(),
  platform: z.string().optional().nullable(),
  url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  description: z.string().optional().nullable(),
  engagementMetrics: z.string().optional().nullable(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  content: Selectable<Content>;
};

export const createContent = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/content/create`, {
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