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

import type { ProjectDetail } from '@shared/fp'

interface ProjectProductivityPanelProps {
  project: ProjectDetail | null
  productivity: string
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
    flexDirection: 'column',
    textAlign: 'left',
    gap: tokens.spacingVerticalXS
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

export function ProjectProductivityPanel({
  project,
  productivity,
  canSubmit,
  isBusy,
  onChange,
  onSubmit
}: ProjectProductivityPanelProps): React.JSX.Element {
  const styles = useStyles()
  const [isOpen, setIsOpen] = useState(false)
  const projectName = project?.name ?? 'プロジェクト未選択'

  return (
    <Card
      appearance="filled-alternative"
      className={`${styles.card} ${isOpen ? styles.cardOpen : styles.cardCollapsed}`}
    >
      <Button
        aria-controls="project-productivity-panel-content"
        aria-expanded={isOpen}
        appearance="subtle"
        className={styles.headerButton}
        data-testid="project-productivity-accordion-button"
        onClick={() => setIsOpen((current) => !current)}
      >
        <div className={styles.headerContent}>
          <Body2>プロジェクト生産性</Body2>
          <div>
            <Text className={styles.currentValueLabel}>
              {projectName} / {productivity} 人日 / FP
            </Text>
          </div>
        </div>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
      </Button>

      {isOpen ? (
        <div className={styles.panel} id="project-productivity-panel-content">
          <Field className={styles.field} label="このプロジェクトの生産性 (人日 / FP)">
            <Input
              data-testid="project-productivity-input"
              disabled={isBusy || !project}
              inputMode="decimal"
              value={productivity}
              onChange={(_, data) => onChange(data.value)}
            />
          </Field>

          <Button
            appearance="secondary"
            data-testid="project-productivity-save-button"
            disabled={isBusy || !project || !canSubmit}
            onClick={onSubmit}
          >
            値を更新
          </Button>
        </div>
      ) : null}
    </Card>
  )
}
