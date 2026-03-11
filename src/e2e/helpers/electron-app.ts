import { mkdtemp, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

import type { ElectronApplication, Page } from 'playwright'
import { _electron as electron } from 'playwright'

const projectRoot = process.cwd()

export interface StudioAppContext {
  electronApp: ElectronApplication
  page: Page
  appDataRoot: string
}

export async function createAppDataRoot(prefix = 'fp-studio-e2e-'): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

export async function launchStudioApp(appDataRoot: string): Promise<StudioAppContext> {
  const electronApp = await electron.launch({
    args: ['.'],
    cwd: projectRoot,
    env: {
      ...process.env,
      FP_STUDIO_APP_DATA_PATH: appDataRoot
    }
  })

  const page = await electronApp.firstWindow()
  await page.getByTestId('fp-studio-app').waitFor({ state: 'visible' })

  return {
    electronApp,
    page,
    appDataRoot
  }
}

export async function closeStudioApp(context: StudioAppContext): Promise<void> {
  await context.electronApp.close()
}

export async function removeAppDataRoot(appDataRoot: string): Promise<void> {
  await rm(appDataRoot, { recursive: true, force: true })
}
