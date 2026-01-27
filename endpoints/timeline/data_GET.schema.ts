import { z } from "zod";
import superjson from 'superjson';

// No input needed for timeline data (fetches all)
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type TimelineItemType = "job" | "institution" | "event" | "project" | "achievement" | "feedback" | "goal" | "compensation" | "learning" | "content";

export type TimelineItem = {
  type: TimelineItemType;
  id: string;
  title: string;
  subtitle: string;
  startDate: Date;
  endDate: Date | null;
  linkedPeople: { id: string; name: string }[];
  linkedPeopleCount: number;
};

export type TimelineYear = {
  year: number;
  items: TimelineItem[];
};

export type OutputType = {
  years: TimelineYear[];
  allPeople: { id: string; name: string }[];
};

export const getTimelineData = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/timeline/data`, {
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