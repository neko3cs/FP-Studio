import { EmptyProjectState } from './components/EmptyProjectState'
import { FunctionEntryForm } from './components/FunctionEntryForm'
import { FunctionEntryTable } from './components/FunctionEntryTable'
import { ProjectSidebar } from './components/ProjectSidebar'
import { ProjectSummaryCards } from './components/ProjectSummaryCards'
import { SettingsPanel } from './components/SettingsPanel'
import { useFpStudioApp } from './hooks/useFpStudioApp'

function App(): React.JSX.Element {
  const {
    projects,
    selectedProject,
    selectedProjectId,
    settings,
    projectForm,
    entryForm,
    settingsForm,
    isLoading,
    isBusy,
    errorMessage,
    actions
  } = useFpStudioApp()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-8 py-6 text-center shadow-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">
            FP Studio
          </p>
          <p className="mt-3 text-lg font-medium text-white">ローカルデータを読み込んでいます…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" data-testid="fp-studio-app">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col gap-6 px-6 py-6 xl:grid xl:grid-cols-[360px_minmax(0,1fr)]">
        <ProjectSidebar
          isBusy={isBusy}
          projectDescription={projectForm.values.description}
          projectName={projectForm.values.name}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onCreateProject={actions.createProject}
          onDeleteProject={actions.deleteProject}
          onProjectFieldChange={projectForm.updateField}
          onSelectProject={actions.selectProject}
        />

        <main className="flex min-h-0 flex-col gap-6">
          <header className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">
              Estimate, purely.
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white">
              IPA/IFPUG 準拠の FP 見積をローカル完結で。
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              プロジェクト、機能、UFP、生産性を一画面で管理します。SQLite は OS
              ごとのアプリケーションデータ配下へ保存されます。
            </p>
          </header>

          {errorMessage ? (
            <div
              className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
              data-testid="app-error-message"
            >
              {errorMessage}
            </div>
          ) : null}

          <SettingsPanel
            canSubmit={settingsForm.canSubmit}
            defaultProductivity={settingsForm.defaultProductivity}
            isBusy={isBusy}
            onChange={settingsForm.updateValue}
            onSubmit={actions.updateSettings}
          />

          {selectedProject ? (
            <div className="space-y-6">
              <ProjectSummaryCards project={selectedProject} settings={settings} />
              <FunctionEntryForm
                isBusy={isBusy}
                preview={entryForm.preview}
                projectName={selectedProject.name}
                referenceLabel={entryForm.referenceLabel}
                values={entryForm.values}
                onFieldChange={entryForm.updateField}
                onSubmit={actions.createFunctionEntry}
              />
              <FunctionEntryTable
                entries={selectedProject.entries}
                isBusy={isBusy}
                onDeleteEntry={actions.deleteFunctionEntry}
              />
            </div>
          ) : (
            <EmptyProjectState />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
