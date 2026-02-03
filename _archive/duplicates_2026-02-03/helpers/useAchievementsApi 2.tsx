import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getAchievementsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/achievements/list_GET.schema";
import { createAchievement, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/achievements/create_POST.schema";
import { updateAchievement, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/achievements/update_POST.schema";
import { deleteAchievement, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/achievements/delete_POST.schema";

export const ACHIEVEMENTS_QUERY_KEY = ["achievements"];

export function useAchievementsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...ACHIEVEMENTS_QUERY_KEY, input],
    queryFn: () => getAchievementsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createAchievement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateAchievement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    },
  });
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteAchievement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACHIEVEMENTS_QUERY_KEY });
    },
  });
}