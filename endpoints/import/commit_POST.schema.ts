import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  importSessionId: z.string(),
  workspaceId: z.string(),
});

export type InputType = z.infer<typeof schema>;

export interface CommittedRecord {
  stagingRecordId: string;
  entityType: string;
  entityId: string;
  action: "created" | "merged" | "skipped";
  secondaryEntities: Array<{
    entityType: string;
    entityId: string;
  }>;
}

export interface OutputType {
  success: boolean;
  committedCount: number;
  skippedCount: number;
  mergedCount: number;
  errorCount: number;
  records: CommittedRecord[];
  errors: Array<{
    stagingRecordId: string;
    error: string;
  }>;
}

export async function postImportCommit(
  input: InputType
): Promise<OutputType> {
  const response = await fetch("/api/import/commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
  });
  return superjson.parse(await response.text());
}
