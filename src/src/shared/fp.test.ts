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

describe('analyzeFunctionPoint', () => {
  it('EI の難易度と FP を自動判定する', () => {
    expect(analyzeFunctionPoint('EI', 4, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
    expect(analyzeFunctionPoint('EI', 5, 2)).toEqual({ difficulty: 'Average', functionPoints: 4 })
    expect(analyzeFunctionPoint('EI', 16, 3)).toEqual({ difficulty: 'High', functionPoints: 6 })
  })

  it('EO と EQ の閾値を判定する', () => {
    expect(analyzeFunctionPoint('EO', 5, 1)).toEqual({ difficulty: 'Low', functionPoints: 4 })
    expect(analyzeFunctionPoint('EO', 20, 4)).toEqual({ difficulty: 'High', functionPoints: 7 })
    expect(analyzeFunctionPoint('EQ', 6, 2)).toEqual({
      difficulty: 'Average',
      functionPoints: 4
    })
  })

  it('ILF と EIF の閾値を判定する', () => {
    expect(analyzeFunctionPoint('ILF', 19, 1)).toEqual({ difficulty: 'Low', functionPoints: 7 })
    expect(analyzeFunctionPoint('ILF', 20, 2)).toEqual({
      difficulty: 'Average',
      functionPoints: 10
    })
    expect(analyzeFunctionPoint('EIF', 51, 6)).toEqual({ difficulty: 'High', functionPoints: 10 })
  })
})

describe('isDataFunction / getReferenceLabel', () => {
  it('データ機能かどうかと参照ラベルを返す', () => {
    expect(isDataFunction('ILF')).toBe(true)
    expect(isDataFunction('EIF')).toBe(true)
    expect(isDataFunction('EI')).toBe(false)
    expect(getReferenceLabel('EO')).toBe('FTR')
    expect(getReferenceLabel('ILF')).toBe('RET')
  })
})

describe('buildProjectTotals', () => {
  it('合計 FP と概算工数を算出する', () => {
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

  it('buildProjectSummary で丸め済みの集計を付与する', () => {
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

describe('analyzeFunctionPoint の境界値', () => {
  it('データ機能の上限より上の DET / 参照数を評価する', () => {
    expect(analyzeFunctionPoint('ILF', 55, 6)).toEqual({ difficulty: 'High', functionPoints: 15 })
    expect(analyzeFunctionPoint('ILF', 35, 4)).toEqual({
      difficulty: 'Average',
      functionPoints: 10
    })
  })

  it('トランザクション機能の参照閾値を網羅する', () => {
    expect(analyzeFunctionPoint('EO', 10, 3)).toEqual({ difficulty: 'Average', functionPoints: 5 })
    expect(analyzeFunctionPoint('EQ', 8, 5)).toEqual({ difficulty: 'High', functionPoints: 6 })
    expect(analyzeFunctionPoint('EQ', 6, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
  })
})

describe('analyzeFunctionPoint の参照数の分岐', () => {
  it('EI は 2 件で中間、最大で高難易度になる', () => {
    expect(analyzeFunctionPoint('EI', 10, 2)).toEqual({ difficulty: 'Average', functionPoints: 4 })
    expect(analyzeFunctionPoint('EI', 20, 4)).toEqual({ difficulty: 'High', functionPoints: 6 })
  })

  it('EQ は参照数と DET に応じて Low〜High の難易度を返す', () => {
    expect(analyzeFunctionPoint('EQ', 5, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
    expect(analyzeFunctionPoint('EQ', 10, 2)).toEqual({ difficulty: 'Average', functionPoints: 4 })
    expect(analyzeFunctionPoint('EQ', 25, 4)).toEqual({ difficulty: 'High', functionPoints: 6 })
  })

  it('ILF/EIF は DET と参照数の最大値で High を返す', () => {
    expect(analyzeFunctionPoint('ILF', 5, 1)).toEqual({ difficulty: 'Low', functionPoints: 7 })
    expect(analyzeFunctionPoint('EIF', 55, 7)).toEqual({ difficulty: 'High', functionPoints: 10 })
  })
})

describe('analyzeFunctionPoint の全マトリクス', () => {
  it('各 Function Type の 3x3 マトリクスを既定ルールどおりに判定する', () => {
    const expectedMatrix = [
      ['Low', 'Low', 'Average'],
      ['Low', 'Average', 'High'],
      ['Average', 'High', 'High']
    ] as const

    for (const functionType of FUNCTION_TYPES) {
      const rule = DEFAULT_DIFFICULTY_RULES.find(
        (currentRule) => currentRule.functionType === functionType
      )

      expect(rule).toBeDefined()

      const [mediumStart, highStart] = rule!.det
      const [lowThreshold, highThreshold] = rule!.reference
      const detValues = [mediumStart - 1, mediumStart, highStart]
      const referenceValues = [lowThreshold, lowThreshold + 1, highThreshold + 1]

      referenceValues.forEach((referenceCount, referenceIndex) => {
        detValues.forEach((det, detIndex) => {
          const difficulty = expectedMatrix[referenceIndex][detIndex]

          expect(analyzeFunctionPoint(functionType, det, referenceCount)).toEqual({
            difficulty,
            functionPoints: DEFAULT_WEIGHT_TABLE[functionType][difficulty]
          })
        })
      })
    }
  })
})

describe('analyzeFunctionPoint のカスタム設定', () => {
  it('一部の難易度ルールだけ渡したときは未指定タイプで既定値にフォールバックする', () => {
    const customRules = DEFAULT_DIFFICULTY_RULES.map((rule) =>
      rule.functionType === 'EI'
        ? {
            functionType: 'EI' as const,
            det: [10, 20] as const,
            reference: [2, 4] as const
          }
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

  it('重みテーブルの一部を差し替え、無効な値は既定値にフォールバックする', () => {
    const customWeightTable = {
      ...DEFAULT_WEIGHT_TABLE,
      EI: {
        Low: 30,
        Average: Number.NaN,
        High: 60
      }
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
