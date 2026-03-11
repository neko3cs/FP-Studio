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
    <aside className="studio-panel flex h-full min-h-0 flex-col gap-4 p-4">
      <div className="studio-panel-muted space-y-3 p-3.5">
        <label className="block space-y-2">
          <span className="studio-input-label">プロジェクト名</span>
          <input
            className="studio-input"
            data-testid="project-name-input"
            disabled={isBusy}
            value={projectName}
            onChange={(event) => onProjectFieldChange('name', event.target.value)}
            placeholder="例: 販売管理システム刷新"
          />
        </label>

        <label className="block space-y-2">
          <span className="studio-input-label">説明</span>
          <textarea
            className="studio-textarea"
            data-testid="project-description-input"
            disabled={isBusy}
            rows={2}
            value={projectDescription}
            onChange={(event) => onProjectFieldChange('description', event.target.value)}
            placeholder="対象業務や前提条件をひとことメモ"
          />
        </label>

        <button
          className="studio-primary-button w-full"
          data-testid="create-project-button"
          disabled={isBusy || !projectName.trim()}
          onClick={onCreateProject}
        >
          プロジェクトを作成
        </button>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="studio-text-secondary text-sm font-medium">プロジェクト</h2>
        <span className="studio-text-tertiary text-sm">{projects.length}件</span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" data-testid="project-list">
        {projects.length === 0 ? (
          <div className="studio-empty-state rounded-2xl p-4 text-left">
            まだプロジェクトがありません。まずは左上から1件作成してください。
          </div>
        ) : (
          projects.map((project) => {
            const isSelected = project.id === selectedProjectId

            return (
              <div
                key={project.id}
                className={`studio-card ${isSelected ? 'studio-card-selected' : ''}`}
                data-testid={`project-card-${project.id}`}
              >
                <button className="w-full text-left" onClick={() => onSelectProject(project.id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="studio-text-primary text-[15px] font-medium">{project.name}</p>
                      <p className="studio-text-secondary mt-1 text-sm">
                        {project.description || '説明なし'}
                      </p>
                    </div>
                    <span className="studio-chip">{project.totalFunctionPoints} UFP</span>
                  </div>
                  <div className="studio-text-tertiary mt-3 flex items-center gap-3 text-xs">
                    <span>{project.functionCount} 機能</span>
                    <span>{project.estimatedEffortDays} 人日</span>
                  </div>
                </button>

                <button
                  aria-label={`${project.name} プロジェクトを削除`}
                  className="studio-danger-button mt-3"
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
