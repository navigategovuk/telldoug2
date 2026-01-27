import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postImportUpload, InputType as UploadInput, OutputType as UploadOutput } from "../endpoints/import/upload_POST.schema";
import { postImportStaging, InputType as _StagingInput, OutputType as StagingOutput, StagingRecordResponse } from "../endpoints/import/staging_POST.schema";
import { postImportStagingUpdate, InputType as StagingUpdateInput, OutputType as StagingUpdateOutput } from "../endpoints/import/staging-update_POST.schema";
import { postImportCommit, InputType as _CommitInput, OutputType as CommitOutput } from "../endpoints/import/commit_POST.schema";

// Query keys
export const importKeys = {
  all: ["import"] as const,
  sessions: () => [...importKeys.all, "sessions"] as const,
  session: (id: string) => [...importKeys.sessions(), id] as const,
  staging: (sessionId: string) => [...importKeys.session(sessionId), "staging"] as const,
};

/**
 * Hook for uploading and parsing import files
 */
export function useImportUpload() {
  const queryClient = useQueryClient();

  return useMutation<UploadOutput, Error, UploadInput>({
    mutationFn: postImportUpload,
    onSuccess: (data: UploadOutput) => {
      if (data.success && data.importSessionId) {
        // Invalidate sessions list
        queryClient.invalidateQueries({ queryKey: importKeys.sessions() });
        // Pre-populate staging data
        queryClient.setQueryData(
          importKeys.staging(data.importSessionId),
          {
            success: true,
            session: {
              id: data.importSessionId,
              sourceArtifactId: data.sourceArtifactId,
              status: "pending",
              totalRecords: data.stats.totalRecords,
              processedRecords: 0,
            },
            stagingRecords: data.stagingRecords,
            sourceArtifact: null,
          } as Partial<StagingOutput>
        );
      }
    },
  });
}

/**
 * Hook for fetching staging records for a session
 */
export function useImportStaging(sessionId: string | null) {
  return useQuery<StagingOutput, Error>({
    queryKey: importKeys.staging(sessionId || ""),
    queryFn: () => postImportStaging({ importSessionId: sessionId ?? "" }),
    enabled: !!sessionId,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook for updating staging record decisions
 */
export function useUpdateStagingRecords(sessionId: string) {
  const queryClient = useQueryClient();
  
  type UpdateInput = Omit<StagingUpdateInput, "importSessionId">;
  type MutationContext = { previousData?: StagingOutput };

  return useMutation<
    StagingUpdateOutput,
    Error,
    UpdateInput,
    MutationContext
  >({
    mutationFn: (input: UpdateInput) =>
      postImportStagingUpdate({
        importSessionId: sessionId,
        ...input,
      }),
    onMutate: async (input: UpdateInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: importKeys.staging(sessionId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<StagingOutput>(
        importKeys.staging(sessionId)
      );

      // Optimistically update staging records
      if (previousData) {
        const updatedRecords = previousData.stagingRecords.map((record: StagingRecordResponse) => {
          const update = input.updates.find(
            (u: { stagingRecordId: string }) => u.stagingRecordId === record.id
          );
          if (update) {
            return {
              ...record,
              userDecision: update.userDecision,
            };
          }
          return record;
        });

        queryClient.setQueryData<StagingOutput>(
          importKeys.staging(sessionId),
          {
            ...previousData,
            stagingRecords: updatedRecords as StagingRecordResponse[],
          }
        );
      }

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          importKeys.staging(sessionId),
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: importKeys.staging(sessionId),
      });
    },
  });
}

/**
 * Hook for committing staging records to canonical tables
 */
export function useCommitImport(sessionId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<CommitOutput, Error, void>({
    mutationFn: () =>
      postImportCommit({
        importSessionId: sessionId,
        workspaceId,
      }),
    onSuccess: (data: CommitOutput) => {
      if (data.success) {
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: importKeys.all });
        // Invalidate entity-specific queries that may have been affected
        queryClient.invalidateQueries({ queryKey: ["jobs"] });
        queryClient.invalidateQueries({ queryKey: ["learning"] });
        queryClient.invalidateQueries({ queryKey: ["skills"] });
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["people"] });
        queryClient.invalidateQueries({ queryKey: ["achievements"] });
        queryClient.invalidateQueries({ queryKey: ["institutions"] });
        queryClient.invalidateQueries({ queryKey: ["relationships"] });
      }
    },
  });
}

