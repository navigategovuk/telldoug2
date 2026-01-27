import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Interactions, InteractionTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  personId: z.string().optional(),
  projectId: z.string().optional(),
  interactionType: z.enum(InteractionTypeArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type InteractionWithDetails = Selectable<Interactions> & {
  personName: string | null;
  projectName: string | null;
};

export type OutputType = {
  interactions: InteractionWithDetails[];
};

export const getInteractionsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.personId) {
    params.append("personId", input.personId);
  }
  if (input.projectId) {
    params.append("projectId", input.projectId);
  }
  if (input.interactionType) {
    params.append("interactionType", input.interactionType);
  }

  const result = await fetch(`/_api/interactions/list?${params.toString()}`, {
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