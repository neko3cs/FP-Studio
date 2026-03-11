interface SettingsPanelProps {
  defaultProductivity: string
  canSubmit: boolean
  isBusy: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}

export function SettingsPanel({
  defaultProductivity,
  canSubmit,
  isBusy,
  onChange,
  onSubmit
}: SettingsPanelProps): React.JSX.Element {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">Settings</p>
      <h3 className="mt-1 text-xl font-semibold text-white">生産性設定</h3>
      <p className="mt-2 text-sm text-slate-400">
        1FP あたりの人日を設定すると、各プロジェクトの概算工数に即時反映されます。
      </p>

      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-medium text-slate-200">デフォルト生産性 (人日 / FP)</span>
          <input
            className="studio-input"
            data-testid="settings-productivity-input"
            disabled={isBusy}
            inputMode="decimal"
            value={defaultProductivity}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>

        <button
          className="studio-secondary-button"
          data-testid="settings-save-button"
          disabled={isBusy || !canSubmit}
          onClick={onSubmit}
        >
          設定を保存
        </button>
      </div>
    </section>
  )
}
