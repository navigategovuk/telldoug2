import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getInstitutionsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/institutions/list_GET.schema";
import { createInstitution, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/institutions/create_POST.schema";
import { updateInstitution, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/institutions/update_POST.schema";
import { deleteInstitution, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/institutions/delete_POST.schema";

export const INSTITUTIONS_QUERY_KEY = ["institutions"];

export function useInstitutionsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...INSTITUTIONS_QUERY_KEY, input],
    queryFn: () => getInstitutionsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createInstitution(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTITUTIONS_QUERY_KEY });
    },
  });
}

export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateInstitution(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTITUTIONS_QUERY_KEY });
    },
  });
}

export function useDeleteInstitution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteInstitution(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INSTITUTIONS_QUERY_KEY });
    },
  });
}