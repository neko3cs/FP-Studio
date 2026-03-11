import { Body1Strong, Caption1, Card, makeStyles, tokens } from '@fluentui/react-components'

import type { ProjectDetail } from '@shared/fp'

interface ProjectSummaryCardsProps {
  project: ProjectDetail
}

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
    }
  },
  card: {
    paddingTop: tokens.spacingVerticalM,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL,
    gap: tokens.spacingVerticalXS
  },
  value: {
    fontSize: '1.5rem',
    lineHeight: 1.1
  }
})

export function ProjectSummaryCards({ project }: ProjectSummaryCardsProps): React.JSX.Element {
  const styles = useStyles()
  const cards = [
    {
      id: 'total-ufp',
      label: '合計 UFP',
      value: `${project.totalFunctionPoints}`
    },
    {
      id: 'estimated-effort',
      label: '概算工数',
      value: `${project.estimatedEffortDays} 人日`
    },
    {
      id: 'function-count',
      label: '機能数',
      value: `${project.functionCount}`
    }
  ]

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <Card key={card.label} appearance="filled-alternative" className={styles.card}>
          <Caption1>{card.label}</Caption1>
          <Body1Strong className={styles.value} data-testid={`summary-${card.id}`}>
            {card.value}
          </Body1Strong>
        </Card>
      ))}
    </div>
  )
}
