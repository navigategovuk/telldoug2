import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getLearningList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/learning/list_GET.schema";
import { createLearning, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/learning/create_POST.schema";
import { updateLearning, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/learning/update_POST.schema";
import { deleteLearning, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/learning/delete_POST.schema";

export const LEARNING_QUERY_KEY = ["learning"];

export function useLearningList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...LEARNING_QUERY_KEY, input],
    queryFn: () => getLearningList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createLearning(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_QUERY_KEY });
    },
  });
}

export function useUpdateLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateLearning(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_QUERY_KEY });
    },
  });
}

export function useDeleteLearning() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteLearning(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEARNING_QUERY_KEY });
    },
  });
}