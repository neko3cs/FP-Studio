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
  Object.defineProperty(event, 'reason', { value: reason })
  act(() => {
    window.dispatchEvent(event)
  })
}

describe('RendererErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  describe('通常表示', () => {
    it('エラーがないときは子要素を表示する', () => {
      renderWithProvider(
        React.createElement(
          RendererErrorBoundary,
          null,
          React.createElement('div', null, '正常表示')
        )
      )

      expect(screen.queryByTestId('renderer-error-fallback')).toBeNull()
    })

    it('unhandledrejection イベントリスナーを登録し、アンマウント時に解除する', () => {
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
      const updatedUnhandledRejectionCalls = addEventListenerSpy.mock.calls.filter(
        ([eventName]) => eventName === 'unhandledrejection'
      )

      expect(updatedUnhandledRejectionCalls).toHaveLength(2)
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        addUnhandledRejectionCalls[0]?.[1]
      )

      const registeredHandler = updatedUnhandledRejectionCalls[1]?.[1]
      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', registeredHandler)
    })
  })

  describe('描画エラー（ErrorBoundary）', () => {
    it('フォールバック画面を表示し、エラーをコンソールに出力する', () => {
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
      expect(card?.style.width).toBe('100%')
      expect(card?.style.maxWidth).toBe('560px')
      expect(card?.style.display).toBe('flex')
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
      expect(message.style.padding).toBe('12px 14px')
      expect(message.style.borderRadius).toBe('8px')
      expect(message.style.backgroundColor).toBe('rgb(253, 231, 233)')
      expect(message.style.color).toBe('rgb(164, 38, 44)')
      expect(button.parentElement?.style.display).toBe('flex')
      expect(button.parentElement?.style.justifyContent).toBe('flex-end')
      expect(button.style.borderStyle).toBe('none')
      expect(button.style.borderRadius).toBe('6px')
      expect(button.style.padding).toBe('10px 16px')
      expect(button.style.backgroundColor).toBe('rgb(15, 108, 189)')
      expect(button.style.color).toBe('rgb(255, 255, 255)')
      expect(button.style.font).toBe('inherit')
      expect(button.style.cursor).toBe('pointer')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Renderer crashed while rendering the app.',
        expect.any(Error),
        expect.any(Object)
      )
    })
  })

  describe('非同期エラー（unhandledrejection）', () => {
    it('エラー内容を表示し、再読み込みボタンを押すと reload が実行される', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const reloadRendererSpy = vi
        .spyOn(rendererErrorUtils, 'reloadRenderer')
        .mockImplementation(() => {})

      renderWithProvider(
        React.createElement(
          RendererErrorBoundary,
          null,
          React.createElement('div', null, '正常表示')
        )
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
        React.createElement(
          RendererErrorBoundary,
          null,
          React.createElement('div', null, '正常表示')
        )
      )

      dispatchUnhandledRejection({ code: 'E_UNKNOWN' })

      expect(screen.getByText('予期しないエラーが発生しました。')).toBeTruthy()
    })
  })

  describe('ユーティリティ関数', () => {
    describe('normalizeError', () => {
      it('Error インスタンスをそのまま返す', () => {
        const error = new Error('boom')

        expect(rendererErrorUtils.normalizeError(error)).toBe(error)
      })

      it('空文字や null は汎用メッセージに変換する', () => {
        expect(rendererErrorUtils.normalizeError('')).toEqual(
          new Error('予期しないエラーが発生しました。')
        )
        expect(rendererErrorUtils.normalizeError(null)).toEqual(
          new Error('予期しないエラーが発生しました。')
        )
      })

      it('文字列メッセージを Error に変換する', () => {
        const normalized = rendererErrorUtils.normalizeError('ネットワークエラー')

        expect(normalized).toEqual(new Error('ネットワークエラー'))
      })
    })

    describe('reloadRenderer', () => {
      it('window.location.reload を実行する', () => {
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
  })
})