/**
 * Combined hook for full import pipeline state management
 */
export function useImportPipeline(workspaceId: string) {
  const uploadMutation = useImportUpload();

  // Get the current session ID from upload result
  const currentSessionId = uploadMutation.data?.importSessionId || null;

  // Fetch staging data when session exists
  const stagingQuery = useImportStaging(currentSessionId);

  // Update and commit mutations
  const updateMutation = useUpdateStagingRecords(currentSessionId || "");
  const commitMutation = useCommitImport(
    currentSessionId || "",
    workspaceId
  );

  return {
    // Upload
    upload: uploadMutation.mutate,
    uploadAsync: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    uploadResult: uploadMutation.data,

    // Session
    sessionId: currentSessionId,
    session: stagingQuery.data?.session || null,
    sourceArtifact: stagingQuery.data?.sourceArtifact || null,

    // Staging records
    stagingRecords: stagingQuery.data?.stagingRecords || [],
    isFetchingStaging: stagingQuery.isFetching,
    stagingError: stagingQuery.error,

    // Update decisions
    updateDecisions: updateMutation.mutate,
    updateDecisionsAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Commit
    commit: commitMutation.mutate,
    commitAsync: commitMutation.mutateAsync,
    isCommitting: commitMutation.isPending,
    commitError: commitMutation.error,
    commitResult: commitMutation.data,

    // Computed state
    hasRecords: (stagingQuery.data?.stagingRecords?.length || 0) > 0,
    pendingCount:
      stagingQuery.data?.stagingRecords?.filter(
        (r: StagingRecordResponse) => r.status === "pending"
      ).length || 0,
    isReady:
      !!currentSessionId &&
      !stagingQuery.isFetching &&
      !uploadMutation.isPending,

    // Reset
    reset: () => {
      uploadMutation.reset();
      updateMutation.reset();
      commitMutation.reset();
    },
  };
}

/**
 * Helper to categorize staging records by decision
 */
export function categorizeStagingRecords(records: StagingRecordResponse[]) {
  return {
    toCreate: records.filter((r) => r.userDecision === "create"),
    toMerge: records.filter((r) => r.userDecision === "merge"),
    toSkip: records.filter((r) => r.userDecision === "skip"),
    pending: records.filter((r) => r.userDecision === "pending"),
    byEntityType: records.reduce(
      (acc, r) => {
        const type = r.entityMappings.primary;
        if (!acc[type]) {acc[type] = [];}
        acc[type].push(r);
        return acc;
      },
      {} as Record<string, StagingRecordResponse[]>
    ),
    byConfidence: {
      exact: records.filter((r) => r.duplicateCheck?.confidence === "exact"),
      likely: records.filter((r) => r.duplicateCheck?.confidence === "likely"),
      possible: records.filter(
        (r) => r.duplicateCheck?.confidence === "possible"
      ),
      none: records.filter(
        (r) => !r.duplicateCheck || r.duplicateCheck.confidence === "none"
      ),
    },
  };
}

/**
 * Helper to get display info for entity types
 */
export const entityTypeLabels: Record<string, { label: string; icon: string }> = {
  job: { label: "Job", icon: "💼" },
  learning: { label: "Education", icon: "🎓" },
  skill: { label: "Skill", icon: "⚡" },
  project: { label: "Project", icon: "📁" },
  person: { label: "Connection", icon: "👤" },
  achievement: { label: "Achievement", icon: "🏆" },
  institution: { label: "Organization", icon: "🏢" },
  relationship: { label: "Relationship", icon: "🤝" },
};

/**
 * Helper to get confidence badge info
 */
export function getConfidenceBadge(confidence: string | undefined) {
  switch (confidence) {
    case "exact":
      return { label: "Exact Match", color: "red", description: "Duplicate detected" };
    case "likely":
      return { label: "Likely Match", color: "orange", description: "Probable duplicate" };
    case "possible":
      return { label: "Possible Match", color: "yellow", description: "May be related" };
    default:
      return { label: "New", color: "green", description: "No duplicates found" };
  }
}
