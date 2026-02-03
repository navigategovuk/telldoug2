import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getGoalsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/goals/list_GET.schema";
import { createGoal, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/goals/create_POST.schema";
import { updateGoal, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/goals/update_POST.schema";
import { deleteGoal, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/goals/delete_POST.schema";

export const GOALS_QUERY_KEY = ["goals"];

export function useGoalsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...GOALS_QUERY_KEY, input],
    queryFn: () => getGoalsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteGoal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    },
  });
}