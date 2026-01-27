/**
 * React Query hooks for Export API
 */

import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";
import {
  exportResume, previewResume,
  ExportInputType, ExportOutputType,
  PreviewInputType, PreviewOutputType,
} from "../endpoints/export/export.schema";

export const EXPORT_QUERY_KEY = ["export"];

export function useExportPreview(input: PreviewInputType, options?: Omit<UseQueryOptions<PreviewOutputType>, "queryKey" | "queryFn">) {
  return useQuery({
    queryKey: [...EXPORT_QUERY_KEY, "preview", input.variantId, input.snapshotId],
    queryFn: () => previewResume(input),
    enabled: !!input.variantId,
    staleTime: 30000, // Cache preview for 30 seconds
    ...options,
  });
}

export function useExportResume() {
  return useMutation({
    mutationFn: (input: ExportInputType) => exportResume(input),
  });
}

// Helper hook for downloading exports
export function useDownloadExport() {
  const exportMutation = useExportResume();

  const download = async (input: ExportInputType) => {
    const result = await exportMutation.mutateAsync(input);
    
    if (result.content) {
      // Create blob and download for text-based formats
      const blob = new Blob([result.content], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.base64) {
      // Handle binary formats
      const binaryString = atob(result.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: result.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    return result;
  };

  return {
    download,
    isPending: exportMutation.isPending,
    isError: exportMutation.isError,
    error: exportMutation.error,
  };
}
