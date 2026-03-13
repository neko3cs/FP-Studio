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
  updateSettings: 'studio:update-settings',
  updateProjectProductivity: 'studio:update-project-productivity',
  exportProjectToExcel: 'studio:export-project-to-excel'
} as const

export const UPDATE_CHANNELS = {
  getUpdateState: 'studio:get-update-state',
  checkForUpdates: 'studio:check-for-updates',
  installUpdate: 'studio:install-update'
} as const

export const UPDATE_EVENTS = {
  stateChanged: 'studio:update-state-changed'
} as const

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

export interface UpdateProgress {
  percent: number
  transferred: number
  total: number
}

export interface UpdateState {
  status: UpdateStatus
  message?: string
  version?: string
  releaseNotes?: string
  progress?: UpdateProgress
}

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
  updateProjectProductivity: (input: UpdateProjectProductivityInput) => Promise<ProjectDetail>
  exportProjectToExcel: (input: { projectId: string }) => Promise<void>
  getUpdateState: () => Promise<UpdateState>
  checkForUpdates: () => Promise<void>
  installUpdate: () => Promise<void>
  subscribeToUpdateState: (listener: (state: UpdateState) => void) => () => void
}
