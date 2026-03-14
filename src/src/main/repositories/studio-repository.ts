import { desc, eq } from 'drizzle-orm'

import type {
  FunctionEntry,
  FunctionType,
  StudioSettings,
  DifficultyRule,
  ProjectDetail,
  WeightTable
} from '@shared/fp'

import type { DatabaseContext } from '../database/client'
import { functionEntriesTable, projectsTable, settingsTable } from '../database/schema'
import { DEFAULT_STUDIO_SETTINGS } from '@shared/fp'

interface ProjectRecord extends Pick<
  ProjectDetail,
  'id' | 'name' | 'description' | 'createdAt' | 'updatedAt' | 'productivity'
> {}

interface FunctionEntryRecord extends FunctionEntry {}

export interface StudioRepository {
  listProjects: () => ProjectRecord[]
  getProject: (projectId: string) => ProjectRecord | null
  createProject: (project: ProjectRecord) => void
  updateProjectTimestamp: (projectId: string, updatedAt: string) => void
  setProjectProductivity: (projectId: string, productivity: number, updatedAt: string) => void
  deleteProject: (projectId: string) => void
  listFunctionEntries: (projectId: string) => FunctionEntryRecord[]
  createFunctionEntry: (entry: FunctionEntryRecord) => void
  updateFunctionEntry: (entry: FunctionEntryRecord) => void
  deleteFunctionEntry: (entryId: string) => void
  getSettings: () => StudioSettings
  setDefaultProductivity: (value: number) => void
  setDifficultyRules: (rules: readonly DifficultyRule[]) => void
  setWeightTable: (table: WeightTable) => void
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

function upsertSetting(db: DatabaseContext['db'], key: string, value: string): void {
  const updatedAt = new Date().toISOString()

  db.insert(settingsTable)
    .values({
      key,
      value,
      updatedAt
    })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: {
        value,
        updatedAt
      }
    })
    .run()
}

function parseNumberSetting(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : undefined

  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback
}

function parseJsonSetting<T>(value: unknown, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  return fallback
}

function readSettings(db: DatabaseContext['db']): StudioSettings {
  const rows = db.select().from(settingsTable).all()
  const map = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

  const difficultyRules = parseJsonSetting<readonly DifficultyRule[]>(
    map['difficultyRules'],
    DEFAULT_STUDIO_SETTINGS.difficultyRules
  )

  const weightTable = parseJsonSetting<WeightTable>(
    map['weightTable'],
    DEFAULT_STUDIO_SETTINGS.weightTable
  )

  return {
    defaultProductivity: parseNumberSetting(
      map['defaultProductivity'],
      DEFAULT_STUDIO_SETTINGS.defaultProductivity
    ),
    difficultyRules,
    weightTable
  }
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
    setProjectProductivity: (projectId, productivity, updatedAt) => {
      db.update(projectsTable)
        .set({ productivity, updatedAt })
        .where(eq(projectsTable.id, projectId))
        .run()
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
    updateFunctionEntry: (entry) => {
      db.update(functionEntriesTable)
        .set({
          name: entry.name,
          functionType: entry.functionType,
          det: entry.det,
          referenceCount: entry.referenceCount,
          difficulty: entry.difficulty,
          functionPoints: entry.functionPoints,
          note: entry.note,
          updatedAt: entry.updatedAt
        })
        .where(eq(functionEntriesTable.id, entry.id))
        .run()
    },
    deleteFunctionEntry: (entryId) => {
      db.delete(functionEntriesTable).where(eq(functionEntriesTable.id, entryId)).run()
    },
    getSettings: () => readSettings(db),
    setDefaultProductivity: (value) => {
      const normalized = String(value)
      upsertSetting(db, 'defaultProductivity', normalized)
    },
    setDifficultyRules: (rules) => {
      upsertSetting(db, 'difficultyRules', JSON.stringify(rules))
    },
    setWeightTable: (table) => {
      upsertSetting(db, 'weightTable', JSON.stringify(table))
    },
    close: () => native.close()
  }
}
