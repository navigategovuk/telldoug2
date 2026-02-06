import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentApplication } from "../endpoints/applications/current_GET.schema";
import {
  postCreateApplication,
  InputType as CreateApplicationInput,
} from "../endpoints/applications/create_POST.schema";
import {
  postUpdateApplication,
  InputType as UpdateApplicationInput,
} from "../endpoints/applications/update_POST.schema";
import {
  postSubmitApplication,
  InputType as SubmitApplicationInput,
} from "../endpoints/applications/submit_POST.schema";
import {
  postEligibilityPrecheck,
  InputType as EligibilityInput,
} from "../endpoints/ai/eligibility/precheck_POST.schema";

export const CURRENT_APPLICATION_QUERY_KEY = ["applications", "current"] as const;

export function useCurrentApplication() {
  return useQuery({
    queryKey: CURRENT_APPLICATION_QUERY_KEY,
    queryFn: () => getCurrentApplication(),
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplicationInput) => postCreateApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_APPLICATION_QUERY_KEY });
    },
  });
}

export function useUpdateApplication() {
  return useMutation({
    mutationFn: (data: UpdateApplicationInput) => postUpdateApplication(data),
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitApplicationInput) => postSubmitApplication(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CURRENT_APPLICATION_QUERY_KEY });
    },
  });
}

export function useEligibilityPrecheck() {
  return useMutation({
    mutationFn: (data: EligibilityInput) => postEligibilityPrecheck(data),
  });
}
