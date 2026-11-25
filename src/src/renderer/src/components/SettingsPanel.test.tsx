import '../../../test/setup'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { DEFAULT_STUDIO_SETTINGS } from '@shared/fp'

import { SettingsPanel } from './SettingsPanel'

type PanelProps = React.ComponentProps<typeof SettingsPanel>

function renderPanel(overrides: Partial<PanelProps> = {}): void {
  const props: PanelProps = {
    settings: DEFAULT_STUDIO_SETTINGS,
    defaultProductivity: '1.00',
    canSubmitDefaultProductivity: false,
    isBusy: false,
    onDefaultProductivityChange: () => undefined,
    onSubmitDefaultProductivity: () => undefined,
    ...overrides
  }

  render(
    <FluentProvider theme={webLightTheme}>
      <SettingsPanel {...props} />
    </FluentProvider>
  )
}

function getInput(): HTMLInputElement {
  return screen.getByTestId('default-productivity-input') as HTMLInputElement
}

function getSaveButton(): HTMLButtonElement {
  return screen.getByTestId('default-productivity-save-button') as HTMLButtonElement
}

// specification.md「設定ビュー」
describe('SettingsPanel', () => {
  describe('デフォルト生産性', () => {
    it('現在のデフォルト生産性を入力欄に表示する', () => {
      renderPanel({ defaultProductivity: '1.25' })

      expect(getInput().value).toBe('1.25')
    })

    it('入力するとその値を通知する', () => {
      const onDefaultProductivityChange = vi.fn()
      renderPanel({ onDefaultProductivityChange })

      fireEvent.change(getInput(), { target: { value: '2.5' } })

      expect(onDefaultProductivityChange).toHaveBeenCalledWith('2.5')
    })

    it('保存できない値のときは保存ボタンを押せない', () => {
      renderPanel({ canSubmitDefaultProductivity: false })

      expect(getSaveButton().disabled).toBe(true)
    })

    it('保存できる値のときは保存ボタンを押すと保存を要求する', () => {
      const onSubmitDefaultProductivity = vi.fn()
      renderPanel({ canSubmitDefaultProductivity: true, onSubmitDefaultProductivity })

      fireEvent.click(getSaveButton())

      expect(onSubmitDefaultProductivity).toHaveBeenCalledTimes(1)
    })

    it('処理中は入力欄と保存ボタンを無効にする', () => {
      renderPanel({ canSubmitDefaultProductivity: true, isBusy: true })

      expect(getInput().disabled).toBe(true)
      expect(getSaveButton().disabled).toBe(true)
    })
  })

  describe('IFPUG 参照値', () => {
    it('難易度ルールと重みを編集する入力欄を持たない', () => {
      renderPanel()

      expect(screen.getAllByRole('textbox')).toHaveLength(1)
    })
  })
})
