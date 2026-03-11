import {
  analyzeFunctionPoint,
  buildProjectSummary,
  type CreateFunctionEntryInput,
  type CreateProjectInput,
  type DeleteFunctionEntryInput,
  type FunctionEntry,
  type ProjectDetail,
  type ProjectSummary,
  type StudioSettings,
  type UpdateSettingsInput
} from '@shared/fp'

import type { StudioRepository } from '../repositories/studio-repository'

export interface StudioService {
  listProjects: () => ProjectSummary[]
  getProjectDetail: (projectId: string) => ProjectDetail | null
  createProject: (input: CreateProjectInput) => ProjectDetail
  deleteProject: (projectId: string) => void
  createFunctionEntry: (input: CreateFunctionEntryInput) => ProjectDetail
  deleteFunctionEntry: (input: DeleteFunctionEntryInput) => ProjectDetail
  getSettings: () => StudioSettings
  updateSettings: (input: UpdateSettingsInput) => StudioSettings
}

function requireNonEmptyText(value: string, fieldName: string): string {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error(`${fieldName}は必須です。`)
  }

  return normalized
}

function requireInteger(value: number, fieldName: string, minimum: number): number {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${fieldName}は${minimum}以上の整数で入力してください。`)
  }

  return value
}

function toProjectDetail(
  project: { id: string; name: string; description: string; createdAt: string; updatedAt: string },
  entries: FunctionEntry[],
  settings: StudioSettings
): ProjectDetail {
  return {
    ...buildProjectSummary(project, entries, settings.defaultProductivity),
    entries
  }
}

export function createStudioService(repository: StudioRepository): StudioService {
  return {
    listProjects: () => {
      const settings = repository.getSettings()

      return repository.listProjects().map((project) => {
        const entries = repository.listFunctionEntries(project.id)
        return buildProjectSummary(project, entries, settings.defaultProductivity)
      })
    },
    getProjectDetail: (projectId) => {
      const project = repository.getProject(projectId)

      if (!project) {
        return null
      }

      return toProjectDetail(
        project,
        repository.listFunctionEntries(projectId),
        repository.getSettings()
      )
    },
    createProject: (input) => {
      const now = new Date().toISOString()
      const project = {
        id: crypto.randomUUID(),
        name: requireNonEmptyText(input.name, 'プロジェクト名'),
        description: input.description.trim(),
        createdAt: now,
        updatedAt: now
      }

      repository.createProject(project)

      return toProjectDetail(project, [], repository.getSettings())
    },
    deleteProject: (projectId) => {
      const project = repository.getProject(projectId)

      if (!project) {
        throw new Error('削除対象のプロジェクトが見つかりません。')
      }

      repository.deleteProject(projectId)
    },
    createFunctionEntry: (input) => {
      const project = repository.getProject(input.projectId)

      if (!project) {
        throw new Error('対象プロジェクトが見つかりません。')
      }

      const det = requireInteger(input.det, 'DET', 1)
      const referenceCount = requireInteger(input.referenceCount, '参照ファイル数', 0)
      const analysis = analyzeFunctionPoint(input.functionType, det, referenceCount)
      const now = new Date().toISOString()
      const entry: FunctionEntry = {
        id: crypto.randomUUID(),
        projectId: input.projectId,
        name: requireNonEmptyText(input.name, '機能名'),
        functionType: input.functionType,
        det,
        referenceCount,
        difficulty: analysis.difficulty,
        functionPoints: analysis.functionPoints,
        note: input.note.trim(),
        createdAt: now,
        updatedAt: now
      }

      repository.createFunctionEntry(entry)
      repository.updateProjectTimestamp(project.id, now)

      return toProjectDetail(
        { ...project, updatedAt: now },
        repository.listFunctionEntries(project.id),
        repository.getSettings()
      )
    },
    deleteFunctionEntry: (input) => {
      const project = repository.getProject(input.projectId)

      if (!project) {
        throw new Error('対象プロジェクトが見つかりません。')
      }

      const entry = repository
        .listFunctionEntries(input.projectId)
        .find((currentEntry) => currentEntry.id === input.entryId)

      if (!entry) {
        throw new Error('削除対象の機能が見つかりません。')
      }

      repository.deleteFunctionEntry(input.entryId)
      const updatedAt = new Date().toISOString()
      repository.updateProjectTimestamp(project.id, updatedAt)

      return toProjectDetail(
        { ...project, updatedAt },
        repository.listFunctionEntries(input.projectId),
        repository.getSettings()
      )
    },
    getSettings: () => repository.getSettings(),
    updateSettings: (input) => {
      if (!Number.isFinite(input.defaultProductivity) || input.defaultProductivity <= 0) {
        throw new Error('生産性は0より大きい数値で入力してください。')
      }

      repository.setDefaultProductivity(Number(input.defaultProductivity.toFixed(2)))
      return repository.getSettings()
    }
  }
}
