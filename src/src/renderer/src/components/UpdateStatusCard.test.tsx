import '../../../test/setup'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { UpdateState } from '@shared/ipc'

import UpdateStatusCard from './UpdateStatusCard'

function renderCard(
  status: UpdateState['status'],
  handlers: { onCheckForUpdates?: () => void; onInstallUpdate?: () => void } = {}
): void {
  render(
    <FluentProvider theme={webLightTheme}>
      <UpdateStatusCard
        state={{ status, message: '状態' }}
        onCheckForUpdates={handlers.onCheckForUpdates ?? (() => undefined)}
        onInstallUpdate={handlers.onInstallUpdate ?? (() => undefined)}
      />
    </FluentProvider>
  )
}

function getButton(name: string): HTMLButtonElement {
  return screen.getByRole('button', { name }) as HTMLButtonElement
}

// specification.md「アップデート状態」の表（通知カードを表示する状態の行）
describe('UpdateStatusCard', () => {
  it.each([
    ['checking', false, false],
    ['available', false, false],
    ['downloading', false, false],
    ['ready', false, true],
    ['error', true, false]
  ] as const)(
    '状態が %s のとき「更新を確認」を押せる=%s、「今すぐインストール」を押せる=%s',
    (status, canCheck, canInstall) => {
      renderCard(status)

      expect(getButton('更新を確認').disabled).toBe(!canCheck)
      expect(getButton('今すぐインストール').disabled).toBe(!canInstall)
    }
  )

  it('error のとき「更新を確認」を押すと再確認を要求する', () => {
    const onCheckForUpdates = vi.fn()
    renderCard('error', { onCheckForUpdates })

    fireEvent.click(getButton('更新を確認'))

    expect(onCheckForUpdates).toHaveBeenCalledTimes(1)
  })

  it('ready のとき「今すぐインストール」を押すとインストールを要求する', () => {
    const onInstallUpdate = vi.fn()
    renderCard('ready', { onInstallUpdate })

    fireEvent.click(getButton('今すぐインストール'))

    expect(onInstallUpdate).toHaveBeenCalledTimes(1)
  })
})
