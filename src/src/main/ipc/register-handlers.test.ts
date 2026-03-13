import { describe, expect, it, vi } from 'vitest'

import type { ProjectDetail, ProjectSummary, StudioSettings } from '@shared/fp'
import { STUDIO_CHANNELS } from '@shared/ipc'

import { registerStudioIpcHandlers } from './register-handlers'
import type { StudioIpcHandlers } from './handlers'

describe('registerStudioIpcHandlers', () => {
  it('既存ハンドラーを解除して新しいハンドラーを登録する', async () => {
    const projectSummary: ProjectSummary = {
      id: 'p1',
      name: '案件A',
      description: '',
      productivity: 1,
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
    const registeredHandlers = new Map<string, (_event: unknown, input?: unknown) => unknown>()
    const ipcMain = {
      handle: vi.fn((channel: string, handler: (_event: unknown, input?: unknown) => unknown) => {
        registeredHandlers.set(channel, handler)
      }),
      removeHandler: vi.fn()
    }
    const handlers: StudioIpcHandlers = {
      listProjects: vi.fn<StudioIpcHandlers['listProjects']>(async () => [projectSummary]),
      getProject: vi.fn<StudioIpcHandlers['getProject']>(async (input) => {
        return input.projectId === 'p1' ? projectDetail : null
      }),
      createProject: vi.fn<StudioIpcHandlers['createProject']>(async () => projectDetail),
      deleteProject: vi.fn<StudioIpcHandlers['deleteProject']>(async () => undefined),
      createFunctionEntry: vi.fn<StudioIpcHandlers['createFunctionEntry']>(
        async () => projectDetail
      ),
      updateFunctionEntry: vi.fn<StudioIpcHandlers['updateFunctionEntry']>(
        async () => projectDetail
      ),
      deleteFunctionEntry: vi.fn<StudioIpcHandlers['deleteFunctionEntry']>(
        async () => projectDetail
      ),
      getSettings: vi.fn<StudioIpcHandlers['getSettings']>(async () => settings),
      updateSettings: vi.fn<StudioIpcHandlers['updateSettings']>(async (input) => ({
        defaultProductivity: input.defaultProductivity
      })),
      updateProjectProductivity: vi.fn<StudioIpcHandlers['updateProjectProductivity']>(
        async () => projectDetail
      )
    }

    registerStudioIpcHandlers(ipcMain, handlers)

    expect(ipcMain.removeHandler.mock.calls.map(([channel]) => channel)).toEqual(
      Object.values(STUDIO_CHANNELS)
    )
    expect(ipcMain.handle.mock.calls.map(([channel]) => channel)).toEqual(
      Object.values(STUDIO_CHANNELS)
    )

    await expect(registeredHandlers.get(STUDIO_CHANNELS.listProjects)?.({})).resolves.toEqual([
      projectSummary
    ])
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.getProject)?.({}, { projectId: 'p1' })
    ).resolves.toEqual(projectDetail)
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.createProject)?.({}, { name: '案件A' })
    ).resolves.toEqual(projectDetail)
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.deleteProject)?.({}, { projectId: 'p1' })
    ).resolves.toBeUndefined()
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.createFunctionEntry)?.({}, { name: '顧客登録' })
    ).resolves.toEqual(projectDetail)
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.updateFunctionEntry)?.({}, { entryId: 'f1' })
    ).resolves.toEqual(projectDetail)
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.deleteFunctionEntry)?.({}, { entryId: 'f1' })
    ).resolves.toEqual(projectDetail)
    await expect(registeredHandlers.get(STUDIO_CHANNELS.getSettings)?.({})).resolves.toEqual(
      settings
    )
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.updateSettings)?.({}, { defaultProductivity: 1.25 })
    ).resolves.toEqual({ defaultProductivity: 1.25 })
    await expect(
      registeredHandlers.get(STUDIO_CHANNELS.updateProjectProductivity)?.(
        {},
        {
          projectId: 'p1',
          productivity: 1.5
        }
      )
    ).resolves.toEqual(projectDetail)

    expect(handlers.listProjects).toHaveBeenCalledTimes(1)
    expect(handlers.getProject).toHaveBeenCalledWith({ projectId: 'p1' })
    expect(handlers.createProject).toHaveBeenCalledWith({ name: '案件A' })
    expect(handlers.deleteProject).toHaveBeenCalledWith({ projectId: 'p1' })
    expect(handlers.createFunctionEntry).toHaveBeenCalledWith({ name: '顧客登録' })
    expect(handlers.updateFunctionEntry).toHaveBeenCalledWith({ entryId: 'f1' })
    expect(handlers.deleteFunctionEntry).toHaveBeenCalledWith({ entryId: 'f1' })
    expect(handlers.getSettings).toHaveBeenCalledTimes(1)
    expect(handlers.updateSettings).toHaveBeenCalledWith({ defaultProductivity: 1.25 })
    expect(handlers.updateProjectProductivity).toHaveBeenCalledWith({
      projectId: 'p1',
      productivity: 1.5
    })
  })
})
