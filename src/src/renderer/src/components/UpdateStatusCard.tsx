import { Body2, Button, Card, makeStyles, Text, tokens } from '@fluentui/react-components'

import type { UpdateState } from '@shared/ipc'

interface UpdateStatusCardProps {
  state: UpdateState
  onCheckForUpdates: () => void
  onInstallUpdate: () => void
}

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  progressTrack: {
    height: '6px',
    borderRadius: '999px',
    backgroundColor: tokens.colorNeutralStrokeDisabled,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: '999px',
    backgroundColor: tokens.colorCompoundBrandForeground1
  },
  releaseNotes: {
    whiteSpace: 'pre-wrap',
    color: tokens.colorNeutralForeground3
  },
  controls: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  }
})

function UpdateStatusCard({
  state,
  onCheckForUpdates,
  onInstallUpdate
}: UpdateStatusCardProps): React.JSX.Element {
  const styles = useStyles()
  const progressPercent = state.progress?.percent ?? 0
  const canCheck = state.status !== 'checking' && state.status !== 'downloading'
  const canInstall = state.status === 'ready'

  return (
    <Card appearance="filled-alternative" className={styles.card}>
      <div className={styles.header}>
        <Body2>アプリの更新</Body2>
        {state.version ? (
          <Text size={200} weight="semibold">
            {state.version}
          </Text>
        ) : null}
      </div>

      <Body2>{state.message ?? '状態を読み込んでいます…'}</Body2>

      {state.progress ? (
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
        </div>
      ) : null}

      {state.releaseNotes ? (
        <Text className={styles.releaseNotes} size={200}>
          {state.releaseNotes}
        </Text>
      ) : null}

      <div className={styles.controls}>
        <Button appearance="secondary" disabled={!canCheck} onClick={onCheckForUpdates}>
          更新を確認
        </Button>
        <Button appearance="primary" disabled={!canInstall} onClick={onInstallUpdate}>
          今すぐインストール
        </Button>
      </div>
    </Card>
  )
}

export default UpdateStatusCard
