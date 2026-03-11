import type { ProjectDetail, StudioSettings } from '@shared/fp'

interface ProjectSummaryCardsProps {
  project: ProjectDetail
  settings: StudioSettings
}

export function ProjectSummaryCards({
  project,
  settings
}: ProjectSummaryCardsProps): React.JSX.Element {
  const cards = [
    { label: '合計 UFP', value: `${project.totalFunctionPoints}`, hint: '標準重みで自動集計' },
    {
      label: '概算工数',
      value: `${project.estimatedEffortDays} 人日`,
      hint: `${settings.defaultProductivity} 人日 / FP`
    },
    { label: '機能数', value: `${project.functionCount}`, hint: '登録済みエントリ数' }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <section
          key={card.label}
          className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-panel"
        >
          <p className="text-sm font-medium text-slate-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.24em] text-brand-300">{card.hint}</p>
        </section>
      ))}
    </div>
  )
}
