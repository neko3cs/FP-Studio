import { describe, expect, it, vi } from 'vitest'

import { createStudioIpcHandlers } from './handlers'

describe('createStudioIpcHandlers', () => {
  it('サービスへ処理を委譲する', async () => {
    const service = {
      listProjects: vi.fn(() => [
        {
          id: 'p1',
          name: 'A',
          description: '',
          functionCount: 0,
          totalFunctionPoints: 0,
          estimatedEffortDays: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]),
      getProjectDetail: vi.fn(() => null),
      createProject: vi.fn((input) => ({
        id: 'p1',
        name: input.name,
        description: input.description,
        functionCount: 0,
        totalFunctionPoints: 0,
        estimatedEffortDays: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        entries: []
      })),
      deleteProject: vi.fn(),
      createFunctionEntry: vi.fn(),
      deleteFunctionEntry: vi.fn(),
      getSettings: vi.fn(() => ({ defaultProductivity: 1 })),
      updateSettings: vi.fn((input) => input)
    }

    const handlers = createStudioIpcHandlers(service)

    await expect(handlers.listProjects()).resolves.toHaveLength(1)
    await handlers.createProject({ name: '新規案件', description: '説明' })
    await handlers.deleteProject({ projectId: 'p1' })
    await handlers.updateSettings({ defaultProductivity: 1.25 })

    expect(service.listProjects).toHaveBeenCalledTimes(1)
    expect(service.createProject).toHaveBeenCalledWith({ name: '新規案件', description: '説明' })
    expect(service.deleteProject).toHaveBeenCalledWith('p1')
    expect(service.updateSettings).toHaveBeenCalledWith({ defaultProductivity: 1.25 })
  })
})
