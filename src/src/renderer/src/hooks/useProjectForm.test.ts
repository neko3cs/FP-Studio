import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useProjectForm } from './useProjectForm'

describe('useProjectForm', () => {
  it('入力更新と submit 可否を管理できる', () => {
    const { result } = renderHook(() => useProjectForm())

    expect(result.current.canSubmit).toBe(false)
    expect(result.current.values).toEqual({ name: '', description: '' })

    act(() => {
      result.current.updateField('name', '顧客管理システム')
      result.current.updateField('description', '初期案件')
    })

    expect(result.current.values).toEqual({
      name: '顧客管理システム',
      description: '初期案件'
    })
    expect(result.current.canSubmit).toBe(true)
  })

  it('reset で初期状態へ戻る', () => {
    const { result } = renderHook(() => useProjectForm())

    act(() => {
      result.current.updateField('name', '案件A')
      result.current.updateField('description', '説明')
      result.current.reset()
    })

    expect(result.current.values).toEqual({ name: '', description: '' })
    expect(result.current.canSubmit).toBe(false)
  })
})
