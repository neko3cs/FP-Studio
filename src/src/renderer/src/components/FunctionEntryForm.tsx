import { useState } from 'react'

import {
  Badge,
  Body2,
  Button,
  Card,
  Field,
  Input,
  makeStyles,
  Select,
  Text,
  Textarea,
  Title3,
  tokens
} from '@fluentui/react-components'

import type { FunctionPointAnalysis, FunctionType } from '@shared/fp'
import { FUNCTION_TYPES } from '@shared/fp'

interface FunctionEntryFormProps {
  projectName: string
  values: {
    name: string
    functionType: FunctionType
    det: string
    referenceCount: string
    note: string
  }
  preview: FunctionPointAnalysis | null
  canSubmit: boolean
  isEditing: boolean
  referenceLabel: 'FTR' | 'RET'
  isBusy: boolean
  onFieldChange: (
    field: 'name' | 'functionType' | 'det' | 'referenceCount' | 'note',
    value: string
  ) => void
  onCancel: () => void
  onSubmit: () => void
}

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    overflow: 'hidden'
  },
  cardCollapsed: {
    height: '72px'
  },
  cardOpen: {
    height: '396px'
  },
  headerButton: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '40px',
    paddingTop: '0',
    paddingRight: '0',
    paddingBottom: '0',
    paddingLeft: '0',
    backgroundColor: 'transparent'
  },
  headerContent: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  previewBadge: {
    maxWidth: '100%'
  },
  chevron: {
    transitionDuration: '200ms',
    transitionProperty: 'transform'
  },
  chevronOpen: {
    transform: 'rotate(180deg)'
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  grid: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
    },
    '@media (min-width: 1280px)': {
      gridTemplateColumns: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))'
    }
  },
  noteField: {
    marginTop: tokens.spacingVerticalXS
  },
  noteInput: {
    minHeight: '72px'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  },
  saveButton: {
    '@media (min-width: 768px)': {
      marginLeft: 'auto'
    }
  }
})

export function FunctionEntryForm({
  projectName,
  values,
  preview,
  canSubmit,
  isEditing,
  referenceLabel,
  isBusy,
  onFieldChange,
  onCancel,
  onSubmit
}: FunctionEntryFormProps): React.JSX.Element {
  const styles = useStyles()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isOpen = isEditing || !isCollapsed

  return (
    <Card
      appearance="filled-alternative"
      className={`${styles.card} ${isOpen ? styles.cardOpen : styles.cardCollapsed}`}
    >
      <Button
        aria-controls="function-entry-form-content"
        aria-expanded={isOpen}
        appearance="subtle"
        className={styles.headerButton}
        data-testid="function-form-accordion-button"
        onClick={() => setIsCollapsed((current) => !current)}
      >
        <div className={styles.headerContent}>
          <Title3 as="h3">
            {isEditing ? `${projectName} の機能を編集` : `${projectName} に機能を追加`}
          </Title3>
          <Badge
            appearance="outline"
            className={styles.previewBadge}
            data-testid="function-preview"
            shape="rounded"
            size="large"
          >
            {preview ? `${preview.difficulty} / ${preview.functionPoints} FP` : '入力待ち'}
          </Badge>
        </div>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
      </Button>

      {isOpen ? (
        <div className={styles.panel} id="function-entry-form-content">
          <div className={styles.grid}>
            <Field label="機能名">
              <Input
                data-testid="function-name-input"
                disabled={isBusy}
                placeholder="例: 顧客登録、売上照会"
                value={values.name}
                onChange={(_, data) => onFieldChange('name', data.value)}
              />
            </Field>

            <Field label="Function Type">
              <Select
                data-testid="function-type-select"
                disabled={isBusy}
                value={values.functionType}
                onChange={(_, data) => onFieldChange('functionType', data.value)}
              >
                {FUNCTION_TYPES.map((functionType) => (
                  <option key={functionType} value={functionType}>
                    {functionType}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="DET">
              <Input
                data-testid="det-input"
                disabled={isBusy}
                inputMode="numeric"
                value={values.det}
                onChange={(_, data) => onFieldChange('det', data.value)}
              />
            </Field>

            <Field label={referenceLabel}>
              <Input
                data-testid="reference-count-input"
                disabled={isBusy}
                inputMode="numeric"
                value={values.referenceCount}
                onChange={(_, data) => onFieldChange('referenceCount', data.value)}
              />
            </Field>
          </div>

          <Field className={styles.noteField} label="備考">
            <Textarea
              className={styles.noteInput}
              data-testid="function-note-input"
              disabled={isBusy}
              placeholder="判断根拠や対象画面などをメモ"
              resize="none"
              rows={2}
              value={values.note}
              onChange={(_, data) => onFieldChange('note', data.value)}
            />
          </Field>

          <div className={styles.actions}>
            {isEditing ? (
              <Button
                appearance="secondary"
                data-testid="cancel-edit-button"
                disabled={isBusy}
                onClick={onCancel}
              >
                編集をキャンセル
              </Button>
            ) : (
              <Body2 />
            )}
            <Button
              appearance="primary"
              className={styles.saveButton}
              data-testid="add-function-button"
              disabled={isBusy || !canSubmit}
              onClick={onSubmit}
            >
              <Text>{isEditing ? '変更を保存' : '機能を追加'}</Text>
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}
