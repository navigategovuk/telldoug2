import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getContentList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/content/list_GET.schema";
import { createContent, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/content/create_POST.schema";
import { updateContent, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/content/update_POST.schema";
import { deleteContent, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/content/delete_POST.schema";

export const CONTENT_QUERY_KEY = ["content"];

export function useContentList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...CONTENT_QUERY_KEY, input],
    queryFn: () => getContentList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createContent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateContent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteContent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONTENT_QUERY_KEY });
    },
  });
}