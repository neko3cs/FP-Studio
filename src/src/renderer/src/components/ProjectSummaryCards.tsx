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
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <section key={card.label} className="studio-panel px-5 py-4">
          <p className="studio-text-tertiary text-sm font-medium">{card.label}</p>
          <p
            className="studio-text-primary mt-2 text-[30px] font-semibold tracking-tight"
            data-testid={`summary-${card.id}`}
          >
            {card.value}
          </p>
        </section>
      ))}
    </div>
  )
}
