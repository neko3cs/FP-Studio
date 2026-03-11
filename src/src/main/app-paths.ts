import { mkdirSync } from 'fs'
import { join } from 'path'

export const STUDIO_APP_DIRECTORY_NAME = 'FP Studio'

export function getStudioAppDirectory(appDataPath: string): string {
  return join(appDataPath, STUDIO_APP_DIRECTORY_NAME)
}

export function ensureStudioAppDirectory(appDataPath: string): string {
  const directory = getStudioAppDirectory(appDataPath)
  mkdirSync(directory, { recursive: true })
  return directory
}

export function getDatabaseFilePath(appDataPath: string): string {
  return join(ensureStudioAppDirectory(appDataPath), 'fp-studio.db')
}
