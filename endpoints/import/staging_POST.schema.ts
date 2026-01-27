import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  importSessionId: z.string(),
});

export type InputType = z.infer<typeof schema>;

export interface StagingRecordResponse {
  id: string;
  recordType: string;
  sourceData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  status: "pending" | "committed" | "skipped" | "error";
  userDecision: "create" | "merge" | "skip" | "pending";
  duplicateCheck: {
    confidence: "exact" | "likely" | "possible" | "none";
    matchedId: string | null;
    matchedFields: string[];
    score: number;
  } | null;
  entityMappings: {
    primary: string;
    secondary: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface ImportSessionResponse {
  id: string;
  workspaceId: string;
  sourceArtifactId: string;
  sourceType: string;
  status: "pending" | "ready_to_commit" | "committed" | "failed";
  totalRecords: number;
  processedRecords: number;
  createdAt: string;
  completedAt: string | null;
}

export interface OutputType {
  success: boolean;
  session: ImportSessionResponse | null;
  stagingRecords: StagingRecordResponse[];
  sourceArtifact: {
    id: string;
    filename: string;
    uploadedAt: string;
  } | null;
  error?: string;
}

export async function postImportStaging(
  input: InputType
): Promise<OutputType> {
  const response = await fetch("/api/import/staging", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
  });
  return superjson.parse(await response.text());
}
