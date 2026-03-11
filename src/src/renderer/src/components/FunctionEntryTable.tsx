import type { FunctionEntry } from '@shared/fp'

interface FunctionEntryTableProps {
  entries: FunctionEntry[]
  isBusy: boolean
  onEditEntry: (entry: FunctionEntry) => void
  onDeleteEntry: (entryId: string) => void
}

function getDisplayNote(note: string): string {
  if (note.length <= 8) {
    return note
  }

  return `${note.slice(0, 8)}…`
}

const difficultyClassName: Record<FunctionEntry['difficulty'], string> = {
  Low: 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-100',
  Average: 'border border-amber-400/20 bg-amber-500/10 text-amber-100',
  High: 'border border-rose-400/20 bg-rose-500/10 text-rose-100'
}

export function FunctionEntryTable({
  entries,
  isBusy,
  onEditEntry,
  onDeleteEntry
}: FunctionEntryTableProps): React.JSX.Element {
  if (entries.length === 0) {
    return (
      <section className="studio-empty-state p-8">
        まだ機能が登録されていません。上のフォームから最初の FP エントリを追加してください。
      </section>
    )
  }

  return (
    <section className="studio-panel flex min-h-0 flex-col overflow-visible">
      <div className="studio-divider border-b px-6 py-4">
        <h3 className="studio-text-primary text-lg font-semibold">登録済み機能</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="studio-table">
          <thead className="text-left text-xs">
            <tr>
              <th className="px-6 py-4">機能名</th>
              <th className="px-4 py-4">Type</th>
              <th className="px-4 py-4">DET</th>
              <th className="px-4 py-4">FTR / RET</th>
              <th className="px-4 py-4">難易度</th>
              <th className="px-4 py-4">FP</th>
              <th className="px-6 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody data-testid="function-entry-table-body">
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="bg-transparent"
                data-testid={`function-entry-${entry.id}`}
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="studio-text-primary font-medium">{entry.name}</p>
                    {entry.note ? (
                      <div className="studio-tooltip-trigger mt-1">
                        <p className="studio-text-secondary w-[9ch] truncate text-sm">
                          {getDisplayNote(entry.note)}
                        </p>
                        {entry.note.length > 8 ? (
                          <div className="studio-tooltip">{entry.note}</div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="studio-text-secondary mt-1 text-sm">備考なし</p>
                    )}
                  </div>
                </td>
                <td className="studio-text-secondary px-4 py-4 font-medium">
                  {entry.functionType}
                </td>
                <td className="px-4 py-4">{entry.det}</td>
                <td className="px-4 py-4">{entry.referenceCount}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${difficultyClassName[entry.difficulty]}`}
                  >
                    {entry.difficulty}
                  </span>
                </td>
                <td className="studio-text-primary px-4 py-4 font-semibold">
                  {entry.functionPoints}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      aria-label={`${entry.name} を編集`}
                      className="studio-text-secondary text-xs font-medium transition hover:opacity-80"
                      disabled={isBusy}
                      onClick={() => onEditEntry(entry)}
                      type="button"
                    >
                      編集
                    </button>
                    <button
                      aria-label={`${entry.name} を削除`}
                      className="studio-danger-button"
                      disabled={isBusy}
                      onClick={() => onDeleteEntry(entry.id)}
                      type="button"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
