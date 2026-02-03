import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getInteractionsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/interactions/list_GET.schema";
import { createInteraction, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/interactions/create_POST.schema";
import { updateInteraction, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/interactions/update_POST.schema";
import { deleteInteraction, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/interactions/delete_POST.schema";

export const INTERACTIONS_QUERY_KEY = ["interactions"];

export function useInteractionsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...INTERACTIONS_QUERY_KEY, input],
    queryFn: () => getInteractionsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createInteraction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERACTIONS_QUERY_KEY });
    },
  });
}

export function useUpdateInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateInteraction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERACTIONS_QUERY_KEY });
    },
  });
}

export function useDeleteInteraction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteInteraction(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INTERACTIONS_QUERY_KEY });
    },
  });
}