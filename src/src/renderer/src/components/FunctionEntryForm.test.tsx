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
  it('shows a shorter heading while creating a function entry', () => {
    renderForm()

    const heading = screen.getByRole('heading', {
      name: /機能を追加$/
    })
    expect(heading.textContent).toBe('機能を追加')
  })

  it('shows an edit heading when editing a function entry', () => {
    renderForm({ isEditing: true })

    const heading = screen.getByRole('heading', {
      name: /機能を編集$/
    })
    expect(heading.textContent).toBe('機能を編集')
  })

  it('opens and closes the help dialog when a question button is clicked', () => {
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

  it('shows FTR/RET help information', () => {
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
})
