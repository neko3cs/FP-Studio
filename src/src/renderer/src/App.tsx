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
import { useEffect } from 'react'

import { EmptyProjectState } from './components/EmptyProjectState'
import { FunctionEntryForm } from './components/FunctionEntryForm'
import { FunctionEntryTable } from './components/FunctionEntryTable'
import { ProjectSidebar } from './components/ProjectSidebar'
import { ProjectSummaryCards } from './components/ProjectSummaryCards'
import { SettingsPanel } from './components/SettingsPanel'
import { useFpStudioApp } from './hooks/useFpStudioApp'

const useStyles = makeStyles({
  shell: {
    height: '100%',
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1
  },
  layout: {
    height: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: '20px',
    overflow: 'hidden',
    '@media (min-width: 1280px)': {
      display: 'grid',
      gridTemplateColumns: '340px minmax(0, 1fr)'
    }
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
  }
})

function App(): React.JSX.Element {
  const styles = useStyles()
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

  return (
    <div className={styles.shell} data-testid="fp-studio-app">
      <div className={styles.layout}>
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

        <main className={styles.main}>
          {errorMessage ? (
            <MessageBar data-testid="app-error-message" intent="error">
              <MessageBarBody>{errorMessage}</MessageBarBody>
            </MessageBar>
          ) : null}

          <SettingsPanel
            canSubmit={settingsForm.canSubmit}
            defaultProductivity={settingsForm.defaultProductivity}
            isBusy={isBusy}
            onChange={settingsForm.updateValue}
            onSubmit={actions.updateSettings}
          />

          {selectedProject ? (
            <div className={styles.content}>
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
