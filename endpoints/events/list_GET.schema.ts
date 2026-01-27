import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { Events, EventTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  eventType: z.enum(EventTypeArrayValues).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  events: Selectable<Events>[];
};

export const getEventsList = async (input: InputType, init?: RequestInit): Promise<OutputType> => {
  const params = new URLSearchParams();
  if (input.eventType) {
    params.append("eventType", input.eventType);
  }
  if (input.startDate) {
    params.append("startDate", input.startDate.toISOString());
  }
  if (input.endDate) {
    params.append("endDate", input.endDate.toISOString());
  }

  const result = await fetch(`/_api/events/list?${params.toString()}`, {
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