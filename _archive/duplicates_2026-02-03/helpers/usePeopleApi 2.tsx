import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getPeopleList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/people/list_GET.schema";
import { createPerson, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/people/create_POST.schema";
import { updatePerson, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/people/update_POST.schema";
import { deletePerson, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/people/delete_POST.schema";

export const PEOPLE_QUERY_KEY = ["people"];

export function usePeopleList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...PEOPLE_QUERY_KEY, input],
    queryFn: () => getPeopleList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createPerson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updatePerson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deletePerson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PEOPLE_QUERY_KEY });
    },
  });
}