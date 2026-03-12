import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { act, cleanup, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RendererErrorBoundary } from './RendererErrorBoundary'

function renderWithProvider(element: React.ReactElement): void {
  render(React.createElement(FluentProvider, { theme: webLightTheme }, element))
}

function BrokenComponent(): React.ReactElement {
  throw new Error('描画に失敗しました')
}

describe('RendererErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('描画エラー時にフォールバックを表示する', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProvider(
      React.createElement(RendererErrorBoundary, null, React.createElement(BrokenComponent))
    )

    expect(screen.getByTestId('renderer-error-fallback')).toBeTruthy()
    expect(screen.getByText('画面の表示中にエラーが発生しました。')).toBeTruthy()
    expect(screen.getByText('描画に失敗しました')).toBeTruthy()
  })

  it('unhandledrejection 発生時にエラー内容を表示し、再読み込み導線を出す', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProvider(
      React.createElement(RendererErrorBoundary, null, React.createElement('div', null, '正常表示'))
    )

    const event = new Event('unhandledrejection')
    Object.defineProperty(event, 'reason', {
      value: '非同期エラー'
    })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(screen.getByText('非同期エラー')).toBeTruthy()
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeTruthy()
  })

  it('unknown な rejection reason では汎用メッセージを表示する', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProvider(
      React.createElement(RendererErrorBoundary, null, React.createElement('div', null, '正常表示'))
    )

    const event = new Event('unhandledrejection')
    Object.defineProperty(event, 'reason', {
      value: { code: 'E_UNKNOWN' }
    })

    act(() => {
      window.dispatchEvent(event)
    })

    expect(screen.getByText('予期しないエラーが発生しました。')).toBeTruthy()
  })
})
