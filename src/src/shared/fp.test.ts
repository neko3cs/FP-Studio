import { describe, expect, it } from 'vitest'

import {
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
          updatedAt: '2026-01-01T00:00:00.000Z'
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
        ],
        1.333
      )
    ).toEqual({
      id: 'p1',
      name: '案件A',
      description: '説明',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      functionCount: 1,
      totalFunctionPoints: 4,
      estimatedEffortDays: 5.33
    })
  })
})

describe('analyzeFunctionPoint の境界値', () => {
  it('データ機能の上限より上の DET / 参照数を評価する', () => {
    expect(analyzeFunctionPoint('ILF', 55, 6)).toEqual({ difficulty: 'High', functionPoints: 15 })
    expect(analyzeFunctionPoint('ILF', 35, 4)).toEqual({ difficulty: 'Average', functionPoints: 10 })
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
