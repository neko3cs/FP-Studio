import type { ProjectSummary } from '@shared/fp'

interface ProjectSidebarProps {
  projects: ProjectSummary[]
  selectedProjectId: string | null
  projectName: string
  projectDescription: string
  isBusy: boolean
  onProjectFieldChange: (field: 'name' | 'description', value: string) => void
  onCreateProject: () => void
  onSelectProject: (projectId: string) => void
  onDeleteProject: (projectId: string) => void
}

export function ProjectSidebar({
  projects,
  selectedProjectId,
  projectName,
  projectDescription,
  isBusy,
  onProjectFieldChange,
  onCreateProject,
  onSelectProject,
  onDeleteProject
}: ProjectSidebarProps): React.JSX.Element {
  return (
    <aside className="flex h-full flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-panel backdrop-blur">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">Projects</p>
        <h2 className="text-2xl font-semibold text-white">案件を管理</h2>
        <p className="text-sm text-slate-400">
          新規案件を作成し、保存済みの見積をすぐに呼び出せます。
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">プロジェクト名</span>
          <input
            className="studio-input"
            disabled={isBusy}
            value={projectName}
            onChange={(event) => onProjectFieldChange('name', event.target.value)}
            placeholder="例: 販売管理システム刷新"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-200">説明</span>
          <textarea
            className="studio-textarea"
            disabled={isBusy}
            rows={3}
            value={projectDescription}
            onChange={(event) => onProjectFieldChange('description', event.target.value)}
            placeholder="対象業務や前提条件をひとことメモ"
          />
        </label>

        <button
          className="studio-primary-button w-full"
          disabled={isBusy || !projectName.trim()}
          onClick={onCreateProject}
        >
          プロジェクトを作成
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
            まだプロジェクトがありません。まずは左上から1件作成してください。
          </div>
        ) : (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId

            return (
              <div
                key={project.id}
                className={`rounded-2xl border p-4 transition ${
                  isSelected
                    ? 'border-brand-400 bg-brand-500/10 shadow-[0_0_0_1px_rgba(56,189,248,0.4)]'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <button className="w-full text-left" onClick={() => onSelectProject(project.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {project.description || '説明なし'}
                      </p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-brand-300">
                      {project.totalFunctionPoints} UFP
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span>{project.functionCount} 機能</span>
                    <span>{project.estimatedEffortDays} 人日</span>
                  </div>
                </button>

                <button
                  className="mt-3 text-xs font-medium text-rose-300 transition hover:text-rose-200"
                  disabled={isBusy}
                  onClick={() => onDeleteProject(project.id)}
                >
                  このプロジェクトを削除
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
