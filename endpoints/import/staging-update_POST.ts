import { schema, OutputType } from "./staging-update_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { importSessionId, updates } = input;

    // Verify session exists and is still pending
    const session = await db
      .selectFrom("importSessions")
      .where("id", "=", importSessionId)
      .select(["id", "status"])
      .executeTakeFirst();

    if (!session) {
      return new Response(
        superjson.stringify({
          success: false,
          updatedCount: 0,
          errors: [
            { stagingRecordId: "", error: "Import session not found" },
          ],
        } as OutputType),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (session.status === "committed") {
      return new Response(
        superjson.stringify({
          success: false,
          updatedCount: 0,
          errors: [
            {
              stagingRecordId: "",
              error: "Cannot update staging records for a committed session",
            },
          ],
        } as OutputType),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const errors: Array<{ stagingRecordId: string; error: string }> = [];
    let updatedCount = 0;

    // Process each update
    for (const update of updates) {
      try {
        // Fetch current staging record
        const stagingRecord = await db
          .selectFrom("stagingRecords")
          .where("id", "=", update.stagingRecordId)
          .where("importSessionId", "=", importSessionId)
          .select(["id", "mappedData", "status"])
          .executeTakeFirst();

        if (!stagingRecord) {
          errors.push({
            stagingRecordId: update.stagingRecordId,
            error: "Staging record not found",
          });
          continue;
        }

        if (stagingRecord.status !== "pending") {
          errors.push({
            stagingRecordId: update.stagingRecordId,
            error: `Cannot update record with status: ${stagingRecord.status}`,
          });
          continue;
        }

        // Build update object
        const updateData: Record<string, unknown> = {
          userDecision: update.userDecision,
          updatedAt: new Date(),
        };

        // Handle merge target
        if (update.userDecision === "merge" && update.mergeTargetId) {
          updateData.duplicateOfId = update.mergeTargetId;
        }

        // Handle mapped data overrides
        if (update.mappedDataOverrides) {
          const currentMappedData = JSON.parse(
            typeof stagingRecord.mappedData === "string" ? stagingRecord.mappedData : "{}"
          );
          const mergedData = {
            ...currentMappedData,
            ...update.mappedDataOverrides,
          };
          updateData.mappedData = JSON.stringify(mergedData);
        }

        // Perform update
        await db
          .updateTable("stagingRecords")
          .set(updateData)
          .where("id", "=", update.stagingRecordId)
          .execute();

        updatedCount++;
      } catch (error) {
        errors.push({
          stagingRecordId: update.stagingRecordId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const output: OutputType = {
      success: errors.length === 0,
      updatedCount,
      errors,
    };

    return new Response(superjson.stringify(output), {
      status: errors.length === 0 ? 200 : 207,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Staging update error:", error);
    return new Response(
      superjson.stringify({
        success: false,
        updatedCount: 0,
        errors: [
          {
            stagingRecordId: "",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
      } as OutputType),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
