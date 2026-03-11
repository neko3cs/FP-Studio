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
    <section className="studio-panel px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h3 className="studio-text-primary text-base font-semibold">生産性設定</h3>

        <label className="flex-1 space-y-2">
          <span className="studio-input-label">デフォルト生産性 (人日 / FP)</span>
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
          className="studio-secondary-button shrink-0"
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
