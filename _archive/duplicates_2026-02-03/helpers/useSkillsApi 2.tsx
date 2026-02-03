import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getSkillsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/skills/list_GET.schema";
import { createSkill, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/skills/create_POST.schema";
import { updateSkill, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/skills/update_POST.schema";
import { deleteSkill, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/skills/delete_POST.schema";

export const SKILLS_QUERY_KEY = ["skills"];

export function useSkillsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...SKILLS_QUERY_KEY, input],
    queryFn: () => getSkillsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createSkill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateSkill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteSkill(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
    },
  });
}