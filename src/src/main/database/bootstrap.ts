import type { DatabaseContext } from './client'

import { ensureDatabaseSchema } from './migration'

export function bootstrapDatabase(databaseContext: DatabaseContext, appDirectory: string): void {
  ensureDatabaseSchema(databaseContext.native, appDirectory)

  const now = new Date().toISOString()
  databaseContext.native
    .prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (@key, @value, @updatedAt)
       ON CONFLICT(key) DO NOTHING`
    )
    .run({ key: 'defaultProductivity', value: '1', updatedAt: now })
}
