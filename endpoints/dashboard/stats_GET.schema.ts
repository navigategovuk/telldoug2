import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import { InteractionType, Events, GoalType, GoalStatus, SkillProficiency, FeedbackType, ContentType } from "../../helpers/schema";

// No input needed for dashboard stats
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type StaleContact = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  daysSinceLastInteraction: number | null; // null means never contacted
  lastInteractionDate: Date | null;
};

export type ProductiveTypeStat = {
  type: InteractionType;
  count: number;
};

export type TopConnector = {
  id: string;
  name: string;
  company: string | null;
  projectCount: number;
  eventCount: number;
  totalConnections: number;
};

export type RecentInteraction = {
  id: string;
  interactionDate: Date;
  interactionType: InteractionType;
  notes: string | null;
  personName: string | null;
  projectName: string | null;
};

export type GoalProgressItem = {
  id: string;
  title: string;
  goalType: GoalType;
  status: GoalStatus;
  targetDate: Date;
  daysUntilTarget: number | null; // null if past due
  isOverdue: boolean;
};

export type SkillsGrowthData = {
  totalSkills: number;
  skillsAddedLast12Months: number;
  byProficiency: { proficiency: SkillProficiency; count: number }[];
  recentSkills: { id: string; name: string; createdAt: Date; proficiency: SkillProficiency }[];
};

export type FeedbackThemesData = {
  totalFeedbackLast90Days: number;
  byType: { type: FeedbackType; count: number }[];
  recentFeedback: { id: string; feedbackType: FeedbackType; feedbackDate: Date; personName: string | null; notesPreview: string }[];
};

export type ContentActivityData = {
  totalContent: number;
  byType: { type: ContentType; count: number }[];
  recentContent: { id: string; title: string; contentType: ContentType; publicationDate: Date; platform: string | null }[];
  thisYearCount: number;
};

export type OutputType = {
  staleContacts: StaleContact[];
  productiveInteractionTypes: ProductiveTypeStat[];
  topConnectors: TopConnector[];
  recentActivity: {
    recentInteractions: RecentInteraction[];
    upcomingEvents: Selectable<Events>[];
  };
  goalsProgress: GoalProgressItem[];
  skillsGrowth: SkillsGrowthData;
  feedbackThemes: FeedbackThemesData;
  contentActivity: ContentActivityData;
};

export const getDashboardStats = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/dashboard/stats`, {
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