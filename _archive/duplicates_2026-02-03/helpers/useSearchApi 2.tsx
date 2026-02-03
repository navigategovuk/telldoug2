import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { searchGlobal, InputType, OutputType } from "../endpoints/search/global_GET.schema";

export const SEARCH_QUERY_KEY = ["search", "global"];

export function useGlobalSearch(
  query: string, 
  options?: Omit<UseQueryOptions<OutputType>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: [...SEARCH_QUERY_KEY, query],
    queryFn: () => searchGlobal({ query }),
    enabled: query.length >= 2,
    placeholderData: (prev) => prev,
    ...options,
  });
}