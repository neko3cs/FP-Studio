import { describe, expect, it } from 'vitest'

import type { WeightTable } from '@shared/fp'
import { DEFAULT_DIFFICULTY_RULES, DEFAULT_WEIGHT_TABLE } from '@shared/fp'

import { buildStudioSettings } from './settings-parsing'

// NOTE: 実DB（better-sqlite3 + Drizzle）へのアクセスは Electron 向けにビルドされた
// ネイティブモジュールに依存し、vitest（素の Node）の ABI と一致しないため直接テストできない。
// SQL 委譲部分は Playwright e2e が実 SQLite で検証する。ここでは native に依存しない
// 純粋な設定解析ロジック（buildStudioSettings）を単体テストする。
describe('StudioRepository の設定解析', () => {
  describe('buildStudioSettings', () => {
    it('行が空のときは既定設定を返す', () => {
      expect(buildStudioSettings([])).toEqual({
        defaultProductivity: 1,
        difficultyRules: DEFAULT_DIFFICULTY_RULES,
        weightTable: DEFAULT_WEIGHT_TABLE
      })
    })

    it('defaultProductivity を数値文字列から解釈する', () => {
      expect(
        buildStudioSettings([{ key: 'defaultProductivity', value: '2.5' }]).defaultProductivity
      ).toBe(2.5)
    })

    it('数値に変換できない defaultProductivity は既定値へフォールバックする', () => {
      expect(
        buildStudioSettings([{ key: 'defaultProductivity', value: 'abc' }]).defaultProductivity
      ).toBe(1)
    })

    it('difficultyRules / weightTable の JSON を解釈する', () => {
      const customWeights: WeightTable = {
        ...DEFAULT_WEIGHT_TABLE,
        EI: { Low: 30, Average: 40, High: 60 }
      }

      const settings = buildStudioSettings([
        { key: 'difficultyRules', value: JSON.stringify(DEFAULT_DIFFICULTY_RULES) },
        { key: 'weightTable', value: JSON.stringify(customWeights) }
      ])

      expect(settings.difficultyRules).toEqual(DEFAULT_DIFFICULTY_RULES)
      expect(settings.weightTable).toEqual(customWeights)
    })

    it('壊れた JSON の difficultyRules は既定値へフォールバックする', () => {
      expect(
        buildStudioSettings([{ key: 'difficultyRules', value: '{壊れた' }]).difficultyRules
      ).toEqual(DEFAULT_DIFFICULTY_RULES)
    })

    it('壊れた JSON の weightTable は既定値へフォールバックする', () => {
      expect(buildStudioSettings([{ key: 'weightTable', value: 'not-json' }]).weightTable).toEqual(
        DEFAULT_WEIGHT_TABLE
      )
    })

    it('複数の設定キーをまとめて解釈する', () => {
      const settings = buildStudioSettings([
        { key: 'defaultProductivity', value: '1.75' },
        { key: 'weightTable', value: JSON.stringify(DEFAULT_WEIGHT_TABLE) }
      ])

      expect(settings.defaultProductivity).toBe(1.75)
      expect(settings.weightTable).toEqual(DEFAULT_WEIGHT_TABLE)
      expect(settings.difficultyRules).toEqual(DEFAULT_DIFFICULTY_RULES)
    })
  })
})
