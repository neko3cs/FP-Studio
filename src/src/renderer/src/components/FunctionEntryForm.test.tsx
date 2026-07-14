import '../../../test/setup'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'

import { FunctionEntryForm } from './FunctionEntryForm'

type FormProps = React.ComponentProps<typeof FunctionEntryForm>

const noopFieldChange: FormProps['onFieldChange'] = () => undefined
const noop = (): void => undefined

function renderForm(overrides: Partial<FormProps> = {}): void {
  const props: FormProps = {
    projectName: 'プロジェクト',
    values: {
      name: '',
      functionType: 'EI',
      det: '4',
      referenceCount: '1',
      note: ''
    },
    preview: null,
    canSubmit: false,
    isEditing: false,
    isBusy: false,
    onFieldChange: noopFieldChange,
    onCancel: noop,
    onSubmit: noop,
    ...overrides
  }

  render(
    <FluentProvider theme={webLightTheme}>
      <FunctionEntryForm {...props} />
    </FluentProvider>
  )
}

describe('FunctionEntryForm', () => {
  it('機能追加モードでは見出しに「機能を追加」と表示する', () => {
    renderForm()

    const heading = screen.getByRole('heading', {
      name: /機能を追加$/
    })
    expect(heading.textContent).toBe('機能を追加')
  })

  it('機能編集モードでは見出しに「機能を編集」と表示する', () => {
    renderForm({ isEditing: true })

    const heading = screen.getByRole('heading', {
      name: /機能を編集$/
    })
    expect(heading.textContent).toBe('機能を編集')
  })

  it('Function Type のヘルプボタンをクリックするとダイアログが開閉する', () => {
    renderForm()

    const [helpButton] = screen.getAllByTestId('function-help-button-functionType')
    expect(screen.queryByTestId('function-help-dialog-title')).toBeNull()

    fireEvent.click(helpButton)

    expect(screen.getByTestId('function-help-dialog-title').textContent).toBe(
      'Function Type とは？'
    )
    expect(screen.getByTestId('function-help-dialog-description').textContent).toContain(
      'EI（External Input）'
    )

    fireEvent.click(screen.getByTestId('function-help-dialog-close'))

    expect(screen.queryByTestId('function-help-dialog-title')).toBeNull()
  })

  it('FTR/RET のヘルプボタンをクリックするとダイアログが開閉する', () => {
    renderForm()

    const [referenceHelpButton] = screen.getAllByTestId('function-help-button-reference')
    fireEvent.click(referenceHelpButton)

    expect(screen.getByTestId('function-help-dialog-title').textContent).toBe('FTR/RET とは？')
    expect(screen.getByTestId('function-help-dialog-description').textContent).toContain(
      'FTR（File Type Referenced）'
    )

    fireEvent.click(screen.getByTestId('function-help-dialog-close'))

    expect(screen.queryByTestId('function-help-dialog-title')).toBeNull()
  })

  it('DET のヘルプボタンをクリックするとダイアログに DET の説明を表示する', () => {
    renderForm()

    const [detHelpButton] = screen.getAllByTestId('function-help-button-det')
    fireEvent.click(detHelpButton)

    expect(screen.getByTestId('function-help-dialog-title').textContent).toBe('DET とは？')
    expect(screen.getByTestId('function-help-dialog-description').textContent).toContain(
      'Data Element'
    )
  })

  it('プレビューがあるとき難易度とFPをバッジに表示し、無いとき「入力待ち」を表示する', () => {
    renderForm({ preview: { difficulty: 'Average', functionPoints: 4 } })
    expect(screen.getByTestId('function-preview').textContent).toBe('Average / 4 FP')
  })

  it('プレビューが無いときバッジに「入力待ち」を表示する', () => {
    renderForm({ preview: null })
    expect(screen.getByTestId('function-preview').textContent).toBe('入力待ち')
  })

  it('追加モードでアコーディオンを閉じると入力フォームを隠す', () => {
    renderForm()
    expect(screen.getByTestId('det-input')).toBeTruthy()

    fireEvent.click(screen.getByTestId('function-form-accordion-button'))

    expect(screen.queryByTestId('det-input')).toBeNull()
  })

  it('編集モードでは折りたたみ操作をしても入力フォームを表示し続ける', () => {
    renderForm({ isEditing: true })

    fireEvent.click(screen.getByTestId('function-form-accordion-button'))

    expect(screen.getByTestId('det-input')).toBeTruthy()
    expect(screen.getByTestId('cancel-edit-button')).toBeTruthy()
  })

  it('canSubmit が false または isBusy のとき追加ボタンを無効化する', () => {
    renderForm({ canSubmit: false })
    expect(screen.getByTestId('add-function-button')).toHaveProperty('disabled', true)
  })

  it('canSubmit が true かつ isBusy でないとき追加ボタンを有効化する', () => {
    renderForm({ canSubmit: true, isBusy: false })
    expect(screen.getByTestId('add-function-button')).toHaveProperty('disabled', false)
  })
})
