import type { FunctionEntry } from '@shared/fp'

interface FunctionEntryTableProps {
  entries: FunctionEntry[]
  isBusy: boolean
  onDeleteEntry: (entryId: string) => void
}

const difficultyClassName: Record<FunctionEntry['difficulty'], string> = {
  Low: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  Average: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  High: 'bg-rose-500/15 text-rose-200 border border-rose-500/30'
}

export function FunctionEntryTable({
  entries,
  isBusy,
  onDeleteEntry
}: FunctionEntryTableProps): React.JSX.Element {
  if (entries.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
        まだ機能が登録されていません。上のフォームから最初の FP エントリを追加してください。
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-panel">
      <div className="border-b border-slate-800 px-6 py-4">
        <h3 className="text-lg font-semibold text-white">登録済み機能</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-[0.18em] text-slate-400">
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
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {entries.map((entry) => (
              <tr key={entry.id} className="bg-slate-900/40">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-white">{entry.name}</p>
                    <p className="text-xs text-slate-400">{entry.note || '備考なし'}</p>
                  </div>
                </td>
                <td className="px-4 py-4 font-medium text-brand-200">{entry.functionType}</td>
                <td className="px-4 py-4">{entry.det}</td>
                <td className="px-4 py-4">{entry.referenceCount}</td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyClassName[entry.difficulty]}`}
                  >
                    {entry.difficulty}
                  </span>
                </td>
                <td className="px-4 py-4 font-semibold text-white">{entry.functionPoints}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="text-xs font-medium text-rose-300 transition hover:text-rose-200"
                    disabled={isBusy}
                    onClick={() => onDeleteEntry(entry.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
