import { ModerationDecision } from "./schema";

export type ModerationTone = "success" | "warning" | "danger";

export interface ModerationPresentation {
  label: string;
  tone: ModerationTone;
  nextStep: string;
}

export function moderationPresentation(
  decision: ModerationDecision,
  subject: string
): ModerationPresentation {
  if (decision === "approved") {
    return {
      label: "Approved",
      tone: "success",
      nextStep: `${subject} is visible to your caseworker.`,
    };
  }

  if (decision === "blocked") {
    return {
      label: "Blocked",
      tone: "danger",
      nextStep: `${subject} is hidden. Update content and resubmit, or wait for caseworker guidance.`,
    };
  }

  return {
    label: "Pending Review",
    tone: "warning",
    nextStep: `${subject} is hidden until a caseworker completes manual review.`,
  };
}

export function moderationToneColor(tone: ModerationTone): string {
  if (tone === "success") return "#0f766e";
  if (tone === "danger") return "#b91c1c";
  return "#92400e";
}
