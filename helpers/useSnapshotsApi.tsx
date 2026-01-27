/**
 * React Query hooks for Version Snapshots API
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
  listSnapshots, getSnapshot, createSnapshot, deleteSnapshot, restoreSnapshot,
  ListInputType, ListOutputType,
  GetInputType, GetOutputType,
  CreateInputType, CreateOutputType,
  DeleteInputType, DeleteOutputType,
  RestoreInputType, RestoreOutputType,
} from "../endpoints/snapshots/snapshots.schema";

export const SNAPSHOTS_QUERY_KEY = ["snapshots"];

export function useSnapshots(input: ListInputType, options?: Omit<UseQueryOptions<ListOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...SNAPSHOTS_QUERY_KEY, input.resumeVariantId],
    queryFn: () => listSnapshots(input),
    enabled: !!input.resumeVariantId,
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useSnapshot(input: GetInputType, options?: Omit<UseQueryOptions<GetOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...SNAPSHOTS_QUERY_KEY, "detail", input.id],
    queryFn: () => getSnapshot(input),
    enabled: !!input.id,
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInputType) => createSnapshot(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...SNAPSHOTS_QUERY_KEY, variables.resumeVariantId] });
    },
  });
}

export function useDeleteSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInputType) => deleteSnapshot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SNAPSHOTS_QUERY_KEY });
    },
  });
}

export function useRestoreSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RestoreInputType) => restoreSnapshot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SNAPSHOTS_QUERY_KEY });
    },
  });
}
