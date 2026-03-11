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
  UpdateSettingsInput
} from './fp'

export const STUDIO_CHANNELS = {
  listProjects: 'studio:list-projects',
  getProject: 'studio:get-project',
  createProject: 'studio:create-project',
  deleteProject: 'studio:delete-project',
  createFunctionEntry: 'studio:create-function-entry',
  updateFunctionEntry: 'studio:update-function-entry',
  deleteFunctionEntry: 'studio:delete-function-entry',
  getSettings: 'studio:get-settings',
  updateSettings: 'studio:update-settings'
} as const

export interface StudioApi {
  listProjects: () => Promise<ProjectSummary[]>
  getProject: (input: GetProjectInput) => Promise<ProjectDetail | null>
  createProject: (input: CreateProjectInput) => Promise<ProjectDetail>
  deleteProject: (input: DeleteProjectInput) => Promise<void>
  createFunctionEntry: (input: CreateFunctionEntryInput) => Promise<ProjectDetail>
  updateFunctionEntry: (input: UpdateFunctionEntryInput) => Promise<ProjectDetail>
  deleteFunctionEntry: (input: DeleteFunctionEntryInput) => Promise<ProjectDetail>
  getSettings: () => Promise<StudioSettings>
  updateSettings: (input: UpdateSettingsInput) => Promise<StudioSettings>
}
