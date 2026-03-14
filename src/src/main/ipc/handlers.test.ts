import { BrowserWindow, dialog } from 'electron'
import type { Workbook } from 'exceljs'
import { buildProjectWorkbook, buildDefaultExportFileName } from '../export/project-excel'

import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { ProjectDetail, ProjectSummary, StudioSettings } from '@shared/fp'
import { DEFAULT_STUDIO_SETTINGS } from '@shared/fp'

import { createStudioIpcHandlers } from './handlers'
import type { StudioService } from '../services/studio-service'

vi.mock('electron', () => ({
  BrowserWindow: {
    getFocusedWindow: vi.fn()
  },
  dialog: {
    showSaveDialog: vi.fn()
  }
}))

vi.mock('../export/project-excel', () => ({
  buildProjectWorkbook: vi.fn(),
  buildDefaultExportFileName: vi.fn()
}))

const projectSummary: ProjectSummary = {
  id: 'p1',
  name: 'A',
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

const settings: StudioSettings = DEFAULT_STUDIO_SETTINGS

describe('createStudioIpcHandlers', () => {
  it('サービスへ処理を委譲する', async () => {
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
      updateSettings: vi.fn((input) => ({
        ...DEFAULT_STUDIO_SETTINGS,
        defaultProductivity:
          input.defaultProductivity ?? DEFAULT_STUDIO_SETTINGS.defaultProductivity,
        difficultyRules: input.difficultyRules ?? DEFAULT_STUDIO_SETTINGS.difficultyRules,
        weightTable: input.weightTable ?? DEFAULT_STUDIO_SETTINGS.weightTable
      })),
      updateProjectProductivity: vi.fn<StudioService['updateProjectProductivity']>(
        () => projectDetail
      )
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
    await handlers.updateProjectProductivity({ projectId: 'p1', productivity: 1.5 })

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
    expect(service.updateProjectProductivity).toHaveBeenCalledWith({
      projectId: 'p1',
      productivity: 1.5
    })
  })
})

describe('exportProjectToExcel handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when the project is missing', async () => {
    const service: StudioService = {
      listProjects: vi.fn(() => [projectSummary]),
      getProjectDetail: vi.fn(() => null),
      createProject: vi.fn(),
      deleteProject: vi.fn(),
      createFunctionEntry: vi.fn(),
      updateFunctionEntry: vi.fn(),
      deleteFunctionEntry: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      updateProjectProductivity: vi.fn()
    }

    const handlers = createStudioIpcHandlers(service)

    await expect(handlers.exportProjectToExcel({ projectId: projectSummary.id })).rejects.toThrow(
      '対象のプロジェクトが見つかりません。'
    )
  })

  it('does nothing when the save dialog is canceled', async () => {
    const workbook = { xlsx: { writeFile: vi.fn() } } as unknown as Workbook
    const mockedBuildProjectWorkbook = vi.mocked(buildProjectWorkbook)
    const mockedBuildDefaultExportFileName = vi.mocked(buildDefaultExportFileName)
    const mockedGetFocusedWindow = vi.mocked(BrowserWindow.getFocusedWindow)
    const mockedShowSaveDialog = vi.mocked(dialog.showSaveDialog)

    mockedBuildProjectWorkbook.mockReturnValue(workbook)
    mockedBuildDefaultExportFileName.mockReturnValue('出力ファイル.xlsx')
    mockedGetFocusedWindow.mockReturnValue(null)
    mockedShowSaveDialog.mockResolvedValue({ canceled: true, filePath: '' })

    const service: StudioService = {
      listProjects: vi.fn(),
      getProjectDetail: vi.fn(() => projectDetail),
      createProject: vi.fn(),
      deleteProject: vi.fn(),
      createFunctionEntry: vi.fn(),
      updateFunctionEntry: vi.fn(),
      deleteFunctionEntry: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      updateProjectProductivity: vi.fn()
    }

    const handlers = createStudioIpcHandlers(service)

    await handlers.exportProjectToExcel({ projectId: projectSummary.id })

    expect(mockedBuildProjectWorkbook).toHaveBeenCalledWith(projectDetail)
    expect(workbook.xlsx.writeFile).not.toHaveBeenCalled()
  })

  it('writes the workbook when the dialog confirms', async () => {
    const workbook = { xlsx: { writeFile: vi.fn() } } as unknown as Workbook
    const mockedBuildProjectWorkbook = vi.mocked(buildProjectWorkbook)
    const mockedBuildDefaultExportFileName = vi.mocked(buildDefaultExportFileName)
    const mockedGetFocusedWindow = vi.mocked(BrowserWindow.getFocusedWindow)
    const mockedShowSaveDialog = vi.mocked(dialog.showSaveDialog)
    const dummyWindow = { id: 'window' } as unknown as BrowserWindow

    mockedBuildProjectWorkbook.mockReturnValue(workbook)
    mockedBuildDefaultExportFileName.mockReturnValue('出力ファイル.xlsx')
    mockedGetFocusedWindow.mockReturnValue(dummyWindow)
    mockedShowSaveDialog.mockResolvedValue({ canceled: false, filePath: '/tmp/export.xlsx' })

    const service: StudioService = {
      listProjects: vi.fn(),
      getProjectDetail: vi.fn(() => projectDetail),
      createProject: vi.fn(),
      deleteProject: vi.fn(),
      createFunctionEntry: vi.fn(),
      updateFunctionEntry: vi.fn(),
      deleteFunctionEntry: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      updateProjectProductivity: vi.fn()
    }

    const handlers = createStudioIpcHandlers(service)

    await handlers.exportProjectToExcel({ projectId: projectSummary.id })

    expect(mockedBuildProjectWorkbook).toHaveBeenCalledWith(projectDetail)
    expect(workbook.xlsx.writeFile).toHaveBeenCalledWith('/tmp/export.xlsx')
  })
})
