/**
 * Database Migration Runner
 * Applies SQL migrations in order, tracking which have been applied
 */

import { db } from './db.js';
import { sql } from 'kysely';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Migration {
  id: number;
  name: string;
  applied_at: Date;
}

async function ensureMigrationsTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `.execute(db);
  
  console.log('✓ Migrations table ready');
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await db
    .selectFrom('_migrations' as any)
    .select(['name'])
    .execute();
  
  return new Set(result.map((m: any) => m.name));
}

async function getMigrationFiles(): Promise<string[]> {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  try {
    const files = await fs.readdir(migrationsDir);
    return files
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensures alphabetical/numerical order
  } catch (error) {
    console.error('Could not read migrations directory:', migrationsDir);
    return [];
  }
}

async function applyMigration(filename: string): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const filePath = path.join(migrationsDir, filename);
  
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Split by semicolons to handle multiple statements
  // But be careful with semicolons inside strings or functions
  const statements = content
    .split(/;(?=(?:[^']*'[^']*')*[^']*$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`  Applying ${filename} (${statements.length} statements)...`);
  
  for (const statement of statements) {
    if (statement.length > 0) {
      try {
        await sql.raw(statement).execute(db);
      } catch (error) {
        console.error(`  ✗ Failed on statement: ${statement.substring(0, 100)}...`);
        throw error;
      }
    }
  }
  
  // Record migration as applied
  await db
    .insertInto('_migrations' as any)
    .values({ name: filename })
    .execute();
  
  console.log(`  ✓ Applied ${filename}`);
}

export async function runMigrations(): Promise<void> {
  console.log('\n=== Running Database Migrations ===\n');
  
  try {
    await ensureMigrationsTable();
    
    const applied = await getAppliedMigrations();
    const files = await getMigrationFiles();
    
    const pending = files.filter(f => !applied.has(f));
    
    if (pending.length === 0) {
      console.log('\n✓ All migrations already applied\n');
      return;
    }
    
    console.log(`\nPending migrations: ${pending.length}\n`);
    
    for (const file of pending) {
      await applyMigration(file);
    }
    
    console.log(`\n✓ Successfully applied ${pending.length} migration(s)\n`);
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  }
}

export async function getMigrationStatus(): Promise<{
  applied: string[];
  pending: string[];
}> {
  await ensureMigrationsTable();
  
  const applied = await getAppliedMigrations();
  const files = await getMigrationFiles();
  
  return {
    applied: files.filter(f => applied.has(f)),
    pending: files.filter(f => !applied.has(f)),
  };
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
