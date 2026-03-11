import type { ProjectDetail } from '@shared/fp'

interface ProjectSummaryCardsProps {
  project: ProjectDetail
}

export function ProjectSummaryCards({ project }: ProjectSummaryCardsProps): React.JSX.Element {
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
    <div className="grid gap-3 md:grid-cols-3">
      {cards.map((card) => (
        <section key={card.label} className="studio-panel px-4 py-3">
          <p className="studio-text-tertiary text-xs font-medium">{card.label}</p>
          <p
            className="studio-text-primary mt-1 text-2xl font-semibold leading-none tracking-tight"
            data-testid={`summary-${card.id}`}
          >
            {card.value}
          </p>
        </section>
      ))}
    </div>
  )
}
