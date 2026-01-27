import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Jobs } from "../../helpers/schema";

export const schema = z.object({
  isCurrent: z.boolean().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  jobs: Selectable<Jobs>[];
};

export const getJobsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.isCurrent !== undefined) {
    params.append("isCurrent", String(input.isCurrent));
  }

  const result = await fetch(`/_api/jobs/list?${params.toString()}`, {
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