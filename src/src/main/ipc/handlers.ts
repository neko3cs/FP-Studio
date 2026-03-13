import type {
  CreateFunctionEntryInput,
  CreateProjectInput,
  DeleteFunctionEntryInput,
  DeleteProjectInput,
  GetProjectInput,
  ProjectDetail,
  ProjectSummary,
  StudioSettings,
  UpdateFunctionEntryInput,
  UpdateProjectProductivityInput,
  UpdateSettingsInput
} from '@shared/fp'

import type { StudioService } from '../services/studio-service'

export interface StudioIpcHandlers {
  listProjects: () => Promise<ProjectSummary[]>
  getProject: (input: GetProjectInput) => Promise<ProjectDetail | null>
  createProject: (input: CreateProjectInput) => Promise<ProjectDetail>
  deleteProject: (input: DeleteProjectInput) => Promise<void>
  createFunctionEntry: (input: CreateFunctionEntryInput) => Promise<ProjectDetail>
  updateFunctionEntry: (input: UpdateFunctionEntryInput) => Promise<ProjectDetail>
  deleteFunctionEntry: (input: DeleteFunctionEntryInput) => Promise<ProjectDetail>
  getSettings: () => Promise<StudioSettings>
  updateSettings: (input: UpdateSettingsInput) => Promise<StudioSettings>
  updateProjectProductivity: (input: UpdateProjectProductivityInput) => Promise<ProjectDetail>
}

export function createStudioIpcHandlers(service: StudioService): StudioIpcHandlers {
  return {
    listProjects: async () => service.listProjects(),
    getProject: async (input) => service.getProjectDetail(input.projectId),
    createProject: async (input) => service.createProject(input),
    deleteProject: async (input) => service.deleteProject(input.projectId),
    createFunctionEntry: async (input) => service.createFunctionEntry(input),
    updateFunctionEntry: async (input) => service.updateFunctionEntry(input),
    deleteFunctionEntry: async (input) => service.deleteFunctionEntry(input),
    getSettings: async () => service.getSettings(),
    updateSettings: async (input) => service.updateSettings(input),
    updateProjectProductivity: async (input) => service.updateProjectProductivity(input)
  }
}
