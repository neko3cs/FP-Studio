import type {
  CreateFunctionEntryInput,
  CreateProjectInput,
  DeleteFunctionEntryInput,
  DeleteProjectInput,
  DuplicateProjectInput,
  GetProjectInput,
  ProjectDetail,
  ProjectSummary,
  RenameProjectInput,
  StudioSettings,
  UpdateFunctionEntryInput,
  UpdateProjectProductivityInput,
  UpdateSettingsInput
} from '@shared/fp'
import { BrowserWindow, dialog } from 'electron'

import { buildDefaultExportFileName, buildProjectWorkbook } from '../export/project-excel'

import type { StudioService } from '../services/studio-service'

export interface StudioIpcHandlers {
  listProjects: () => Promise<ProjectSummary[]>
  getProject: (input: GetProjectInput) => Promise<ProjectDetail | null>
  createProject: (input: CreateProjectInput) => Promise<ProjectDetail>
  duplicateProject: (input: DuplicateProjectInput) => Promise<ProjectDetail>
  renameProject: (input: RenameProjectInput) => Promise<ProjectDetail>
  deleteProject: (input: DeleteProjectInput) => Promise<void>
  createFunctionEntry: (input: CreateFunctionEntryInput) => Promise<ProjectDetail>
  updateFunctionEntry: (input: UpdateFunctionEntryInput) => Promise<ProjectDetail>
  deleteFunctionEntry: (input: DeleteFunctionEntryInput) => Promise<ProjectDetail>
  getSettings: () => Promise<StudioSettings>
  updateSettings: (input: UpdateSettingsInput) => Promise<StudioSettings>
  updateProjectProductivity: (input: UpdateProjectProductivityInput) => Promise<ProjectDetail>
  exportProjectToExcel: (input: { projectId: string }) => Promise<void>
}

export function createStudioIpcHandlers(service: StudioService): StudioIpcHandlers {
  return {
    listProjects: async () => service.listProjects(),
    getProject: async (input) => service.getProjectDetail(input.projectId),
    createProject: async (input) => service.createProject(input),
    duplicateProject: async (input) => service.duplicateProject(input),
    renameProject: async (input) => service.renameProject(input),
    deleteProject: async (input) => service.deleteProject(input.projectId),
    createFunctionEntry: async (input) => service.createFunctionEntry(input),
    updateFunctionEntry: async (input) => service.updateFunctionEntry(input),
    deleteFunctionEntry: async (input) => service.deleteFunctionEntry(input),
    getSettings: async () => service.getSettings(),
    updateSettings: async (input) => service.updateSettings(input),
    updateProjectProductivity: async (input) => service.updateProjectProductivity(input),
    exportProjectToExcel: async (input) => {
      const project = service.getProjectDetail(input.projectId)

      if (!project) {
        throw new Error('対象のプロジェクトが見つかりません。')
      }

      const workbook = buildProjectWorkbook(project)
      const defaultFilename = buildDefaultExportFileName(project.name)
      const parentWindow = BrowserWindow.getFocusedWindow()
      const saveDialogOptions = {
        defaultPath: defaultFilename,
        filters: [
          {
            name: 'Excel Workbook',
            extensions: ['xlsx']
          }
        ],
        title: 'Excelへエクスポート'
      }
      const { canceled, filePath } = parentWindow
        ? await dialog.showSaveDialog(parentWindow, saveDialogOptions)
        : await dialog.showSaveDialog(saveDialogOptions)

      if (canceled || !filePath) {
        return
      }

      await workbook.xlsx.writeFile(filePath)
    }
  }
}
