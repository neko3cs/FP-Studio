import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { render, screen } from '@testing-library/react'
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
})
