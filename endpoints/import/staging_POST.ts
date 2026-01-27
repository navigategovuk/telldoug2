import { schema, OutputType, StagingRecordResponse, ImportSessionResponse } from "./staging_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { importSessionId } = input;

    // Fetch import session
    const session = await db
      .selectFrom("importSessions")
      .where("id", "=", importSessionId)
      .selectAll()
      .executeTakeFirst();

    if (!session) {
      return new Response(
        superjson.stringify({
          success: false,
          session: null,
          stagingRecords: [],
          sourceArtifact: null,
          error: "Import session not found",
        } as OutputType),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch source artifact
    const sourceArtifact = await db
      .selectFrom("sourceArtifacts")
      .where("id", "=", session.sourceArtifactId)
      .select(["id", "filename", "uploadedAt"])
      .executeTakeFirst();

    // Fetch staging records
    const stagingRecords = await db
      .selectFrom("stagingRecords")
      .where("importSessionId", "=", importSessionId)
      .selectAll()
      .orderBy("createdAt", "asc")
      .execute();

    const formattedRecords: StagingRecordResponse[] = stagingRecords.map(
      (record) => {
        // Safely parse JSON fields - they may be strings or already objects
        const mappedData = typeof record.mappedData === 'string' 
          ? JSON.parse(record.mappedData) 
          : (record.mappedData || {});
        const fieldMappings = typeof record.fieldMappings === 'string'
          ? JSON.parse(record.fieldMappings)
          : (record.fieldMappings || {});
        const mergeSuggestion = record.mergeSuggestion
          ? (typeof record.mergeSuggestion === 'string' 
              ? JSON.parse(record.mergeSuggestion) 
              : record.mergeSuggestion)
          : null;
        const sourceData = typeof record.sourceData === 'string'
          ? JSON.parse(record.sourceData)
          : (record.sourceData || {});

        return {
          id: record.id,
          recordType: record.recordType,
          sourceData: sourceData,
          mappedData: mappedData,
          status: record.status as "pending" | "committed" | "skipped" | "error",
          userDecision: record.userDecision as "create" | "merge" | "skip" | "pending",
          duplicateCheck: record.duplicateOfId
            ? {
                confidence: fieldMappings.confidence || "possible",
                matchedId: record.duplicateOfId,
                matchedFields: fieldMappings.matchedFields || [],
                score: fieldMappings.score || 0,
              }
            : null,
          entityMappings: {
            primary: mappedData.entityMappings?.primary || record.recordType,
            secondary: mappedData.entityMappings?.secondary || [],
          },
          createdAt: record.createdAt?.toISOString() ?? new Date().toISOString(),
          updatedAt: record.updatedAt?.toISOString() ?? new Date().toISOString(),
        };
      }
    );

    const sessionResponse: ImportSessionResponse = {
      id: session.id,
      workspaceId: session.workspaceId ?? "",
      sourceArtifactId: session.sourceArtifactId ?? "",
      sourceType: session.sourceType,
      status: session.status as "pending" | "ready_to_commit" | "committed" | "failed",
      totalRecords: session.totalRecords ?? 0,
      processedRecords: session.processedRecords ?? 0,
      createdAt: session.createdAt?.toISOString() ?? new Date().toISOString(),
      completedAt: session.completedAt?.toISOString() || null,
    };

    const output: OutputType = {
      success: true,
      session: sessionResponse,
      stagingRecords: formattedRecords,
      sourceArtifact: sourceArtifact
        ? {
            id: sourceArtifact.id,
            filename: sourceArtifact.filename,
            uploadedAt: sourceArtifact.uploadedAt?.toISOString() ?? new Date().toISOString(),
          }
        : null,
    };

    return new Response(superjson.stringify(output), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Staging fetch error:", error);
    return new Response(
      superjson.stringify({
        success: false,
        session: null,
        stagingRecords: [],
        sourceArtifact: null,
        error: error instanceof Error ? error.message : "Unknown error",
      } as OutputType),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
