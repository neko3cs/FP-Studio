import { describe, expect, it, vi } from 'vitest'

import type { ProjectDetail, ProjectSummary, StudioSettings } from '@shared/fp'

import { createStudioIpcHandlers } from './handlers'
import type { StudioService } from '../services/studio-service'

describe('createStudioIpcHandlers', () => {
  it('サービスへ処理を委譲する', async () => {
    const projectSummary: ProjectSummary = {
      id: 'p1',
      name: 'A',
      description: '',
      functionCount: 0,
      totalFunctionPoints: 0,
      estimatedEffortDays: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    }
    const projectDetail: ProjectDetail = {
      ...projectSummary,
      entries: []
    }
    const settings: StudioSettings = { defaultProductivity: 1 }
    const service: StudioService = {
      listProjects: vi.fn<StudioService['listProjects']>(() => [projectSummary]),
      getProjectDetail: vi.fn<StudioService['getProjectDetail']>(() => null),
      createProject: vi.fn<StudioService['createProject']>((input) => ({
        ...projectDetail,
        name: input.name,
        description: input.description
      })),
      deleteProject: vi.fn(),
      createFunctionEntry: vi.fn<StudioService['createFunctionEntry']>(() => projectDetail),
      updateFunctionEntry: vi.fn<StudioService['updateFunctionEntry']>(() => projectDetail),
      deleteFunctionEntry: vi.fn<StudioService['deleteFunctionEntry']>(() => projectDetail),
      getSettings: vi.fn<StudioService['getSettings']>(() => settings),
      updateSettings: vi.fn((input) => input)
    }

    const handlers = createStudioIpcHandlers(service)

    await expect(handlers.getProject({ projectId: 'p1' })).resolves.toBeNull()
    await expect(handlers.listProjects()).resolves.toHaveLength(1)
    await expect(
      handlers.createFunctionEntry({
        projectId: 'p1',
        name: '新規機能',
        functionType: 'EI',
        det: 4,
        referenceCount: 1,
        note: '備考'
      })
    ).resolves.toEqual(projectDetail)
    await handlers.createProject({ name: '新規案件', description: '説明' })
    await handlers.deleteProject({ projectId: 'p1' })
    await handlers.updateFunctionEntry({
      projectId: 'p1',
      entryId: 'f1',
      name: '機能',
      functionType: 'EI',
      det: 4,
      referenceCount: 1,
      note: ''
    })
    await expect(
      handlers.deleteFunctionEntry({
        projectId: 'p1',
        entryId: 'f1'
      })
    ).resolves.toEqual(projectDetail)
    await expect(handlers.getSettings()).resolves.toEqual(settings)
    await handlers.updateSettings({ defaultProductivity: 1.25 })

    expect(service.listProjects).toHaveBeenCalledTimes(1)
    expect(service.getProjectDetail).toHaveBeenCalledWith('p1')
    expect(service.createProject).toHaveBeenCalledWith({ name: '新規案件', description: '説明' })
    expect(service.createFunctionEntry).toHaveBeenCalledWith({
      projectId: 'p1',
      name: '新規機能',
      functionType: 'EI',
      det: 4,
      referenceCount: 1,
      note: '備考'
    })
    expect(service.deleteProject).toHaveBeenCalledWith('p1')
    expect(service.updateFunctionEntry).toHaveBeenCalledWith({
      projectId: 'p1',
      entryId: 'f1',
      name: '機能',
      functionType: 'EI',
      det: 4,
      referenceCount: 1,
      note: ''
    })
    expect(service.deleteFunctionEntry).toHaveBeenCalledWith({
      projectId: 'p1',
      entryId: 'f1'
    })
    expect(service.getSettings).toHaveBeenCalledTimes(1)
    expect(service.updateSettings).toHaveBeenCalledWith({ defaultProductivity: 1.25 })
  })
})
