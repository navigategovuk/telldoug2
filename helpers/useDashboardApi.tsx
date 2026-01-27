import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getDashboardStats, OutputType } from "../endpoints/dashboard/stats_GET.schema";

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard", "stats"];

export function useDashboardStats(options?: Omit<UseQueryOptions<OutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: () => getDashboardStats(),
    placeholderData: (prev) => prev,
    ...options,
  });
}