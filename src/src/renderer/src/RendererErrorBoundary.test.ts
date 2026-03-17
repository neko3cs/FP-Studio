import '../../test/setup'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RendererErrorBoundary } from './RendererErrorBoundary'
import * as rendererErrorUtils from './rendererErrorUtils'

function renderWithProvider(element: React.ReactElement): void {
  render(React.createElement(FluentProvider, { theme: webLightTheme }, element))
}

function BrokenComponent(): React.ReactElement {
  throw new Error('描画に失敗しました')
}

function dispatchUnhandledRejection(reason: unknown): void {
  const event = new Event('unhandledrejection')
  Object.defineProperty(event, 'reason', {
    value: reason
  })

  act(() => {
    window.dispatchEvent(event)
  })
}

describe('RendererErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('通常時は子要素を表示し、イベントリスナーを一度だけ登録して解除する', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const { rerender, unmount } = render(
      React.createElement(
        FluentProvider,
        { theme: webLightTheme },
        React.createElement(
          RendererErrorBoundary,
          null,
          React.createElement('div', null, '正常表示')
        )
      )
    )

    expect(screen.getByText('正常表示')).toBeTruthy()

    const addUnhandledRejectionCalls = addEventListenerSpy.mock.calls.filter(
      ([eventName]) => eventName === 'unhandledrejection'
    )

    expect(addUnhandledRejectionCalls).toHaveLength(1)
    expect(addUnhandledRejectionCalls[0]).toEqual(['unhandledrejection', expect.any(Function)])

    rerender(
      React.createElement(
        FluentProvider,
        { theme: webLightTheme },
        React.createElement(
          RendererErrorBoundary,
          null,
          React.createElement('div', null, '更新後表示')
        )
      )
    )

    expect(screen.getByText('更新後表示')).toBeTruthy()
    expect(
      addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'unhandledrejection')
    ).toHaveLength(1)

    const registeredHandler = addUnhandledRejectionCalls[0]?.[1]
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', registeredHandler)
  })

  it('描画エラー時にフォールバックの文言・スタイルを表示し、ログを出す', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProvider(
      React.createElement(RendererErrorBoundary, null, React.createElement(BrokenComponent))
    )

    const shell = screen.getByTestId('renderer-error-fallback')
    const heading = screen.getByText('画面の表示中にエラーが発生しました。')
    const description = screen.getByText(
      '再読み込みで復旧する場合があります。問題が続く場合は直前の操作を確認してください。'
    )
    const message = screen.getByText('描画に失敗しました')
    const button = screen.getByRole('button', { name: '再読み込み' })
    const card = heading.parentElement?.parentElement

    expect(shell).toBeTruthy()
    expect(card).toBeTruthy()
    expect(shell.style.height).toBe('100%')
    expect(shell.style.display).toBe('flex')
    expect(shell.style.alignItems).toBe('center')
    expect(shell.style.justifyContent).toBe('center')
    expect(shell.style.padding).toBe('32px')
    expect(shell.style.backgroundColor).toBe('rgb(245, 245, 245)')
    expect(shell.style.color).toBe('rgb(26, 26, 26)')
    expect(card?.style.flexDirection).toBe('column')
    expect(card?.style.gap).toBe('20px')
    expect(card?.style.padding).toBe('24px')
    expect(card?.style.borderRadius).toBe('12px')
    expect(card?.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(card?.style.boxShadow).toContain('rgba(0, 0, 0, 0.08)')
    expect(heading.style.margin).toBe('0px')
    expect(heading.style.fontSize).toBe('1.5rem')
    expect(description.style.marginBottom).toBe('0px')
    expect(message.style.whiteSpace).toBe('pre-wrap')
    expect(message.style.backgroundColor).toBe('rgb(253, 231, 233)')
    expect(message.style.color).toBe('rgb(164, 38, 44)')
    expect(button.style.borderStyle).toBe('none')
    expect(button.style.borderRadius).toBe('6px')
    expect(button.style.padding).toBe('10px 16px')
    expect(button.style.backgroundColor).toBe('rgb(15, 108, 189)')
    expect(button.style.color).toBe('rgb(255, 255, 255)')
    expect(button.style.cursor).toBe('pointer')
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Renderer crashed while rendering the app.',
      expect.any(Error),
      expect.any(Object)
    )
  })

  it('unhandledrejection 発生時にエラー内容を表示し、再読み込み導線を出す', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const reloadRendererSpy = vi
      .spyOn(rendererErrorUtils, 'reloadRenderer')
      .mockImplementation(() => {})

    renderWithProvider(
      React.createElement(RendererErrorBoundary, null, React.createElement('div', null, '正常表示'))
    )

    dispatchUnhandledRejection('非同期エラー')

    expect(screen.getByText('非同期エラー')).toBeTruthy()
    const button = screen.getByRole('button', { name: '再読み込み' })
    expect(button).toBeTruthy()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Renderer emitted an unhandled rejection.',
      new Error('非同期エラー')
    )

    fireEvent.click(button)

    expect(reloadRendererSpy).toHaveBeenCalledTimes(1)
  })

  it('unknown な rejection reason では汎用メッセージを表示する', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    renderWithProvider(
      React.createElement(RendererErrorBoundary, null, React.createElement('div', null, '正常表示'))
    )

    dispatchUnhandledRejection({ code: 'E_UNKNOWN' })

    expect(screen.getByText('予期しないエラーが発生しました。')).toBeTruthy()
  })

  it('normalizeError は Error インスタンスをそのまま返す', () => {
    const error = new Error('boom')

    expect(rendererErrorUtils.normalizeError(error)).toBe(error)
  })

  it('normalizeError は空文字や null を汎用メッセージにフォールバックする', () => {
    expect(rendererErrorUtils.normalizeError('')).toEqual(
      new Error('予期しないエラーが発生しました。')
    )
    expect(rendererErrorUtils.normalizeError(null)).toEqual(
      new Error('予期しないエラーが発生しました。')
    )
  })

  it('normalizeError は文字列メッセージを Error に変換する', () => {
    const normalized = rendererErrorUtils.normalizeError('ネットワークエラー')

    expect(normalized).toEqual(new Error('ネットワークエラー'))
  })

  it('reloadRenderer を呼ぶと window.location.reload が実行される', () => {
    const reloadSpy = vi.fn()
    const originalLocation = window.location

    vi.stubGlobal('location', {
      ...originalLocation,
      reload: reloadSpy
    })

    rendererErrorUtils.reloadRenderer()

    expect(reloadSpy).toHaveBeenCalled()

    vi.stubGlobal('location', originalLocation)
  })
})
