import { BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

import { UPDATE_EVENTS, type UpdateState } from '@shared/ipc'

const initialState: UpdateState = {
  status: 'idle',
  message: 'アップデートが利用可能かどうか確認できます。'
}

function normalizeReleaseNotes(releaseNotes: unknown): string | undefined {
  if (typeof releaseNotes === 'string') {
    return releaseNotes
  }

  if (Array.isArray(releaseNotes)) {
    return releaseNotes
      .map((note) => (typeof note === 'string' ? note : JSON.stringify(note)))
      .join('\n')
  }

  return undefined
}

export class UpdateManager {
  private state: UpdateState = initialState

  constructor() {
    this.installAutoUpdaterHandlers()
  }

  private installAutoUpdaterHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      this.setState({
        status: 'checking',
        message: 'アップデートを確認しています…'
      })
    })

    autoUpdater.on('update-available', (info) => {
      this.setState({
        status: 'available',
        version: info.version,
        releaseNotes: normalizeReleaseNotes(info.releaseNotes),
        message: `バージョン ${info.version} をダウンロードしています…`
      })
    })

    autoUpdater.on('update-not-available', () => {
      this.setState({
        status: 'idle',
        message: '最新版です。'
      })
    })

    autoUpdater.on('download-progress', (progress) => {
      const percentValue = Number(progress.percent ?? 0)
      const clampedPercent = Math.min(100, Number(percentValue.toFixed(1)))

      this.setState({
        status: 'downloading',
        message: `${clampedPercent}% ダウンロード完了`,
        progress: {
          percent: clampedPercent,
          transferred: progress.transferred,
          total: progress.total
        }
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.setState({
        status: 'ready',
        version: info.version,
        releaseNotes: normalizeReleaseNotes(info.releaseNotes),
        message: `バージョン ${info.version} のインストール準備ができました。`
      })
    })

    autoUpdater.on('error', (error) => {
      this.setState({
        status: 'error',
        message: error?.message ?? 'アップデートの確認に失敗しました。'
      })
    })
  }

  private broadcastState(): void {
    const windows = BrowserWindow.getAllWindows()
    for (const window of windows) {
      if (window.webContents.isDestroyed()) {
        continue
      }
      window.webContents.send(UPDATE_EVENTS.stateChanged, this.state)
    }
  }

  private setState(state: UpdateState): void {
    this.state = state
    this.broadcastState()
  }

  public getState(): UpdateState {
    return this.state
  }

  public async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'アップデートの確認でエラーが発生しました。'
      })
    }
  }

  public installUpdate(): void {
    if (this.state.status !== 'ready') {
      this.setState({
        status: 'error',
        message: 'アップデートはまだダウンロードされていません。'
      })
      return
    }

    autoUpdater.quitAndInstall()
  }

  public sendStateToWindow(window: BrowserWindow): void {
    if (window.webContents.isDestroyed()) {
      return
    }

    window.webContents.send(UPDATE_EVENTS.stateChanged, this.state)
  }
}

export const studioUpdateManager = new UpdateManager()
