import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'

import {
  STUDIO_CHANNELS,
  UPDATE_CHANNELS,
  UPDATE_EVENTS,
  type StudioApi,
  type UpdateState
} from '@shared/ipc'

const subscribeToUpdateState = (listener: (state: UpdateState) => void): (() => void) => {
  const handler = (_event: IpcRendererEvent, state: UpdateState): void => listener(state)
  ipcRenderer.on(UPDATE_EVENTS.stateChanged, handler)

  return () => {
    ipcRenderer.removeListener(UPDATE_EVENTS.stateChanged, handler)
  }
}

const studioApi: StudioApi = {
  listProjects: () => ipcRenderer.invoke(STUDIO_CHANNELS.listProjects),
  getProject: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.getProject, input),
  createProject: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.createProject, input),
  deleteProject: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.deleteProject, input),
  createFunctionEntry: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.createFunctionEntry, input),
  updateFunctionEntry: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.updateFunctionEntry, input),
  deleteFunctionEntry: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.deleteFunctionEntry, input),
  getSettings: () => ipcRenderer.invoke(STUDIO_CHANNELS.getSettings),
  updateSettings: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.updateSettings, input),
  updateProjectProductivity: (input) =>
    ipcRenderer.invoke(STUDIO_CHANNELS.updateProjectProductivity, input),
  exportProjectToExcel: (input) => ipcRenderer.invoke(STUDIO_CHANNELS.exportProjectToExcel, input),
  getUpdateState: () => ipcRenderer.invoke(UPDATE_CHANNELS.getUpdateState),
  checkForUpdates: () => ipcRenderer.invoke(UPDATE_CHANNELS.checkForUpdates),
  installUpdate: () => ipcRenderer.invoke(UPDATE_CHANNELS.installUpdate),
  subscribeToUpdateState
}

if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('fpStudio', studioApi)
} else {
  ;(window as unknown as Window & { fpStudio: StudioApi }).fpStudio = studioApi
}
