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
      <div className="studio-loading-shell">
        <div className="studio-panel px-8 py-6 text-center">
          <p className="studio-text-secondary text-sm font-medium">FP Studio</p>
          <p className="studio-text-primary mt-2 text-base">ローカルデータを読み込んでいます…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="studio-app-shell" data-testid="fp-studio-app">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col gap-4 overflow-hidden px-5 py-5 xl:grid xl:grid-cols-[340px_minmax(0,1fr)]">
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

        <main className="flex min-h-0 flex-col gap-4 overflow-hidden">
          {errorMessage ? (
            <div className="studio-error-banner" data-testid="app-error-message">
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
            <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
              <ProjectSummaryCards project={selectedProject} />
              <FunctionEntryForm
                canSubmit={entryForm.canSubmit}
                isBusy={isBusy}
                isEditing={entryForm.isEditing}
                onCancel={actions.cancelEditingFunctionEntry}
                preview={entryForm.preview}
                projectName={selectedProject.name}
                referenceLabel={entryForm.referenceLabel}
                values={entryForm.values}
                onFieldChange={entryForm.updateField}
                onSubmit={actions.submitFunctionEntry}
              />
              <FunctionEntryTable
                entries={selectedProject.entries}
                isBusy={isBusy}
                onEditEntry={actions.startEditingFunctionEntry}
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
