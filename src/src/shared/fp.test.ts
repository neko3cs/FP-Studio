import { describe, expect, it } from 'vitest'

import {
  DEFAULT_DIFFICULTY_RULES,
  DEFAULT_WEIGHT_TABLE,
  FUNCTION_TYPES,
  analyzeFunctionPoint,
  buildProjectSummary,
  buildProjectTotals,
  getReferenceLabel,
  isDataFunction,
  type FunctionEntry
} from './fp'

// IFPUG標準の難易度判定閾値（EI基準）
// DET: 5未満=低, 5〜15=中, 16以上=高
// FTR: 1以下=低, 2=中, 3以上=高
// 同じ3×3マトリクス: Low/Low/Average / Low/Average/High / Average/High/High

describe('ファンクションポイントの分析', () => {
  describe('EI（外部入力）', () => {
    it('DET4・FTR1 は Low（3FP）と判定する', () => {
      expect(analyzeFunctionPoint('EI', 4, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
    })

    it('DET5・FTR2 は Average（4FP）と判定する', () => {
      expect(analyzeFunctionPoint('EI', 5, 2)).toEqual({ difficulty: 'Average', functionPoints: 4 })
    })

    it('DET16・FTR3 は High（6FP）と判定する', () => {
      expect(analyzeFunctionPoint('EI', 16, 3)).toEqual({ difficulty: 'High', functionPoints: 6 })
    })

    it('DET10・FTR2 は Average（4FP）と判定する', () => {
      expect(analyzeFunctionPoint('EI', 10, 2)).toEqual({
        difficulty: 'Average',
        functionPoints: 4
      })
    })

    it('DET20・FTR4 は High（6FP）と判定する', () => {
      expect(analyzeFunctionPoint('EI', 20, 4)).toEqual({ difficulty: 'High', functionPoints: 6 })
    })
  })

  describe('EO（外部出力）', () => {
    it('DET5・FTR1 は Low（4FP）と判定する', () => {
      expect(analyzeFunctionPoint('EO', 5, 1)).toEqual({ difficulty: 'Low', functionPoints: 4 })
    })

    it('DET10・FTR3 は Average（5FP）と判定する', () => {
      expect(analyzeFunctionPoint('EO', 10, 3)).toEqual({
        difficulty: 'Average',
        functionPoints: 5
      })
    })

    it('DET20・FTR4 は High（7FP）と判定する', () => {
      expect(analyzeFunctionPoint('EO', 20, 4)).toEqual({ difficulty: 'High', functionPoints: 7 })
    })
  })

  describe('EQ（外部照会）', () => {
    it('DET5・FTR1 は Low（3FP）と判定する', () => {
      expect(analyzeFunctionPoint('EQ', 5, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
    })

    it('DET6・FTR2 は Average（4FP）と判定する', () => {
      expect(analyzeFunctionPoint('EQ', 6, 2)).toEqual({ difficulty: 'Average', functionPoints: 4 })
    })

    it('DET8・FTR5 は High（6FP）と判定する', () => {
      expect(analyzeFunctionPoint('EQ', 8, 5)).toEqual({ difficulty: 'High', functionPoints: 6 })
    })

    it('DET6・FTR1 は Low（3FP）と判定する', () => {
      expect(analyzeFunctionPoint('EQ', 6, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
    })

    it('DET10・FTR2 は Average（4FP）と判定する', () => {
      expect(analyzeFunctionPoint('EQ', 10, 2)).toEqual({
        difficulty: 'Average',
        functionPoints: 4
      })
    })

    it('DET25・FTR4 は High（6FP）と判定する', () => {
      expect(analyzeFunctionPoint('EQ', 25, 4)).toEqual({ difficulty: 'High', functionPoints: 6 })
    })
  })

  describe('ILF（内部論理ファイル）', () => {
    it('DET19・RET1 は Low（7FP）と判定する', () => {
      expect(analyzeFunctionPoint('ILF', 19, 1)).toEqual({ difficulty: 'Low', functionPoints: 7 })
    })

    it('DET5・RET1 は Low（7FP）と判定する', () => {
      expect(analyzeFunctionPoint('ILF', 5, 1)).toEqual({ difficulty: 'Low', functionPoints: 7 })
    })

    it('DET20・RET2 は Average（10FP）と判定する', () => {
      expect(analyzeFunctionPoint('ILF', 20, 2)).toEqual({
        difficulty: 'Average',
        functionPoints: 10
      })
    })

    it('DET35・RET4 は Average（10FP）と判定する', () => {
      expect(analyzeFunctionPoint('ILF', 35, 4)).toEqual({
        difficulty: 'Average',
        functionPoints: 10
      })
    })

    it('DET55・RET6 は High（15FP）と判定する', () => {
      expect(analyzeFunctionPoint('ILF', 55, 6)).toEqual({ difficulty: 'High', functionPoints: 15 })
    })
  })

  describe('EIF（外部インタフェースファイル）', () => {
    it('DET51・RET6 は High（10FP）と判定する', () => {
      expect(analyzeFunctionPoint('EIF', 51, 6)).toEqual({ difficulty: 'High', functionPoints: 10 })
    })

    it('DET55・RET7 は High（10FP）と判定する', () => {
      expect(analyzeFunctionPoint('EIF', 55, 7)).toEqual({ difficulty: 'High', functionPoints: 10 })
    })
  })

  describe('3×3難易度マトリクスの網羅検証', () => {
    it('全機能種別の境界値でマトリクス全9セルを正しく判定する', () => {
      const expectedMatrix = [
        ['Low', 'Low', 'Average'],
        ['Low', 'Average', 'High'],
        ['Average', 'High', 'High']
      ] as const

      for (const functionType of FUNCTION_TYPES) {
        const rule = DEFAULT_DIFFICULTY_RULES.find((r) => r.functionType === functionType)
        expect(rule).toBeDefined()

        const [mediumStart, highStart] = rule!.det
        const [lowThreshold, highThreshold] = rule!.reference
        const detValues = [mediumStart - 1, mediumStart, highStart]
        const referenceValues = [lowThreshold, lowThreshold + 1, highThreshold + 1]

        referenceValues.forEach((ref, refIdx) => {
          detValues.forEach((det, detIdx) => {
            const difficulty = expectedMatrix[refIdx][detIdx]
            expect(analyzeFunctionPoint(functionType, det, ref)).toEqual({
              difficulty,
              functionPoints: DEFAULT_WEIGHT_TABLE[functionType][difficulty]
            })
          })
        })
      }
    })
  })

  describe('カスタム設定のフォールバック', () => {
    it('指定した機能種別だけ難易度ルールを上書きでき、未指定は既定値を使う', () => {
      const customRules = DEFAULT_DIFFICULTY_RULES.map((rule) =>
        rule.functionType === 'EI'
          ? { functionType: 'EI' as const, det: [10, 20] as const, reference: [2, 4] as const }
          : rule
      )

      expect(analyzeFunctionPoint('EI', 10, 3, { difficultyRules: customRules })).toEqual({
        difficulty: 'Average',
        functionPoints: 4
      })
      expect(analyzeFunctionPoint('EO', 6, 2, { difficultyRules: customRules })).toEqual({
        difficulty: 'Average',
        functionPoints: 5
      })
    })

    it('指定した重みを上書きでき、NaNなど無効な値は既定値にフォールバックする', () => {
      const customWeightTable = {
        ...DEFAULT_WEIGHT_TABLE,
        EI: { Low: 30, Average: Number.NaN, High: 60 }
      }

      expect(analyzeFunctionPoint('EI', 4, 1, { weightTable: customWeightTable })).toEqual({
        difficulty: 'Low',
        functionPoints: 30
      })
      expect(analyzeFunctionPoint('EI', 5, 2, { weightTable: customWeightTable })).toEqual({
        difficulty: 'Average',
        functionPoints: 4
      })
      expect(analyzeFunctionPoint('EO', 6, 2, { weightTable: customWeightTable })).toEqual({
        difficulty: 'Average',
        functionPoints: 5
      })
    })
  })
})

describe('プロジェクト集計', () => {
  describe('機能件数・合計UFP・概算工数の算出', () => {
    it('複数の機能エントリと生産性から集計値を正確に計算する', () => {
      const entries: FunctionEntry[] = [
        {
          id: '1',
          projectId: 'p1',
          name: '顧客登録',
          functionType: 'EI',
          det: 12,
          referenceCount: 2,
          difficulty: 'Average',
          functionPoints: 4,
          note: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          projectId: 'p1',
          name: '顧客マスタ',
          functionType: 'ILF',
          det: 30,
          referenceCount: 3,
          difficulty: 'Average',
          functionPoints: 10,
          note: '',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]

      expect(buildProjectTotals(entries, 1.25)).toEqual({
        functionCount: 2,
        totalFunctionPoints: 14,
        estimatedEffortDays: 17.5
      })
    })

    it('機能が0件のときは全ての集計値が0になる', () => {
      expect(buildProjectTotals([], 1.5)).toEqual({
        functionCount: 0,
        totalFunctionPoints: 0,
        estimatedEffortDays: 0
      })
    })
  })

  describe('プロジェクトサマリーの構築', () => {
    it('プロジェクト情報に集計結果を合わせて返す', () => {
      expect(
        buildProjectSummary(
          {
            id: 'p1',
            name: '案件A',
            description: '説明',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            productivity: 1.333
          },
          [
            {
              id: '1',
              projectId: 'p1',
              name: '照会',
              functionType: 'EQ',
              det: 8,
              referenceCount: 2,
              difficulty: 'Average',
              functionPoints: 4,
              note: '',
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z'
            }
          ]
        )
      ).toEqual({
        id: 'p1',
        name: '案件A',
        description: '説明',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        productivity: 1.333,
        functionCount: 1,
        totalFunctionPoints: 4,
        estimatedEffortDays: 5.33
      })
    })
  })
})

describe('機能の分類', () => {
  describe('データ機能かどうかの判定', () => {
    it('ILF はデータ機能に分類される', () => {
      expect(isDataFunction('ILF')).toBe(true)
    })

    it('EIF はデータ機能に分類される', () => {
      expect(isDataFunction('EIF')).toBe(true)
    })

    it('EI はデータ機能に分類されない', () => {
      expect(isDataFunction('EI')).toBe(false)
    })

    it('EO はデータ機能に分類されない', () => {
      expect(isDataFunction('EO')).toBe(false)
    })

    it('EQ はデータ機能に分類されない', () => {
      expect(isDataFunction('EQ')).toBe(false)
    })
  })

  describe('参照ラベルの取得', () => {
    it('データ機能（ILF）の参照ラベルは RET である', () => {
      expect(getReferenceLabel('ILF')).toBe('RET')
    })

    it('データ機能（EIF）の参照ラベルは RET である', () => {
      expect(getReferenceLabel('EIF')).toBe('RET')
    })

    it('トランザクション機能（EI）の参照ラベルは FTR である', () => {
      expect(getReferenceLabel('EI')).toBe('FTR')
    })

    it('トランザクション機能（EO）の参照ラベルは FTR である', () => {
      expect(getReferenceLabel('EO')).toBe('FTR')
    })

    it('トランザクション機能（EQ）の参照ラベルは FTR である', () => {
      expect(getReferenceLabel('EQ')).toBe('FTR')
    })
  })
})
