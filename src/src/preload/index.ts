import { contextBridge, ipcRenderer } from 'electron'

import { STUDIO_CHANNELS, type StudioApi } from '@shared/ipc'

const studioApi: StudioApi = {
  listProjects: () => ipcRenderer.invoke(STUDIO_CHANNELS.listProjects),
  getProject: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.getProject, input),
  createProject: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.createProject, input),
  deleteProject: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.deleteProject, input),
  createFunctionEntry: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.createFunctionEntry, input),
  deleteFunctionEntry: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.deleteFunctionEntry, input),
  getSettings: () => ipcRenderer.invoke(STUDIO_CHANNELS.getSettings),
  updateSettings: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.updateSettings, input)
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('fpStudio', studioApi)
} else {
  ;(window as unknown as Window & { fpStudio: StudioApi }).fpStudio = studioApi
}
