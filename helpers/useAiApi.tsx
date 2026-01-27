import { useMutation } from "@tanstack/react-query";
import { generateMeetingBrief, InputType as MeetingBriefInput, OutputType as MeetingBriefOutput } from "../endpoints/ai/meeting-brief_POST.schema";
import { generateContentDraft, InputType as DraftContentInput, OutputType as DraftContentOutput } from "../endpoints/ai/draft-content_POST.schema";

export function useGenerateMeetingBrief() {
  return useMutation<MeetingBriefOutput, Error, MeetingBriefInput>({
    mutationFn: (input) => generateMeetingBrief(input),
  });
}

export function useGenerateDraft() {
  return useMutation<DraftContentOutput, Error, DraftContentInput>({
    mutationFn: (input) => generateContentDraft(input),
  });
}