import { existsSync, mkdtempSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

import { describe, expect, it } from 'vitest'

import { ensureStudioAppDirectory, getDatabaseFilePath } from './app-paths'

describe('app paths', () => {
  it('FP Studio 用の保存先を作成する', () => {
    const appDataPath = mkdtempSync(join(tmpdir(), 'fp-studio-appdata-'))
    const directory = ensureStudioAppDirectory(appDataPath)

    expect(directory).toBe(join(appDataPath, 'FP Studio'))
    expect(existsSync(directory)).toBe(true)
  })

  it('DB ファイル名に FP Studio.db を使う', () => {
    const appDataPath = mkdtempSync(join(tmpdir(), 'fp-studio-db-'))

    expect(getDatabaseFilePath(appDataPath)).toBe(join(appDataPath, 'FP Studio', 'FP Studio.db'))
  })
})
