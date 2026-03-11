import { useState } from 'react'

import {
  Body2,
  Button,
  Card,
  Field,
  Input,
  makeStyles,
  Text,
  tokens
} from '@fluentui/react-components'

interface SettingsPanelProps {
  defaultProductivity: string
  canSubmit: boolean
  isBusy: boolean
  onChange: (value: string) => void
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
    height: '168px'
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
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  currentValueLabel: {
    color: tokens.colorNeutralForeground3
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
    overflow: 'auto',
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    '@media (min-width: 1024px)': {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between'
    }
  },
  field: {
    flex: 1
  }
})

export function SettingsPanel({
  defaultProductivity,
  canSubmit,
  isBusy,
  onChange,
  onSubmit
}: SettingsPanelProps): React.JSX.Element {
  const styles = useStyles()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card
      appearance="filled-alternative"
      className={`${styles.card} ${isOpen ? styles.cardOpen : styles.cardCollapsed}`}
    >
      <Button
        aria-controls="settings-panel-content"
        aria-expanded={isOpen}
        appearance="subtle"
        className={styles.headerButton}
        data-testid="settings-accordion-button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className={styles.headerContent}>
          <Body2>生産性設定</Body2>
          <Text className={styles.currentValueLabel}>{defaultProductivity} 人日 / FP</Text>
        </div>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
      </Button>

      {isOpen ? (
        <div className={styles.panel} id="settings-panel-content">
          <Field className={styles.field} label="デフォルト生産性 (人日 / FP)">
            <Input
              data-testid="settings-productivity-input"
              disabled={isBusy}
              inputMode="decimal"
              value={defaultProductivity}
              onChange={(_, data) => onChange(data.value)}
            />
          </Field>

          <Button
            appearance="secondary"
            data-testid="settings-save-button"
            disabled={isBusy || !canSubmit}
            onClick={onSubmit}
          >
            設定を保存
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
