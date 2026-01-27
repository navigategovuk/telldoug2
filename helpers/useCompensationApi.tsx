import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getCompensationList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/compensation/list_GET.schema";
import { createCompensation, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/compensation/create_POST.schema";
import { updateCompensation, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/compensation/update_POST.schema";
import { deleteCompensation, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/compensation/delete_POST.schema";

export const COMPENSATION_QUERY_KEY = ["compensation"];

export function useCompensationList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...COMPENSATION_QUERY_KEY, input],
    queryFn: () => getCompensationList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateCompensation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createCompensation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPENSATION_QUERY_KEY });
    },
  });
}

export function useUpdateCompensation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateCompensation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPENSATION_QUERY_KEY });
    },
  });
}

export function useDeleteCompensation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteCompensation(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPENSATION_QUERY_KEY });
    },
  });
}