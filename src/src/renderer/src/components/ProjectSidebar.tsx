import {
  Badge,
  Body1Strong,
  Body2,
  Button,
  Caption1,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  mergeClasses,
  Textarea,
  tokens
} from '@fluentui/react-components'
import { useState } from 'react'

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

const useStyles = makeStyles({
  root: {
    height: '100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL
  },
  formCard: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  listSection: {
    minHeight: 0,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    overflow: 'hidden'
  },
  list: {
    minHeight: 0,
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    paddingRight: tokens.spacingHorizontalXS
  },
  emptyCard: {
    padding: tokens.spacingHorizontalL,
    textAlign: 'left'
  },
  projectCard: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'default'
  },
  projectCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke2}`
  },
  selectButton: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: '0',
    paddingRight: '0',
    paddingBottom: '0',
    paddingLeft: '0',
    backgroundColor: 'transparent'
  },
  projectHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    textAlign: 'left'
  },
  projectInfo: {
    minWidth: 0,
    flex: 1
  },
  projectDescription: {
    marginTop: tokens.spacingVerticalXS,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: '2',
    overflow: 'hidden'
  },
  projectMeta: {
    marginTop: tokens.spacingVerticalS,
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  totalBadge: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    alignSelf: 'flex-start'
  },
  deleteButton: {
    justifyContent: 'flex-start',
    paddingLeft: '0',
    color: tokens.colorPaletteRedForeground2
  },
  dialogContent: {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere'
  }
})

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
  const styles = useStyles()
  const [projectPendingDeletion, setProjectPendingDeletion] = useState<ProjectSummary | null>(null)

  const closeDeleteDialog = (): void => {
    setProjectPendingDeletion(null)
  }

  const confirmDeleteProject = (): void => {
    if (!projectPendingDeletion) {
      return
    }

    onDeleteProject(projectPendingDeletion.id)
    closeDeleteDialog()
  }

  return (
    <Card appearance="filled-alternative" className={styles.root}>
      <Card appearance="outline" className={styles.formCard}>
        <Field label="プロジェクト名">
          <Input
            data-testid="project-name-input"
            disabled={isBusy}
            placeholder="例: 販売管理システム刷新"
            value={projectName}
            onChange={(_, data) => onProjectFieldChange('name', data.value)}
          />
        </Field>

        <Field label="説明">
          <Textarea
            data-testid="project-description-input"
            disabled={isBusy}
            placeholder="対象業務や前提条件をひとことメモ"
            resize="vertical"
            rows={2}
            value={projectDescription}
            onChange={(_, data) => onProjectFieldChange('description', data.value)}
          />
        </Field>

        <Button
          appearance="primary"
          data-testid="create-project-button"
          disabled={isBusy || !projectName.trim()}
          onClick={onCreateProject}
        >
          プロジェクトを作成
        </Button>
      </Card>

      <div className={styles.listSection}>
        <div className={styles.listHeader}>
          <Body2>プロジェクト</Body2>
          <Caption1>{projects.length}件</Caption1>
        </div>

        <div className={styles.list} data-testid="project-list">
          {projects.length === 0 ? (
            <Card appearance="subtle" className={styles.emptyCard}>
              <Body2>まだプロジェクトがありません。まずは左上から1件作成してください。</Body2>
            </Card>
          ) : (
            projects.map((project) => {
              const isSelected = project.id === selectedProjectId

              return (
                <Card
                  key={project.id}
                  appearance={isSelected ? 'filled' : 'outline'}
                  className={mergeClasses(
                    styles.projectCard,
                    isSelected && styles.projectCardSelected
                  )}
                  data-testid={`project-card-${project.id}`}
                >
                  <Button
                    appearance="subtle"
                    className={styles.selectButton}
                    onClick={() => onSelectProject(project.id)}
                  >
                    <div className={styles.projectHeader}>
                      <div className={styles.projectInfo}>
                        <Body1Strong>{project.name}</Body1Strong>
                        <Body2 className={styles.projectDescription}>
                          {project.description || '説明なし'}
                        </Body2>
                      </div>
                      <Badge
                        appearance="tint"
                        className={styles.totalBadge}
                        color="informative"
                        shape="rounded"
                      >
                        {project.totalFunctionPoints} UFP
                      </Badge>
                    </div>
                  </Button>

                  <div className={styles.projectMeta}>
                    <Caption1>{project.functionCount} 機能</Caption1>
                    <Caption1>{project.estimatedEffortDays} 人日</Caption1>
                  </div>

                  <Button
                    aria-label={`${project.name} プロジェクトを削除`}
                    appearance="subtle"
                    className={styles.deleteButton}
                    disabled={isBusy}
                    onClick={() => setProjectPendingDeletion(project)}
                  >
                    このプロジェクトを削除
                  </Button>
                </Card>
              )
            })
          )}
        </div>
      </div>

      <Dialog
        open={projectPendingDeletion !== null}
        onOpenChange={(_event, data) => {
          if (!data.open) {
            closeDeleteDialog()
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>プロジェクトを削除しますか？</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              {projectPendingDeletion
                ? `「${projectPendingDeletion.name}」を削除します。この操作は元に戻せません。`
                : ''}
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={closeDeleteDialog}>
                キャンセル
              </Button>
              <Button appearance="primary" disabled={isBusy} onClick={confirmDeleteProject}>
                削除する
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Card>
  )
}
