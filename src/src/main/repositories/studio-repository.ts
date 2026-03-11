import { desc, eq } from 'drizzle-orm'

import type { FunctionEntry, FunctionType, ProjectDetail, StudioSettings } from '@shared/fp'

import type { DatabaseContext } from '../database/client'
import { functionEntriesTable, projectsTable, settingsTable } from '../database/schema'

interface ProjectRecord extends Pick<
  ProjectDetail,
  'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'
> {}

interface FunctionEntryRecord extends FunctionEntry {}

export interface StudioRepository {
  listProjects: () => ProjectRecord[]
  getProject: (projectId: string) => ProjectRecord | null
  createProject: (project: ProjectRecord) => void
  updateProjectTimestamp: (projectId: string, updatedAt: string) => void
  deleteProject: (projectId: string) => void
  listFunctionEntries: (projectId: string) => FunctionEntryRecord[]
  createFunctionEntry: (entry: FunctionEntryRecord) => void
  deleteFunctionEntry: (entryId: string) => void
  getSettings: () => StudioSettings
  setDefaultProductivity: (value: number) => void
  close: () => void
}

function normalizeFunctionEntryRecord(entry: {
  id: string
  projectId: string
  name: string
  functionType: FunctionType
  det: number
  referenceCount: number
  difficulty: FunctionEntry['difficulty']
  functionPoints: number
  note: string
  createdAt: string
  updatedAt: string
}): FunctionEntryRecord {
  return entry
}

export function createStudioRepository(databaseContext: DatabaseContext): StudioRepository {
  const { db, native } = databaseContext

  return {
    listProjects: () =>
      db.select().from(projectsTable).orderBy(desc(projectsTable.updatedAt)).all(),
    getProject: (projectId) =>
      db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).get() ?? null,
    createProject: (project) => {
      db.insert(projectsTable).values(project).run()
    },
    updateProjectTimestamp: (projectId, updatedAt) => {
      db.update(projectsTable).set({ updatedAt }).where(eq(projectsTable.id, projectId)).run()
    },
    deleteProject: (projectId) => {
      db.delete(projectsTable).where(eq(projectsTable.id, projectId)).run()
    },
    listFunctionEntries: (projectId) =>
      db
        .select()
        .from(functionEntriesTable)
        .where(eq(functionEntriesTable.projectId, projectId))
        .orderBy(desc(functionEntriesTable.createdAt))
        .all()
        .map(normalizeFunctionEntryRecord),
    createFunctionEntry: (entry) => {
      db.insert(functionEntriesTable).values(entry).run()
    },
    deleteFunctionEntry: (entryId) => {
      db.delete(functionEntriesTable).where(eq(functionEntriesTable.id, entryId)).run()
    },
    getSettings: () => {
      const row = db
        .select()
        .from(settingsTable)
        .where(eq(settingsTable.key, 'defaultProductivity'))
        .get()

      return {
        defaultProductivity: row ? Number(row.value) : 1
      }
    },
    setDefaultProductivity: (value) => {
      const updatedAt = new Date().toISOString()

      db.insert(settingsTable)
        .values({
          key: 'defaultProductivity',
          value: String(value),
          updatedAt
        })
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: {
            value: String(value),
            updatedAt
          }
        })
        .run()
    },
    close: () => native.close()
  }
}
