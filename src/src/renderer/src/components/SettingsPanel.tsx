import { useState } from 'react'

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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="studio-panel px-5 py-4">
      <button
        aria-controls="settings-panel-content"
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
        data-testid="settings-accordion-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-3">
          <h3 className="studio-text-primary text-sm font-semibold">生産性設定</h3>
          <p className="studio-text-tertiary text-sm">{defaultProductivity} 人日 / FP</p>
        </div>

        <span
          aria-hidden="true"
          className={`studio-text-tertiary shrink-0 text-sm transition ${isOpen ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          className="mt-3 flex flex-col gap-3 border-t pt-3 lg:flex-row lg:items-end lg:justify-between"
          id="settings-panel-content"
        >
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
      ) : null}
    </section>
  )
}
