import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useSettingsForm } from './useSettingsForm'

describe('useSettingsForm', () => {
  it('入力値を更新できる', () => {
    const { result } = renderHook(() => useSettingsForm(1))

    expect(result.current.defaultProductivity).toBe('1')
    expect(result.current.canSubmit).toBe(true)

    act(() => {
      result.current.updateValue('1.5')
    })

    expect(result.current.defaultProductivity).toBe('1.5')
    expect(result.current.canSubmit).toBe(true)
  })

  it('0 以下は submit 不可になり reset で戻せる', () => {
    const { result } = renderHook(() => useSettingsForm(1.25))

    act(() => {
      result.current.updateValue('0')
    })

    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.reset(2)
    })

    expect(result.current.defaultProductivity).toBe('2')
    expect(result.current.canSubmit).toBe(true)
  })
})
