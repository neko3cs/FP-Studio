import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'

import * as schema from './schema'

export interface DatabaseContext {
  native: Database.Database
  db: BetterSQLite3Database<typeof schema>
}

export function createDatabaseContext(databaseFilePath: string): DatabaseContext {
  const native = new Database(databaseFilePath)
  native.pragma('journal_mode = WAL')
  native.pragma('foreign_keys = ON')

  return {
    native,
    db: drizzle(native, { schema })
  }
}
