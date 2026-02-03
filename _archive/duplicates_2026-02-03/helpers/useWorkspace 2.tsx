import { useQuery } from "@tanstack/react-query";
import { getWorkspace } from "../endpoints/workspace_GET.schema";

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => getWorkspace(),
  });
}
