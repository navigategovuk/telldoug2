import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessageThread } from "../endpoints/messages/thread_GET.schema";
import {
  postSendMessage,
  InputType as SendMessageInput,
} from "../endpoints/messages/send_POST.schema";

export function messageThreadQueryKey(applicationId?: number) {
  return ["messages", "thread", applicationId ?? "latest"] as const;
}

export function useMessageThread(applicationId?: number) {
  return useQuery({
    queryKey: messageThreadQueryKey(applicationId),
    queryFn: () => getMessageThread(applicationId),
  });
}

export function useSendMessage(applicationId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageInput) => postSendMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageThreadQueryKey(applicationId) });
    },
  });
}
