import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

import type Database from 'better-sqlite3'

export const CURRENT_SCHEMA_VERSION = '1.1.0'
const MIGRATION_TABLES = ['projects', 'function_entries', 'settings'] as const

interface ExportedTables {
  projects: Record<string, unknown>[]
  function_entries: Record<string, unknown>[]
  settings: Record<string, unknown>[]
}

interface MigrationBackup {
  fromVersion: string | null
  exportedAt: string
  tables: ExportedTables
}

const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    productivity REAL NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS function_entries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    function_type TEXT NOT NULL,
    det INTEGER NOT NULL,
    reference_count INTEGER NOT NULL,
    difficulty TEXT NOT NULL,
    function_points INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    version TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`

function tableExists(native: Database.Database, tableName: string): boolean {
  const row = native
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(tableName)
  return Boolean(row)
}

function tableHasRows(native: Database.Database, tableName: string): boolean {
  if (!tableExists(native, tableName)) {
    return false
  }

  const row = native.prepare(`SELECT 1 FROM ${tableName} LIMIT 1`).get()
  return Boolean(row)
}

function fetchTableRows(native: Database.Database, tableName: string): Record<string, unknown>[] {
  if (!tableExists(native, tableName)) {
    return []
  }

  return native.prepare(`SELECT * FROM ${tableName}`).all() as Record<string, unknown>[]
}

function dropTables(native: Database.Database): void {
  native.exec('PRAGMA foreign_keys = OFF')
  native.exec('DROP TABLE IF EXISTS function_entries')
  native.exec('DROP TABLE IF EXISTS projects')
  native.exec('DROP TABLE IF EXISTS settings')
  native.exec('DROP TABLE IF EXISTS schema_version')
  native.exec('PRAGMA foreign_keys = ON')
}

function createTables(native: Database.Database): void {
  native.exec(CREATE_TABLES_SQL)
}

function exportDatabase(native: Database.Database, fromVersion: string | null): MigrationBackup {
  return {
    fromVersion,
    exportedAt: new Date().toISOString(),
    tables: {
      projects: fetchTableRows(native, 'projects'),
      function_entries: fetchTableRows(native, 'function_entries'),
      settings: fetchTableRows(native, 'settings')
    }
  }
}

function writeBackup(appDirectory: string, backup: MigrationBackup): string {
  const backupDirectory = join(appDirectory, 'migration-backups')
  mkdirSync(backupDirectory, { recursive: true })
  const backupPath = join(backupDirectory, `migration-backup-${Date.now()}.json`)
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8')
  return backupPath
}

function importTables(native: Database.Database, backup: MigrationBackup): void {
  const insertProject = native.prepare(
    `INSERT INTO projects (id, name, description, created_at, updated_at, productivity)
     VALUES (@id, @name, @description, @created_at, @updated_at, @productivity)`
  )

  const insertFunctionEntry = native.prepare(
    `INSERT INTO function_entries (id, project_id, name, function_type, det, reference_count, difficulty, function_points, note, created_at, updated_at)
     VALUES (@id, @project_id, @name, @function_type, @det, @reference_count, @difficulty, @function_points, @note, @created_at, @updated_at)`
  )

  const insertSetting = native.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (@key, @value, @updated_at)`
  )

  const importTransaction = native.transaction(() => {
    for (const row of backup.tables.projects) {
      const rawProductivity = row['productivity']
      const parsedProductivity =
        typeof rawProductivity === 'number'
          ? rawProductivity
          : typeof rawProductivity === 'string'
            ? Number(rawProductivity)
            : undefined
      const productivity =
        typeof parsedProductivity === 'number' && Number.isFinite(parsedProductivity)
          ? parsedProductivity
          : 1

      insertProject.run({
        id: String(row.id),
        name: String(row.name),
        description: String(row.description),
        created_at: String(row.created_at),
        updated_at: String(row.updated_at),
        productivity
      })
    }

    for (const row of backup.tables.function_entries) {
      insertFunctionEntry.run(row)
    }

    for (const row of backup.tables.settings) {
      insertSetting.run(row)
    }
  })

  importTransaction()
}

function readSchemaVersion(native: Database.Database): string | null {
  if (!tableExists(native, 'schema_version')) {
    return null
  }

  const row = native.prepare('SELECT version FROM schema_version WHERE id = 1').get() as
    | { version: string }
    | undefined
  return row?.version ?? null
}

function setSchemaVersion(native: Database.Database, version: string): void {
  const now = new Date().toISOString()
  native
    .prepare(
      `INSERT INTO schema_version (id, version, updated_at)
       VALUES (1, @version, @updatedAt)
       ON CONFLICT(id) DO UPDATE SET version = excluded.version, updated_at = excluded.updated_at`
    )
    .run({ version, updatedAt: now })
}

function shouldPerformMigration(native: Database.Database, storedVersion: string | null): boolean {
  if (storedVersion === CURRENT_SCHEMA_VERSION) {
    return false
  }

  const hasData = MIGRATION_TABLES.some((tableName) => tableHasRows(native, tableName))
  return hasData || storedVersion !== null
}

export function ensureDatabaseSchema(native: Database.Database, appDirectory: string): void {
  createTables(native)
  const storedVersion = readSchemaVersion(native)
  const needsMigration = shouldPerformMigration(native, storedVersion)

  if (needsMigration) {
    const backup = exportDatabase(native, storedVersion)
    const backupPath = writeBackup(appDirectory, backup)
    dropTables(native)
    createTables(native)
    importTables(native, backup)
    console.info(
      `[DB] Schema version updated from ${storedVersion ?? 'unknown'} to ${CURRENT_SCHEMA_VERSION}. Backup: ${backupPath}`
    )
  }

  setSchemaVersion(native, CURRENT_SCHEMA_VERSION)
}
