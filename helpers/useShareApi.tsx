/**
 * React Query hooks for Share Links API
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import {
  listShareLinks, createShareLink, updateShareLink, deleteShareLink, revokeShareLink, viewShareLink,
  ListInputType, ListOutputType,
  CreateInputType, CreateOutputType,
  UpdateInputType, UpdateOutputType,
  DeleteInputType, DeleteOutputType,
  RevokeInputType, RevokeOutputType,
  ViewInputType, ViewOutputType,
} from "../endpoints/share/share.schema";

export const SHARE_QUERY_KEY = ["share"];

export function useShareLinks(input: ListInputType = {}, options?: Omit<UseQueryOptions<ListOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...SHARE_QUERY_KEY, input],
    queryFn: () => listShareLinks(input),
    placeholderData: (prev) => prev,
    ...options,
  });
}

export function useShareLinkView(input: ViewInputType, options?: Omit<UseQueryOptions<ViewOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...SHARE_QUERY_KEY, "view", input.token],
    queryFn: () => viewShareLink(input),
    enabled: !!input.token,
    staleTime: 60000, // Cache for 1 minute
    retry: false, // Don't retry on password error
    ...options,
  });
}

export function useCreateShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInputType) => createShareLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARE_QUERY_KEY });
    },
  });
}

export function useUpdateShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateInputType) => updateShareLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARE_QUERY_KEY });
    },
  });
}

export function useDeleteShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteInputType) => deleteShareLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARE_QUERY_KEY });
    },
  });
}

export function useRevokeShareLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RevokeInputType) => revokeShareLink(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHARE_QUERY_KEY });
    },
  });
}

// Utility hook to manage a share link with copy functionality
export function useShareLinkManager(variantId?: string) {
  const shareLinksQuery = useShareLinks(
    variantId ? { resumeVariantId: variantId } : {},
    { enabled: !!variantId }
  );
  const createMutation = useCreateShareLink();
  const revokeMutation = useRevokeShareLink();
  const deleteMutation = useDeleteShareLink();

  const copyToClipboard = async (token: string) => {
    const shareUrl = `${window.location.origin}/r/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    return shareUrl;
  };

  const createAndCopy = async (input: CreateInputType) => {
    const result = await createMutation.mutateAsync(input);
    if (result.shareLink.token) {
      await copyToClipboard(result.shareLink.token);
    }
    return result;
  };

  return {
    shareLinks: shareLinksQuery.data?.shareLinks ?? [],
    isLoading: shareLinksQuery.isLoading,
    createShareLink: createMutation.mutate,
    createAndCopy,
    revokeShareLink: revokeMutation.mutate,
    deleteShareLink: deleteMutation.mutate,
    copyToClipboard,
    isPending: createMutation.isPending || revokeMutation.isPending || deleteMutation.isPending,
  };
}
