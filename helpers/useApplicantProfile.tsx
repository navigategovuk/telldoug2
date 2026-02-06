import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplicantProfile } from "../endpoints/applicant/profile_GET.schema";
import {
  postUpdateApplicantProfile,
  InputType as UpdateApplicantProfileInput,
} from "../endpoints/applicant/profile/update_POST.schema";

export const APPLICANT_PROFILE_QUERY_KEY = ["applicant", "profile"] as const;

export function useApplicantProfile() {
  return useQuery({
    queryKey: APPLICANT_PROFILE_QUERY_KEY,
    queryFn: () => getApplicantProfile(),
  });
}

export function useUpdateApplicantProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicantProfileInput) => postUpdateApplicantProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICANT_PROFILE_QUERY_KEY });
    },
  });
}
