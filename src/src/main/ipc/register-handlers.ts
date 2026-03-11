import type { IpcMain } from 'electron'

import { STUDIO_CHANNELS } from '@shared/ipc'

import type { StudioIpcHandlers } from './handlers'

export function registerStudioIpcHandlers(
  ipcMain: Pick<IpcMain, 'handle' | 'removeHandler'>,
  handlers: StudioIpcHandlers
): void {
  ipcMain.removeHandler(STUDIO_CHANNELS.listProjects)
  ipcMain.removeHandler(STUDIO_CHANNELS.getProject)
  ipcMain.removeHandler(STUDIO_CHANNELS.createProject)
  ipcMain.removeHandler(STUDIO_CHANNELS.deleteProject)
  ipcMain.removeHandler(STUDIO_CHANNELS.createFunctionEntry)
  ipcMain.removeHandler(STUDIO_CHANNELS.deleteFunctionEntry)
  ipcMain.removeHandler(STUDIO_CHANNELS.getSettings)
  ipcMain.removeHandler(STUDIO_CHANNELS.updateSettings)

  ipcMain.handle(STUDIO_CHANNELS.listProjects, () => handlers.listProjects())
  ipcMain.handle(STUDIO_CHANNELS.getProject, (_event, input) => handlers.getProject(input))
  ipcMain.handle(STUDIO_CHANNELS.createProject, (_event, input) => handlers.createProject(input))
  ipcMain.handle(STUDIO_CHANNELS.deleteProject, (_event, input) => handlers.deleteProject(input))
  ipcMain.handle(STUDIO_CHANNELS.createFunctionEntry, (_event, input) =>
    handlers.createFunctionEntry(input)
  )
  ipcMain.handle(STUDIO_CHANNELS.deleteFunctionEntry, (_event, input) =>
    handlers.deleteFunctionEntry(input)
  )
  ipcMain.handle(STUDIO_CHANNELS.getSettings, () => handlers.getSettings())
  ipcMain.handle(STUDIO_CHANNELS.updateSettings, (_event, input) => handlers.updateSettings(input))
}
