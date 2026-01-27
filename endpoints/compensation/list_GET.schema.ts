import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Compensation } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type CompensationWithJob = Selectable<Compensation> & { jobTitle: string; jobCompany: string };

export type OutputType = {
  compensation: CompensationWithJob[];
};

export const getCompensationList = async (input: InputType = {}, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/compensation/list`, {
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