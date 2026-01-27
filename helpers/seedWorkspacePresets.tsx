/**
 * Seed Workspace Presets Helper
 * 
 * Seeds view definition presets when a new workspace is created.
 * Uses the SEED_PRESETS from viewDefinitionPresets.tsx.
 */

import { nanoid } from "nanoid";
import type { Kysely } from "kysely";
import type { DB } from "./schema";
import { SEED_PRESETS, type ViewDefinition } from "./viewDefinitionPresets";

// ============================================================================
// TYPES
// ============================================================================

export interface SeedPresetsOptions {
  workspaceId: string;
  skipExisting?: boolean;
  presets?: ViewDefinition[];
}

export interface SeedPresetsResult {
  success: boolean;
  created: number;
  skipped: number;
  errors: string[];
  presetIds: string[];
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function seedWorkspacePresets(
  db: Kysely<DB>,
  options: SeedPresetsOptions
): Promise<SeedPresetsResult> {
  const {
    workspaceId,
    skipExisting = true,
    presets = SEED_PRESETS,
  } = options;

  const result: SeedPresetsResult = {
    success: true,
    created: 0,
    skipped: 0,
    errors: [],
    presetIds: [],
  };

  try {
    // Check for existing presets if skipExisting is true
    if (skipExisting) {
      const existingCount = await db
        .selectFrom("viewDefinitions")
        .select(db.fn.count("id").as("count"))
        .where("workspaceId", "=", workspaceId)
        .executeTakeFirst();

      if (existingCount && Number(existingCount.count) > 0) {
        result.skipped = presets.length;
        return result;
      }
    }

    // Insert each preset
    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i];
      
      try {
        const id = nanoid();
        
        await db
          .insertInto("viewDefinitions")
          .values({
            id,
            workspaceId,
            name: preset.name,
            description: preset.description,
            viewType: preset.category,
            rules: preset.sections as unknown as null,
            redactions: null,
            isDefault: i === 0, // First preset is default
          })
          .execute();

        result.created++;
        result.presetIds.push(id);
      } catch (error) {
        result.errors.push(
          `Failed to create preset "${preset.name}": ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error during seeding"
    );
    return result;
  }
}

// ============================================================================
// VERIFICATION
// ============================================================================

export async function verifyWorkspacePresets(
  db: Kysely<DB>,
  workspaceId: string
): Promise<{
  hasPresets: boolean;
  count: number;
  hasDefault: boolean;
  presetNames: string[];
}> {
  const presets = await db
    .selectFrom("viewDefinitions")
    .select(["id", "name", "isDefault"])
    .where("workspaceId", "=", workspaceId)
    .execute();

  return {
    hasPresets: presets.length > 0,
    count: presets.length,
    hasDefault: presets.some((p) => p.isDefault),
    presetNames: presets.map((p) => p.name),
  };
}

// ============================================================================
// RESET PRESETS
// ============================================================================

export async function resetWorkspacePresets(
  db: Kysely<DB>,
  workspaceId: string
): Promise<SeedPresetsResult> {
  // Delete existing presets
  await db
    .deleteFrom("viewDefinitions")
    .where("workspaceId", "=", workspaceId)
    .execute();

  // Re-seed with defaults
  return seedWorkspacePresets(db, {
    workspaceId,
    skipExisting: false,
  });
}

// ============================================================================
// WORKSPACE CREATION HOOK
// ============================================================================

/**
 * Call this after creating a new workspace to ensure presets are seeded.
 * Safe to call multiple times - will skip if presets already exist.
 */
export async function ensureWorkspacePresets(
  db: Kysely<DB>,
  workspaceId: string
): Promise<void> {
  const verification = await verifyWorkspacePresets(db, workspaceId);
  
  if (!verification.hasPresets) {
    await seedWorkspacePresets(db, { workspaceId });
  }
}
