import { mkdirSync } from 'fs'
import { join } from 'path'

import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'

import {
  STUDIO_APP_DIRECTORY_NAME,
  ensureStudioAppDirectory,
  getDatabaseFilePath
} from './app-paths'
import { bootstrapDatabase } from './database/bootstrap'
import { createDatabaseContext } from './database/client'
import { createStudioIpcHandlers } from './ipc/handlers'
import { registerStudioIpcHandlers } from './ipc/register-handlers'
import { createStudioRepository } from './repositories/studio-repository'
import { createStudioService } from './services/studio-service'

let mainWindow: BrowserWindow | null = null
let closeDatabase: (() => void) | null = null

app.setName(STUDIO_APP_DIRECTORY_NAME)

const configuredAppDataPath = process.env.FP_STUDIO_APP_DATA_PATH

if (configuredAppDataPath) {
  mkdirSync(configuredAppDataPath, { recursive: true })
  app.setPath('appData', configuredAppDataPath)
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1200,
    minHeight: 760,
    show: false,
    autoHideMenuBar: true,
    title: 'FP Studio',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    return
  }

  mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.fpstudio.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const appDataPath = app.getPath('appData')
  const studioDirectory = ensureStudioAppDirectory(appDataPath)
  app.setPath('userData', studioDirectory)

  const databaseContext = createDatabaseContext(getDatabaseFilePath(appDataPath))
  bootstrapDatabase(databaseContext)

  const repository = createStudioRepository(databaseContext)
  closeDatabase = repository.close

  const service = createStudioService(repository)
  registerStudioIpcHandlers(ipcMain, createStudioIpcHandlers(service))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  closeDatabase?.()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
