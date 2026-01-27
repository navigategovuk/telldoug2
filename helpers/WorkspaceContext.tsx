import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { Selectable } from "kysely";
import { Workspaces } from "./schema";
import { useWorkspace } from "./useWorkspace";

export interface WorkspaceConfig {
  maxVariants: number | null; // null = unlimited
  maxSnapshots: number | null;
  maxShareLinks: number | null;
  features: {
    qualityAnalysis: boolean;
    linkedInImport: boolean;
    pdfExport: boolean;
    docxExport: boolean;
    provenanceTracking: boolean;
    aiFeatures: boolean; // TellDoug addition
  };
}

export interface WorkspaceContextValue {
  workspace: Selectable<Workspaces> | null;
  isLoading: boolean;
  error: Error | null;
  config: WorkspaceConfig;
  // Usage tracking (for future billing)
  usage: {
    variantCount: number;
    snapshotCount: number;
    shareLinkCount: number;
  };
  // Limit checking
  canCreateVariant: boolean;
  canCreateSnapshot: boolean;
  canCreateShareLink: boolean;
  // Refresh
  refetch: () => void;
}

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceConfig = {
  maxVariants: null, // Unlimited for MVP
  maxSnapshots: null, // Unlimited for MVP
  maxShareLinks: null, // Unlimited for MVP
  features: {
    qualityAnalysis: true,
    linkedInImport: true,
    pdfExport: true,
    docxExport: true,
    provenanceTracking: true,
    aiFeatures: true, // TellDoug AI features enabled by default
  },
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useWorkspace();

  const value = useMemo<WorkspaceContextValue>(() => {
    const workspace = data?.workspace ?? null;

    // In the future, we might parse workspace.settings to override defaults
    // const settings = workspace?.settings ? (workspace.settings as any) : {};
    // const config = { ...DEFAULT_WORKSPACE_CONFIG, ...settings };
    const config = DEFAULT_WORKSPACE_CONFIG;

    // Placeholder usage stats.
    // In a real implementation, these would likely come from the workspace endpoint
    // or a separate usage stats endpoint.
    const usage = {
      variantCount: 0,
      snapshotCount: 0,
      shareLinkCount: 0,
    };

    // Helper to check limits
    const checkLimit = (current: number, max: number | null) => {
      if (max === null) {return true;}
      return current < max;
    };

    return {
      workspace,
      isLoading,
      error: error instanceof Error ? error : error ? new Error(String(error)) : null,
      config,
      usage,
      canCreateVariant: checkLimit(usage.variantCount, config.maxVariants),
      canCreateSnapshot: checkLimit(usage.snapshotCount, config.maxSnapshots),
      canCreateShareLink: checkLimit(usage.shareLinkCount, config.maxShareLinks),
      refetch,
    };
  }, [data, isLoading, error, refetch]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error(
      "useWorkspaceContext must be used within a WorkspaceProvider"
    );
  }
  return context;
}
