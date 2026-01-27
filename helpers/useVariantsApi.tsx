/**
 * React Query hooks for Resume Variants API
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
  listVariants, getVariant, createVariant, updateVariant, deleteVariant, duplicateVariant, setDefaultVariant,
  ListInputType, ListOutputType,
  GetInputType, GetOutputType,
  CreateInputType, CreateOutputType as _CreateOutputType,
  UpdateInputType, UpdateOutputType as _UpdateOutputType,
  DeleteInputType, DeleteOutputType as _DeleteOutputType,
  DuplicateInputType, DuplicateOutputType as _DuplicateOutputType,
  SetPrimaryInputType, SetPrimaryOutputType as _SetPrimaryOutputType,
} from "../endpoints/variants/variants.schema";

export const VARIANTS_QUERY_KEY = ["variants"];

export function useVariants(input: ListInputType = {}, options?: Omit<UseQueryOptions<ListOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...VARIANTS_QUERY_KEY, input],
    queryFn: () => listVariants(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useVariant(input: GetInputType, options?: Omit<UseQueryOptions<GetOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...VARIANTS_QUERY_KEY, "detail", input.id],
    queryFn: () => getVariant(input),
    enabled: !!input.id,
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInputType) => createVariant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY });
    },
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInputType) => updateVariant(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...VARIANTS_QUERY_KEY, "detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY });
    },
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInputType) => deleteVariant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY });
    },
  });
}

export function useDuplicateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DuplicateInputType) => duplicateVariant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY });
    },
  });
}

export function useSetPrimaryVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetPrimaryInputType) => setDefaultVariant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_QUERY_KEY });
    },
  });
}
