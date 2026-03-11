import { describe, expect, it } from 'vitest'

import { analyzeFunctionPoint, buildProjectTotals, type FunctionEntry } from './fp'

describe('analyzeFunctionPoint', () => {
  it('EI の難易度と FP を自動判定する', () => {
    expect(analyzeFunctionPoint('EI', 3, 1)).toEqual({ difficulty: 'Low', functionPoints: 3 })
    expect(analyzeFunctionPoint('EI', 10, 2)).toEqual({ difficulty: 'Average', functionPoints: 4 })
    expect(analyzeFunctionPoint('EI', 20, 4)).toEqual({ difficulty: 'High', functionPoints: 6 })
  })

  it('ILF の難易度と FP を自動判定する', () => {
    expect(analyzeFunctionPoint('ILF', 10, 1)).toEqual({ difficulty: 'Low', functionPoints: 7 })
    expect(analyzeFunctionPoint('ILF', 25, 3)).toEqual({
      difficulty: 'Average',
      functionPoints: 10
    })
    expect(analyzeFunctionPoint('ILF', 60, 6)).toEqual({ difficulty: 'High', functionPoints: 15 })
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
})
