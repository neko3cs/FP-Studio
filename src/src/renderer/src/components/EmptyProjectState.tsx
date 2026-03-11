export function EmptyProjectState(): React.JSX.Element {
  return (
    <section className="flex h-full min-h-[480px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">FP Studio</p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        最初のプロジェクトを作成してください
      </h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
        左側のフォームから案件を登録すると、Function Type、DET、FTR/RET を入力して UFP
        をその場で計測できます。
      </p>
    </section>
  )
}
