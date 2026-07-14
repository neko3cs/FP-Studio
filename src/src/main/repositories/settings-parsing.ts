import type { DifficultyRule, StudioSettings, WeightTable } from '@shared/fp'
import { DEFAULT_STUDIO_SETTINGS } from '@shared/fp'

/**
 * settings テーブルの生の値を解析して StudioSettings を組み立てる純粋ロジック。
 * SQLite（better-sqlite3）に依存しないため vitest から単体テスト・ミューテーションテスト可能。
 * 実DBアクセス（クエリ発行）は Electron ABI の都合で vitest から直接テストできず、
 * Playwright e2e が実 SQLite で検証する。
 */

// settings テーブルの value は常に TEXT（string）。未設定キーは undefined になり得るが、
// Number(undefined) は NaN、JSON.parse(undefined) は例外となり、いずれもフォールバックする。
function parseNumberSetting(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseJsonSetting<T>(value: string | undefined, fallback: T): T {
  try {
    return JSON.parse(value as string) as T
  } catch {
    return fallback
  }
}

export function buildStudioSettings(
  rows: readonly { key: string; value: string }[]
): StudioSettings {
  const map = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value
    return acc
  }, {})

  const difficultyRules = parseJsonSetting<readonly DifficultyRule[]>(
    map['difficultyRules'],
    DEFAULT_STUDIO_SETTINGS.difficultyRules
  )

  const weightTable = parseJsonSetting<WeightTable>(
    map['weightTable'],
    DEFAULT_STUDIO_SETTINGS.weightTable
  )

  return {
    defaultProductivity: parseNumberSetting(
      map['defaultProductivity'],
      DEFAULT_STUDIO_SETTINGS.defaultProductivity
    ),
    difficultyRules,
    weightTable
  }
}
