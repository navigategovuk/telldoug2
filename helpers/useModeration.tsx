import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getModerationQueue } from "../endpoints/moderation/queue_GET.schema";
import {
  postModerationDecision,
  InputType as ModerationDecisionInput,
} from "../endpoints/moderation/decision_POST.schema";
import { getCurrentPolicy } from "../endpoints/moderation/policy/current_GET.schema";
import { postPublishPolicy, InputType as PublishPolicyInput } from "../endpoints/moderation/policy/publish_POST.schema";

export const MODERATION_QUEUE_QUERY_KEY = ["moderation", "queue"] as const;
export const MODERATION_POLICY_QUERY_KEY = ["moderation", "policy", "current"] as const;

export function useModerationQueue() {
  return useQuery({
    queryKey: MODERATION_QUEUE_QUERY_KEY,
    queryFn: () => getModerationQueue(),
  });
}

export function useModerationDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ModerationDecisionInput) => postModerationDecision(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERATION_QUEUE_QUERY_KEY });
    },
  });
}

export function useCurrentPolicy() {
  return useQuery({
    queryKey: MODERATION_POLICY_QUERY_KEY,
    queryFn: () => getCurrentPolicy(),
  });
}

export function usePublishPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PublishPolicyInput) => postPublishPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MODERATION_POLICY_QUERY_KEY });
    },
  });
}
