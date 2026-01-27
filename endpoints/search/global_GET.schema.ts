import { z } from "zod";
import superjson from 'superjson';

export const schema = z.object({
  query: z.string().min(1)
});

export type InputType = z.infer<typeof schema>;

export type SearchResult = {
  entityType: "person" | "job" | "project" | "skill" | "event" | "content";
  id: string;
  title: string;
  subtitle: string;
  url: string;
};

export type OutputType = {
  results: SearchResult[];
  totalCount: number;
};

export const searchGlobal = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  params.append("query", input.query);

  const result = await fetch(`/_api/search/global?${params.toString()}`, {
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