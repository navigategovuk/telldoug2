import { z } from "zod";

export const schema = z.object({
  workspaceId: z.string(),
  filename: z.string(),
  fileData: z.string(), // base64 encoded file content
  quickImport: z.boolean().default(false), // Skip review, auto-commit all
});

export type InputType = z.infer<typeof schema>;

export interface StagingRecordOutput {
  id: string;
  recordType: string;
  sourceData: Record<string, unknown>;
  mappedData: Record<string, unknown>;
  status: "pending" | "mapped" | "skipped" | "committed";
  userDecision: "create" | "merge" | "skip" | null;
  duplicateCheck: {
    confidence: "exact" | "likely" | "possible" | "none";
    matchedId: string | null;
    matchedFields: string[];
    score: number;
  } | null;
  entityMappings: {
    primary: string;
    secondary?: string[];
  };
}

export interface OutputType {
  success: boolean;
  importSessionId: string;
  sourceArtifactId: string;
  stats: {
    totalRecords: number;
    byType: Record<string, number>;
    duplicatesFound: number;
  };
  stagingRecords: StagingRecordOutput[];
  errors: string[];
}

// Client-side function to call this endpoint
export async function postImportUpload(input: InputType): Promise<OutputType> {
  const superjson = await import("superjson");
  const response = await fetch("/_api/import/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.default.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const text = await response.text();
  return superjson.default.parse(text) as OutputType;
}
