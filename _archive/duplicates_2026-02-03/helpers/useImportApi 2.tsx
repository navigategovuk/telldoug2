import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importLinkedIn, InputType, OutputType } from "../endpoints/import/linkedin_POST.schema";

export function useLinkedInImport() {
  const queryClient = useQueryClient();

  return useMutation<OutputType, Error, InputType>({
    mutationFn: (data) => importLinkedIn(data),
    onSuccess: () => {
      // Invalidate all relevant queries since import can touch many tables
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["institutions"] });
      queryClient.invalidateQueries({ queryKey: ["learning"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
    },
  });
}