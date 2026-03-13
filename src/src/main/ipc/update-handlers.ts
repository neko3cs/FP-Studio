import type { IpcMain } from 'electron'

import { UPDATE_CHANNELS } from '@shared/ipc'

import type { UpdateManager } from '../update-manager'

export function registerUpdateIpcHandlers(
  ipcMain: Pick<IpcMain, 'handle'>,
  updateManager: UpdateManager
): void {
  ipcMain.handle(UPDATE_CHANNELS.getUpdateState, () => updateManager.getState())
  ipcMain.handle(UPDATE_CHANNELS.checkForUpdates, () => updateManager.checkForUpdates())
  ipcMain.handle(UPDATE_CHANNELS.installUpdate, () => updateManager.installUpdate())
}
