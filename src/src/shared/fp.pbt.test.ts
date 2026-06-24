import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import {
  analyzeFunctionPoint,
  buildProjectTotals,
  COMPLEXITY_LEVELS,
  DEFAULT_WEIGHT_TABLE,
  FUNCTION_TYPES,
  type FunctionEntry,
  type FunctionType,
} from './fp'

const functionTypeArb = fc.constantFrom(...FUNCTION_TYPES)
const detArb = fc.integer({ min: 1, max: 200 })
const referenceCountArb = fc.integer({ min: 0, max: 30 })
const productivityArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true })

const entryArb: fc.Arbitrary<FunctionEntry> = fc
  .tuple(
    fc.uuid(),
    fc.uuid(),
    fc.string({ minLength: 1, maxLength: 50 }),
    functionTypeArb,
    detArb,
    referenceCountArb,
    fc.constantFrom(...COMPLEXITY_LEVELS),
    fc.integer({ min: 1, max: 15 }),
  )
  .map(([id, projectId, name, functionType, det, referenceCount, difficulty, functionPoints]) => ({
    id,
    projectId,
    name,
    functionType,
    det,
    referenceCount,
    difficulty,
    functionPoints,
    note: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  }))

describe('analyzeFunctionPoint', () => {
  it('任意の有効入力に対して難易度は常に Low/Average/High のいずれかを返す', () => {
    fc.assert(
      fc.property(functionTypeArb, detArb, referenceCountArb, (functionType, det, referenceCount) => {
        const result = analyzeFunctionPoint(functionType, det, referenceCount)
        expect(COMPLEXITY_LEVELS).toContain(result.difficulty)
      }),
    )
  })

  it('FPは常に正の整数で、機能種別と難易度の重みと一致する', () => {
    fc.assert(
      fc.property(functionTypeArb, detArb, referenceCountArb, (functionType, det, referenceCount) => {
        const result = analyzeFunctionPoint(functionType, det, referenceCount)
        const expectedFP = DEFAULT_WEIGHT_TABLE[functionType][result.difficulty]
        expect(result.functionPoints).toBe(expectedFP)
        expect(Number.isInteger(result.functionPoints)).toBe(true)
        expect(result.functionPoints).toBeGreaterThan(0)
      }),
    )
  })

  it('同じ入力に対して常に同じ結果を返す（参照透過性）', () => {
    fc.assert(
      fc.property(functionTypeArb, detArb, referenceCountArb, (functionType, det, referenceCount) => {
        const r1 = analyzeFunctionPoint(functionType, det, referenceCount)
        const r2 = analyzeFunctionPoint(functionType, det, referenceCount)
        expect(r1.difficulty).toBe(r2.difficulty)
        expect(r1.functionPoints).toBe(r2.functionPoints)
      }),
    )
  })

  it('ILFのFPは常に7以上、EI・EQのFPは常に6以下（重みテーブルの構造的保証）', () => {
    fc.assert(
      fc.property(detArb, referenceCountArb, (det, ref) => {
        const ilfResult = analyzeFunctionPoint('ILF', det, ref)
        const eiResult = analyzeFunctionPoint('EI', det, ref)
        const eqResult = analyzeFunctionPoint('EQ', det, ref)
        expect(ilfResult.functionPoints).toBeGreaterThanOrEqual(7)
        expect(eiResult.functionPoints).toBeLessThanOrEqual(6)
        expect(eqResult.functionPoints).toBeLessThanOrEqual(6)
      }),
    )
  })
})

describe('buildProjectTotals', () => {
  it('functionCountは常にentries.lengthに等しい', () => {
    fc.assert(
      fc.property(fc.array(entryArb, { maxLength: 50 }), productivityArb, (entries, productivity) => {
        const totals = buildProjectTotals(entries, productivity)
        expect(totals.functionCount).toBe(entries.length)
      }),
    )
  })

  it('totalFunctionPointsは各エントリのfunctionPoints合計に等しい', () => {
    fc.assert(
      fc.property(fc.array(entryArb, { maxLength: 50 }), productivityArb, (entries, productivity) => {
        const totals = buildProjectTotals(entries, productivity)
        const expected = entries.reduce((sum, e) => sum + e.functionPoints, 0)
        expect(totals.totalFunctionPoints).toBe(expected)
      }),
    )
  })

  it('エントリが0件のときは全集計値が0になる', () => {
    fc.assert(
      fc.property(productivityArb, (productivity) => {
        const totals = buildProjectTotals([], productivity)
        expect(totals.functionCount).toBe(0)
        expect(totals.totalFunctionPoints).toBe(0)
        expect(totals.estimatedEffortDays).toBe(0)
      }),
    )
  })

  it('estimatedEffortDaysはtotalFunctionPoints * productivityを小数2桁に丸めた値', () => {
    fc.assert(
      fc.property(
        fc.array(entryArb, { minLength: 1, maxLength: 20 }),
        productivityArb,
        (entries, productivity) => {
          const totals = buildProjectTotals(entries, productivity)
          const rawEffort = totals.totalFunctionPoints * productivity
          const expected = Math.round(rawEffort * 100) / 100
          expect(totals.estimatedEffortDays).toBe(expected)
        },
      ),
    )
  })

  it('生産性を2倍にするとestimatedEffortDaysもほぼ2倍になる', () => {
    fc.assert(
      fc.property(
        fc.array(entryArb, { minLength: 1, maxLength: 20 }),
        fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true }),
        (entries, productivity) => {
          const totals1 = buildProjectTotals(entries, productivity)
          const totals2 = buildProjectTotals(entries, productivity * 2)
          // 丸め誤差を考慮して1日以内の誤差を許容
          expect(Math.abs(totals2.estimatedEffortDays - totals1.estimatedEffortDays * 2)).toBeLessThanOrEqual(1)
        },
      ),
    )
  })
})
