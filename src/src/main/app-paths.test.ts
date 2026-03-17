import { existsSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { describe, expect, it } from 'vitest'

import {
  STUDIO_APP_DIRECTORY_NAME,
  STUDIO_DATABASE_FILE_NAME,
  ensureStudioAppDirectory,
  getDatabaseFilePath,
  getStudioAppDirectory
} from './app-paths'

describe('app paths', () => {
  it('アプリ保存先のパスを組み立てる', () => {
    expect(getStudioAppDirectory('/tmp/appdata')).toBe('/tmp/appdata/FP Studio')
    expect(STUDIO_APP_DIRECTORY_NAME).toBe('FP Studio')
    expect(STUDIO_DATABASE_FILE_NAME).toBe('FP Studio.db')
  })

  it('FP Studio 用の保存先を作成する', () => {
    const appDataPath = mkdtempSync(join(tmpdir(), 'fp-studio-appdata-'))
    const directory = ensureStudioAppDirectory(appDataPath)

    expect(directory).toBe(join(appDataPath, 'FP Studio'))
    expect(existsSync(directory)).toBe(true)
  })

  it('ネストした appDataPath でも再帰的かつ冪等に保存先を作成する', () => {
    const root = mkdtempSync(join(tmpdir(), 'fp-studio-nested-'))
    const appDataPath = join(root, 'nested', 'appdata')

    const first = ensureStudioAppDirectory(appDataPath)
    const second = ensureStudioAppDirectory(appDataPath)

    expect(first).toBe(join(appDataPath, 'FP Studio'))
    expect(second).toBe(first)
    expect(existsSync(first)).toBe(true)
  })

  it('DB ファイル名に FP Studio.db を使う', () => {
    const appDataPath = mkdtempSync(join(tmpdir(), 'fp-studio-db-'))

    expect(getDatabaseFilePath(appDataPath)).toBe(join(appDataPath, 'FP Studio', 'FP Studio.db'))
  })
})
