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
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  tokens
} from '@fluentui/react-components'
import { useState } from 'react'

import type { FunctionEntry } from '@shared/fp'

interface FunctionEntryTableProps {
  entries: FunctionEntry[]
  isBusy: boolean
  onEditEntry: (entry: FunctionEntry) => void
  onDeleteEntry: (entryId: string) => void
}

const difficultyColorMap: Record<FunctionEntry['difficulty'], 'success' | 'warning' | 'danger'> = {
  Low: 'success',
  Average: 'warning',
  High: 'danger'
}

const useStyles = makeStyles({
  root: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    paddingTop: tokens.spacingVerticalM,
    paddingRight: tokens.spacingHorizontalL,
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalL
  },
  emptyCard: {
    padding: tokens.spacingHorizontalXXL,
    textAlign: 'center'
  },
  tableHeader: {
    marginBottom: tokens.spacingVerticalM
  },
  tableScroller: {
    minHeight: '180px',
    flex: 1,
    overflow: 'auto'
  },
  table: {
    minWidth: '980px',
    tableLayout: 'fixed'
  },
  nameCell: {
    minWidth: 0
  },
  metricCell: {
    width: '88px'
  },
  noteColumn: {
    width: '96px'
  },
  actionColumn: {
    width: '196px'
  },
  noteFallback: {
    color: tokens.colorNeutralForeground3
  },
  noteCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  noteDetailButton: {
    minWidth: '72px'
  },
  actionCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'nowrap',
    gap: tokens.spacingHorizontalS
  },
  actionButton: {
    minWidth: '72px',
    flexShrink: 0
  },
  deleteButton: {
    color: tokens.colorPaletteRedForeground2
  },
  dialogContent: {
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word'
  }
})

export function FunctionEntryTable({
  entries,
  isBusy,
  onEditEntry,
  onDeleteEntry
}: FunctionEntryTableProps): React.JSX.Element {
  const styles = useStyles()
  const [selectedNoteEntry, setSelectedNoteEntry] = useState<FunctionEntry | null>(null)

  if (entries.length === 0) {
    return (
      <Card appearance="filled-alternative" className={styles.emptyCard}>
        <Body2>
          まだ機能が登録されていません。上のフォームから最初の FP エントリを追加してください。
        </Body2>
      </Card>
    )
  }

  return (
    <Card appearance="filled-alternative" className={styles.root}>
      <div className={styles.tableHeader}>
        <Body1Strong>登録済み機能</Body1Strong>
      </div>

      <div className={styles.tableScroller}>
        <Table aria-label="登録済み機能" className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>機能名</TableHeaderCell>
              <TableHeaderCell className={styles.metricCell}>Type</TableHeaderCell>
              <TableHeaderCell className={styles.metricCell}>DET</TableHeaderCell>
              <TableHeaderCell className={styles.metricCell}>FTR / RET</TableHeaderCell>
              <TableHeaderCell className={styles.metricCell}>難易度</TableHeaderCell>
              <TableHeaderCell className={styles.metricCell}>FP</TableHeaderCell>
              <TableHeaderCell className={styles.noteColumn}>備考</TableHeaderCell>
              <TableHeaderCell className={styles.actionColumn}>操作</TableHeaderCell>
            </TableRow>
          </TableHeader>

          <TableBody data-testid="function-entry-table-body">
            {entries.map((entry) => {
              const noteCell = entry.note ? (
                <div className={styles.noteCell}>
                  <Button
                    appearance="subtle"
                    aria-label={`${entry.name} の備考を表示`}
                    className={styles.noteDetailButton}
                    data-testid={`function-entry-note-detail-${entry.id}`}
                    onClick={() => setSelectedNoteEntry(entry)}
                  >
                    詳細
                  </Button>
                </div>
              ) : (
                <Caption1 className={styles.noteFallback}>なし</Caption1>
              )

              return (
                <TableRow key={entry.id} data-testid={`function-entry-${entry.id}`}>
                  <TableCell className={styles.nameCell}>
                    <TableCellLayout>
                      <Body1Strong>{entry.name}</Body1Strong>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell className={styles.metricCell}>{entry.functionType}</TableCell>
                  <TableCell className={styles.metricCell}>{entry.det}</TableCell>
                  <TableCell className={styles.metricCell}>{entry.referenceCount}</TableCell>
                  <TableCell className={styles.metricCell}>
                    <Badge
                      appearance="tint"
                      color={difficultyColorMap[entry.difficulty]}
                      shape="rounded"
                    >
                      {entry.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className={styles.metricCell}>
                    <Body1Strong>{entry.functionPoints}</Body1Strong>
                  </TableCell>
                  <TableCell className={styles.noteColumn}>{noteCell}</TableCell>
                  <TableCell className={styles.actionColumn}>
                    <div className={styles.actionCell}>
                      <Button
                        aria-label={`${entry.name} を編集`}
                        appearance="subtle"
                        className={styles.actionButton}
                        disabled={isBusy}
                        onClick={() => onEditEntry(entry)}
                      >
                        編集
                      </Button>
                      <Button
                        aria-label={`${entry.name} を削除`}
                        appearance="subtle"
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        disabled={isBusy}
                        onClick={() => onDeleteEntry(entry.id)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={selectedNoteEntry !== null}
        onOpenChange={(_event, data) => {
          if (!data.open) {
            setSelectedNoteEntry(null)
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {selectedNoteEntry ? `${selectedNoteEntry.name} の備考` : '備考'}
            </DialogTitle>
            <DialogContent
              className={styles.dialogContent}
              data-testid="function-note-dialog-content"
            >
              {selectedNoteEntry?.note}
            </DialogContent>
            <DialogActions>
              <Button appearance="primary" onClick={() => setSelectedNoteEntry(null)}>
                閉じる
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </Card>
  )
}
