import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useProjectProductivityForm } from './useProjectProductivityForm'

describe('useProjectProductivityForm', () => {
  it('初期値を文字列で管理する', () => {
    const { result } = renderHook(() => useProjectProductivityForm(1.25))

    expect(result.current.productivity).toBe('1.25')
    expect(result.current.canSubmit).toBe(false)
  })

  it('入力値を更新できる', () => {
    const { result } = renderHook(() => useProjectProductivityForm(1))

    act(() => {
      result.current.updateValue('1.5')
    })

    expect(result.current.productivity).toBe('1.5')
    expect(result.current.canSubmit).toBe(true)
  })

  it('reset で現在値を baseline に揃える', () => {
    const { result } = renderHook(() => useProjectProductivityForm(1))

    act(() => {
      result.current.updateValue('1.5')
      result.current.reset(1.5)
    })

    expect(result.current.productivity).toBe('1.50')
    expect(result.current.canSubmit).toBe(false)
  })

  it('ゼロ以下や非数では送信できない', () => {
    const { result } = renderHook(() => useProjectProductivityForm(1))

    act(() => {
      result.current.updateValue('0')
    })
    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.updateValue('abc')
    })
    expect(result.current.canSubmit).toBe(false)
  })
})
