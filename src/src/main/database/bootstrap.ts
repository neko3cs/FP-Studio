import type { DatabaseContext } from './client'

export function bootstrapDatabase(databaseContext: DatabaseContext): void {
  databaseContext.native.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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
  `)

  const now = new Date().toISOString()
  databaseContext.native
    .prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (@key, @value, @updatedAt)
       ON CONFLICT(key) DO NOTHING`
    )
    .run({ key: 'defaultProductivity', value: '1', updatedAt: now })
}
