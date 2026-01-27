import { schema, OutputType, CommittedRecord } from "./commit_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { nanoid } from "nanoid";

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const input = schema.parse(json);
    const { importSessionId, workspaceId } = input;

    // Fetch session
    const session = await db
      .selectFrom("importSessions")
      .where("id", "=", importSessionId)
      .selectAll()
      .executeTakeFirst();

    if (!session) {
      return new Response(
        superjson.stringify({
          success: false,
          committedCount: 0,
          skippedCount: 0,
          mergedCount: 0,
          errorCount: 0,
          records: [],
          errors: [{ stagingRecordId: "", error: "Import session not found" }],
        } as OutputType),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (session.status === "committed") {
      return new Response(
        superjson.stringify({
          success: false,
          committedCount: 0,
          skippedCount: 0,
          mergedCount: 0,
          errorCount: 0,
          records: [],
          errors: [
            { stagingRecordId: "", error: "Session already committed" },
          ],
        } as OutputType),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch pending staging records
    const stagingRecords = await db
      .selectFrom("stagingRecords")
      .where("importSessionId", "=", importSessionId)
      .where("status", "=", "pending")
      .selectAll()
      .execute();

    const records: CommittedRecord[] = [];
    const errors: Array<{ stagingRecordId: string; error: string }> = [];
    let committedCount = 0;
    let skippedCount = 0;
    let mergedCount = 0;
    let errorCount = 0;

    for (const staging of stagingRecords) {
      try {
        // mappedData is stored as Json type - ensure it's a string before parsing
        const mappedDataStr = typeof staging.mappedData === 'string' 
          ? staging.mappedData 
          : JSON.stringify(staging.mappedData ?? {});
        const mappedData = JSON.parse(mappedDataStr);
        const entityMappings = mappedData.entityMappings || {
          primary: staging.recordType,
          secondary: [],
        };

        // Handle skip decision
        if (staging.userDecision === "skip") {
          await db
            .updateTable("stagingRecords")
            .set({ status: "skipped", updatedAt: new Date() })
            .where("id", "=", staging.id)
            .execute();

          records.push({
            stagingRecordId: staging.id,
            entityType: entityMappings.primary,
            entityId: "",
            action: "skipped",
            secondaryEntities: [],
          });
          skippedCount++;
          continue;
        }

        // Handle merge decision
        if (staging.userDecision === "merge" && staging.duplicateOfId) {
          const mergeResult = await mergeRecord(
            staging.duplicateOfId,
            entityMappings.primary,
            mappedData,
            session.sourceArtifactId ?? "unknown"
          );

          await db
            .updateTable("stagingRecords")
            .set({ status: "committed", updatedAt: new Date() })
            .where("id", "=", staging.id)
            .execute();

          records.push({
            stagingRecordId: staging.id,
            entityType: entityMappings.primary,
            entityId: staging.duplicateOfId,
            action: "merged",
            secondaryEntities: [],
          });
          mergedCount++;
          continue;
        }

        // Handle create decision
        const primaryEntityId = nanoid();
        const secondaryEntities: Array<{ entityType: string; entityId: string }> =
          [];

        // Create primary entity
        await createEntity(
          entityMappings.primary,
          primaryEntityId,
          workspaceId,
          mappedData,
          session.sourceArtifactId ?? "unknown"
        );

        // Create secondary entities
        for (const secondaryType of entityMappings.secondary) {
          const secondaryId = nanoid();
          await createSecondaryEntity(
            secondaryType,
            secondaryId,
            workspaceId,
            mappedData,
            primaryEntityId,
            entityMappings.primary,
            session.sourceArtifactId ?? "unknown"
          );
          secondaryEntities.push({
            entityType: secondaryType,
            entityId: secondaryId,
          });
        }

        await db
          .updateTable("stagingRecords")
          .set({ status: "committed", updatedAt: new Date() })
          .where("id", "=", staging.id)
          .execute();

        records.push({
          stagingRecordId: staging.id,
          entityType: entityMappings.primary,
          entityId: primaryEntityId,
          action: "created",
          secondaryEntities,
        });
        committedCount++;
      } catch (error) {
        // Note: Using 'skipped' status since 'error' is not a valid ImportStatus
        await db
          .updateTable("stagingRecords")
          .set({ status: "skipped", updatedAt: new Date() })
          .where("id", "=", staging.id)
          .execute();

        errors.push({
          stagingRecordId: staging.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        errorCount++;
      }
    }

    // Update session status
    await db
      .updateTable("importSessions")
      .set({
        status: "committed",
        processedRecords: committedCount + skippedCount + mergedCount,
        completedAt: new Date(),
      })
      .where("id", "=", importSessionId)
      .execute();

    const output: OutputType = {
      success: errorCount === 0,
      committedCount,
      skippedCount,
      mergedCount,
      errorCount,
      records,
      errors,
    };

    return new Response(superjson.stringify(output), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Commit error:", error);
    return new Response(
      superjson.stringify({
        success: false,
        committedCount: 0,
        skippedCount: 0,
        mergedCount: 0,
        errorCount: 1,
        records: [],
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

async function createEntity(
  entityType: string,
  id: string,
  workspaceId: string,
  mappedData: Record<string, unknown>,
  sourceArtifactId: string
): Promise<void> {
  const now = new Date();
  const provenance = JSON.stringify({
    importedAt: now.toISOString(),
    sourceArtifactId,
    importSource: "linkedin",
  });

  switch (entityType) {
    case "job":
      await db
        .insertInto("jobs")
        .values({
          id,
          workspaceId,
          company: (mappedData.company as string) || "Unknown Company",
          title: (mappedData.title as string) || "Unknown Title",
          startDate: mappedData.startDate
            ? new Date(mappedData.startDate as string)
            : null,
          endDate: mappedData.endDate
            ? new Date(mappedData.endDate as string)
            : null,
          description: (mappedData.description as string) || null,
          location: (mappedData.location as string) || null,
          isCurrent: !mappedData.endDate,
          notes: `Imported from LinkedIn. Source: ${sourceArtifactId}`,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "learning":
      await db
        .insertInto("learning")
        .values({
          id,
          workspaceId,
          title: (mappedData.degree as string) || (mappedData.title as string) || "Unknown",
          provider: (mappedData.institution as string) || null,
          learningType: "degree",
          startDate: mappedData.startDate
            ? new Date(mappedData.startDate as string)
            : null,
          completionDate: mappedData.endDate
            ? new Date(mappedData.endDate as string)
            : null,
          notes: `Field: ${mappedData.field || "N/A"}. Imported from LinkedIn. Source: ${sourceArtifactId}`,
          status: mappedData.endDate ? "completed" : "in_progress",
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "skill":
      await db
        .insertInto("skills")
        .values({
          id,
          workspaceId,
          name: (mappedData.name as string) || "Unknown Skill",
          category: (mappedData.category as string) || null,
          level: (mappedData.level as string) || null,
          notes: `Imported from LinkedIn. Source: ${sourceArtifactId}`,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "project":
      await db
        .insertInto("projects")
        .values({
          id,
          workspaceId,
          name: (mappedData.name as string) || "Unknown Project",
          description: (mappedData.description as string) || null,
          startDate: mappedData.startDate
            ? new Date(mappedData.startDate as string)
            : null,
          endDate: mappedData.endDate
            ? new Date(mappedData.endDate as string)
            : null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "person":
      await db
        .insertInto("people")
        .values({
          id,
          workspaceId,
          name: (mappedData.name as string) || "Unknown",
          email: (mappedData.email as string) || null,
          company: (mappedData.company as string) || null,
          role: (mappedData.title as string) || null,
          notes: `LinkedIn: ${mappedData.linkedInUrl || 'N/A'}. Imported. Source: ${sourceArtifactId}`,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "achievement":
      await db
        .insertInto("achievements")
        .values({
          id,
          workspaceId,
          title: (mappedData.title as string) || "Unknown Achievement",
          description: (mappedData.description as string) || `Issuer: ${mappedData.issuer || 'Unknown'}`,
          achievedDate: mappedData.date ? new Date(mappedData.date as string) : new Date(),
          category: "certification",
          evidenceUrl: (mappedData.url as string) || null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "institution":
      await db
        .insertInto("institutions")
        .values({
          id,
          workspaceId,
          name: (mappedData.name as string) || "Unknown Institution",
          type: (mappedData.type as "bootcamp" | "college" | "organization" | "other" | "school" | "university") || "organization",
          location: (mappedData.location as string) || null,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

async function createSecondaryEntity(
  entityType: string,
  id: string,
  workspaceId: string,
  mappedData: Record<string, unknown>,
  primaryEntityId: string,
  primaryEntityType: string,
  sourceArtifactId: string
): Promise<void> {
  const now = new Date();
  // Store import provenance in notes field since provenance column doesn't exist
  const importNotes = `Imported from LinkedIn (${sourceArtifactId}). Linked to ${primaryEntityType}: ${primaryEntityId}`;

  switch (entityType) {
    case "institution":
      // Create institution from job's company
      await db
        .insertInto("institutions")
        .values({
          id,
          workspaceId,
          name: (mappedData.company as string) || "Unknown Company",
          type: "organization",
          location: (mappedData.location as string) || null,
          notes: importNotes,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    case "relationship":
      // Create relationship from connection - links person to primary entity
      await db
        .insertInto("relationships")
        .values({
          id,
          workspaceId,
          sourceId: primaryEntityId,
          sourceType: primaryEntityType as "person" | "job" | "project" | "skill" | "event" | "institution",
          targetId: (mappedData.targetId as string) || primaryEntityId,
          targetType: (mappedData.targetType as "person" | "job" | "project" | "skill" | "event" | "institution") || "person",
          relationshipLabel: (mappedData.relationshipType as string) || "connection",
          notes: importNotes,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
      break;

    default:
      // Skip unknown secondary types
      console.warn(`Unknown secondary entity type: ${entityType}`);
  }
}

async function mergeRecord(
  existingId: string,
  entityType: string,
  mappedData: Record<string, unknown>,
  sourceArtifactId: string
): Promise<void> {
  const now = new Date();
  
  // Build provenance update that preserves existing and adds new source
  const provenanceUpdate = JSON.stringify({
    mergedAt: now.toISOString(),
    mergeSourceArtifactId: sourceArtifactId,
    importSource: "linkedin",
  });

  // Merge by updating non-null fields from imported data
  switch (entityType) {
    case "job":
      await db
        .updateTable("jobs")
        .set({
          description:
            mappedData.description !== undefined
              ? (mappedData.description as string)
              : undefined,
          location:
            mappedData.location !== undefined
              ? (mappedData.location as string)
              : undefined,
          updatedAt: now,
        })
        .where("id", "=", existingId)
        .execute();
      break;

    case "skill":
      await db
        .updateTable("skills")
        .set({
          level:
            mappedData.level !== undefined
              ? (mappedData.level as string)
              : undefined,
          updatedAt: now,
        })
        .where("id", "=", existingId)
        .execute();
      break;

    case "person":
      await db
        .updateTable("people")
        .set({
          email:
            mappedData.email !== undefined
              ? (mappedData.email as string)
              : undefined,
          company:
            mappedData.company !== undefined
              ? (mappedData.company as string)
              : undefined,
          role:
            mappedData.title !== undefined
              ? (mappedData.title as string)
              : undefined,
          notes:
            mappedData.linkedInUrl !== undefined
              ? `LinkedIn: ${mappedData.linkedInUrl as string}`
              : undefined,
          updatedAt: now,
        })
        .where("id", "=", existingId)
        .execute();
      break;

    // Add more entity types as needed
    default:
      // For other types, just update the timestamp
      console.warn(`Merge not fully implemented for: ${entityType}`);
  }
}
