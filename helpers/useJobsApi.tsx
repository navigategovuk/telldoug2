import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getJobsList, InputType as ListInput, OutputType as ListOutput } from "../endpoints/jobs/list_GET.schema";
import { createJob, InputType as CreateInput, OutputType as CreateOutput } from "../endpoints/jobs/create_POST.schema";
import { updateJob, InputType as UpdateInput, OutputType as UpdateOutput } from "../endpoints/jobs/update_POST.schema";
import { deleteJob, InputType as DeleteInput, OutputType as DeleteOutput } from "../endpoints/jobs/delete_POST.schema";

export const JOBS_QUERY_KEY = ["jobs"];

export function useJobsList(input: ListInput = {}, options?: Omit<UseQueryOptions<ListOutput>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...JOBS_QUERY_KEY, input],
    queryFn: () => getJobsList(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInput) => createJob(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInput) => updateJob(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInput) => deleteJob(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: JOBS_QUERY_KEY });
    },
  });
}