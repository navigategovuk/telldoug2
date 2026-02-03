import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getProjectsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/projects/list_GET.schema";
import { createProject, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/projects/create_POST.schema";
import { updateProject, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/projects/update_POST.schema";
import { deleteProject, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/projects/delete_POST.schema";

export const PROJECTS_QUERY_KEY = ["projects"];

export function useProjectsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, input],
    queryFn: () => getProjectsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteProject(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}