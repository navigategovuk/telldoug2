import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCaseQueue } from "../endpoints/cases/queue_GET.schema";
import { getCaseDetail } from "../endpoints/cases/detail_GET.schema";
import { postAssignCase, InputType as AssignCaseInput } from "../endpoints/cases/assign_POST.schema";
import {
  postUpdateCaseStatus,
  InputType as UpdateCaseStatusInput,
} from "../endpoints/cases/update-status_POST.schema";
import { postAddCaseNote, InputType as AddCaseNoteInput } from "../endpoints/cases/add-note_POST.schema";

export const CASE_QUEUE_QUERY_KEY = ["cases", "queue"] as const;

export function caseDetailQueryKey(caseId: number) {
  return ["cases", "detail", caseId] as const;
}

export function useCaseQueue() {
  return useQuery({
    queryKey: CASE_QUEUE_QUERY_KEY,
    queryFn: () => getCaseQueue(),
  });
}

export function useCaseDetail(caseId: number) {
  return useQuery({
    queryKey: caseDetailQueryKey(caseId),
    queryFn: () => getCaseDetail(caseId),
    enabled: Number.isFinite(caseId) && caseId > 0,
  });
}

export function useAssignCase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignCaseInput) => postAssignCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASE_QUEUE_QUERY_KEY });
    },
  });
}

export function useUpdateCaseStatus(caseId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCaseStatusInput) => postUpdateCaseStatus(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASE_QUEUE_QUERY_KEY });
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: caseDetailQueryKey(caseId) });
      }
    },
  });
}

export function useAddCaseNote(caseId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCaseNoteInput) => postAddCaseNote(data),
    onSuccess: () => {
      if (caseId) {
        queryClient.invalidateQueries({ queryKey: caseDetailQueryKey(caseId) });
      }
    },
  });
}
