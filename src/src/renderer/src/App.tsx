import {
  Body1,
  Card,
  makeStyles,
  MessageBar,
  MessageBarBody,
  Spinner,
  Title2,
  tokens
} from '@fluentui/react-components'
import { useEffect, useState } from 'react'

import { EmptyProjectState } from './components/EmptyProjectState'
import { FunctionEntryForm } from './components/FunctionEntryForm'
import { FunctionEntryTable } from './components/FunctionEntryTable'
import { ProjectSidebar } from './components/ProjectSidebar'
import { ProjectSummaryCards } from './components/ProjectSummaryCards'
import { ProjectProductivityPanel } from './components/ProjectProductivityPanel'
import UpdateStatusCard from './components/UpdateStatusCard'
import {
  AppNavigation,
  NAV_PANEL_COLLAPSED_WIDTH,
  NAV_PANEL_OPEN_WIDTH
} from './components/AppNavigation'
import { SettingsPanel } from './components/SettingsPanel'
import { useFpStudioApp } from './hooks/useFpStudioApp'

const useStyles = makeStyles({
  shell: {
    position: 'relative',
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1
  },
  layout: {
    minHeight: 0,
    height: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: tokens.spacingHorizontalL,
    padding: '20px',
    overflow: 'hidden'
  },
  workspace: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    overflow: 'hidden'
  },
  projectGrid: {
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)',
    gap: tokens.spacingHorizontalL,
    overflow: 'hidden'
  },
  settingsContainer: {
    minHeight: 0,
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  main: {
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    overflow: 'hidden'
  },
  content: {
    minHeight: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    overflow: 'hidden'
  },
  loadingShell: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalXXL
  },
  loadingCard: {
    minWidth: '320px',
    maxWidth: '420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalXXL
  },
  toastContainer: {
    position: 'fixed',
    bottom: tokens.spacingVerticalXXL,
    left: tokens.spacingHorizontalXXL,
    zIndex: 2
  },
  toastWrapper: {
    maxWidth: '320px'
  }
})

const BASE_LAYOUT_PADDING_LEFT = 20

function App(): React.JSX.Element {
  const styles = useStyles()
  const [activeView, setActiveView] = useState<'projects' | 'settings'>('projects')
  const [isNavOpen, setIsNavOpen] = useState(false)
  const {
    projects,
    selectedProject,
    selectedProjectId,
    projectForm,
    entryForm,
    projectProductivityForm,
    studioSettings,
    isLoading,
    isBusy,
    errorMessage,
    updateState,
    updateActions,
    actions
  } = useFpStudioApp()

  useEffect(() => {
    document.getElementById('startup-fallback')?.remove()
  }, [])

  if (isLoading) {
    return (
      <div className={styles.loadingShell}>
        <Card appearance="filled-alternative" className={styles.loadingCard}>
          <Title2 as="h1">FP Studio</Title2>
          <Spinner size="medium" />
          <Body1>ローカルデータを読み込んでいます…</Body1>
        </Card>
      </div>
    )
  }

  const layoutPaddingLeft = `${BASE_LAYOUT_PADDING_LEFT + (isNavOpen ? NAV_PANEL_OPEN_WIDTH : NAV_PANEL_COLLAPSED_WIDTH)}px`

  return (
    <div className={styles.shell} data-testid="fp-studio-app">
      <AppNavigation
        selectedView={activeView}
        onChange={setActiveView}
        isOpen={isNavOpen}
        onToggle={() => setIsNavOpen((prev) => !prev)}
      />
      <div className={styles.layout} style={{ paddingLeft: layoutPaddingLeft }}>
        <div className={styles.workspace}>
          {errorMessage ? (
            <MessageBar data-testid="app-error-message" intent="error">
              <MessageBarBody>{errorMessage}</MessageBarBody>
            </MessageBar>
          ) : null}

          {activeView === 'projects' ? (
            <div className={styles.projectGrid}>
              <ProjectSidebar
                isBusy={isBusy}
                projectDescription={projectForm.values.description}
                projectName={projectForm.values.name}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onCreateProject={actions.createProject}
                onDeleteProject={actions.deleteProject}
                onExportProjectToExcel={actions.exportProjectToExcel}
                onProjectFieldChange={projectForm.updateField}
                onSelectProject={actions.selectProject}
              />
              <main className={styles.main}>
                {selectedProject ? (
                  <div className={styles.content}>
                    <ProjectSummaryCards project={selectedProject} />
                    <ProjectProductivityPanel
                      project={selectedProject}
                      productivity={projectProductivityForm.productivity}
                      canSubmit={projectProductivityForm.canSubmit}
                      isBusy={isBusy}
                      onChange={projectProductivityForm.updateValue}
                      onSubmit={actions.updateProjectProductivity}
                    />
                    <FunctionEntryForm
                      canSubmit={entryForm.canSubmit}
                      isBusy={isBusy}
                      isEditing={entryForm.isEditing}
                      onCancel={actions.cancelEditingFunctionEntry}
                      preview={entryForm.preview}
                      projectName={selectedProject.name}
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
          ) : (
            <div className={styles.settingsContainer}>
              <SettingsPanel
                settings={studioSettings}
                isBusy={isBusy}
                onSave={actions.updateSettings}
              />
            </div>
          )}
        </div>
      </div>
      {updateState.status !== 'idle' && (
        <div className={styles.toastContainer}>
          <div className={styles.toastWrapper}>
            <UpdateStatusCard
              state={updateState}
              onCheckForUpdates={updateActions.checkForUpdates}
              onInstallUpdate={updateActions.installUpdate}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
