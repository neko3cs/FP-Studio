import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useFunctionEntryForm } from './useFunctionEntryForm'

describe('useFunctionEntryForm', () => {
  it('初期値から難易度プレビューを返す', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    expect(result.current.referenceLabel).toBe('FTR')
    expect(result.current.preview).toEqual({
      difficulty: 'Low',
      functionPoints: 3
    })
    expect(result.current.canSubmit).toBe(false)
  })

  it('Function Type と値に応じてプレビューを更新する', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.updateField('name', '顧客マスタ')
      result.current.updateField('functionType', 'ILF')
      result.current.updateField('det', '30')
      result.current.updateField('referenceCount', '3')
    })

    expect(result.current.referenceLabel).toBe('RET')
    expect(result.current.preview).toEqual({
      difficulty: 'Average',
      functionPoints: 10
    })
    expect(result.current.canSubmit).toBe(true)
  })

  it('不正な数値入力ではプレビューを返さない', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.updateField('name', '売上照会')
      result.current.updateField('det', '0')
    })

    expect(result.current.preview).toBeNull()
    expect(result.current.canSubmit).toBe(false)
  })

  it('FTR/RETが不正でも submit 不可になる', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.updateField('name', '売上照会')
      result.current.updateField('referenceCount', '-1')
    })

    expect(result.current.preview).toBeNull()
    expect(result.current.canSubmit).toBe(false)
  })

  it('最小値の DET=1 と FTR/RET=0 でもプレビューできる', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.updateField('name', '最小境界')
      result.current.updateField('det', '1')
      result.current.updateField('referenceCount', '0')
    })

    expect(result.current.preview).toEqual({
      difficulty: 'Low',
      functionPoints: 3
    })
    expect(result.current.canSubmit).toBe(true)
  })

  it('空白だけの名前では submit できない', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.updateField('name', '   ')
      result.current.updateField('det', '4')
      result.current.updateField('referenceCount', '1')
    })

    expect(result.current.preview).toEqual({
      difficulty: 'Low',
      functionPoints: 3
    })
    expect(result.current.canSubmit).toBe(false)
  })

  it('既存エントリを編集状態に読み込み、キャンセルで初期化できる', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.startEditing({
        id: 'entry-1',
        projectId: 'project-1',
        name: '顧客照会',
        functionType: 'EQ',
        det: 8,
        referenceCount: 2,
        difficulty: 'Average',
        functionPoints: 4,
        note: '既存機能',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })
    })

    expect(result.current.isEditing).toBe(true)
    expect(result.current.editingEntryId).toBe('entry-1')
    expect(result.current.values).toMatchObject({
      name: '顧客照会',
      functionType: 'EQ',
      det: '8',
      referenceCount: '2',
      note: '既存機能'
    })

    act(() => {
      result.current.cancelEditing()
    })

    expect(result.current.isEditing).toBe(false)
    expect(result.current.editingEntryId).toBeNull()
    expect(result.current.values.name).toBe('')
  })

  it('reset でも編集状態を解除できる', () => {
    const { result } = renderHook(() => useFunctionEntryForm())

    act(() => {
      result.current.startEditing({
        id: 'entry-1',
        projectId: 'project-1',
        name: '顧客照会',
        functionType: 'EQ',
        det: 8,
        referenceCount: 2,
        difficulty: 'Average',
        functionPoints: 4,
        note: '既存機能',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      })
      result.current.reset()
    })

    expect(result.current.isEditing).toBe(false)
    expect(result.current.editingEntryId).toBeNull()
    expect(result.current.values).toEqual({
      name: '',
      functionType: 'EI',
      det: '4',
      referenceCount: '1',
      note: ''
    })
  })
})
