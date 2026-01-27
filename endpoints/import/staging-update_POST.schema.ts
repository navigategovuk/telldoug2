import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  importSessionId: z.string(),
  updates: z.array(
    z.object({
      stagingRecordId: z.string(),
      userDecision: z.enum(["create", "merge", "skip"]),
      mergeTargetId: z.string().optional(),
      mappedDataOverrides: z.record(z.unknown()).optional(),
    })
  ),
});

export type InputType = z.infer<typeof schema>;

export interface OutputType {
  success: boolean;
  updatedCount: number;
  errors: Array<{
    stagingRecordId: string;
    error: string;
  }>;
}

export async function postImportStagingUpdate(
  input: InputType
): Promise<OutputType> {
  const response = await fetch("/api/import/staging/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: superjson.stringify(input),
  });
  return superjson.parse(await response.text());
}
