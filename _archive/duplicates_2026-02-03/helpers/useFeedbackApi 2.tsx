import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getFeedbackList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/feedback/list_GET.schema";
import { createFeedback, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/feedback/create_POST.schema";
import { updateFeedback, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/feedback/update_POST.schema";
import { deleteFeedback, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/feedback/delete_POST.schema";

export const FEEDBACK_QUERY_KEY = ["feedback"];

export function useFeedbackList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...FEEDBACK_QUERY_KEY, input],
    queryFn: () => getFeedbackList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createFeedback(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
    },
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateFeedback(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteFeedback(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEY });
    },
  });
}