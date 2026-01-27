import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  csvData: z.string(),
  fileName: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  detectedType: string;
  imported: { entity: string, count: number }[];
  skipped: number;
  errors: string[];
};

export const importLinkedIn = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/import/linkedin`, {
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
    throw new Error(errorObject.error || "Failed to import data");
  }
  return superjson.parse<OutputType>(await result.text());
};