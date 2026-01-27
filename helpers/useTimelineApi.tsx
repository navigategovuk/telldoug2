import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getTimelineData, OutputType } from "../endpoints/timeline/data_GET.schema";

export const TIMELINE_DATA_QUERY_KEY = ["timeline", "data"];

export function useTimelineData(options?: Omit<UseQueryOptions<OutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: TIMELINE_DATA_QUERY_KEY,
    queryFn: () => getTimelineData(),
    placeholderData: (prev) => prev,
    ...options,
  });
}