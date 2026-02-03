import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getRelationshipsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/relationships/list_GET.schema";
import { createRelationship, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/relationships/create_POST.schema";
import { updateRelationship, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/relationships/update_POST.schema";
import { deleteRelationship, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/relationships/delete_POST.schema";

export const RELATIONSHIPS_QUERY_KEY = ["relationships"];

export function useRelationshipsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...RELATIONSHIPS_QUERY_KEY, input],
    queryFn: () => getRelationshipsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createRelationship(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}

export function useUpdateRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateRelationship(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteRelationship(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}