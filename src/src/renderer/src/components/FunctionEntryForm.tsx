import type { FunctionPointAnalysis, FunctionType } from '@shared/fp'
import { FUNCTION_TYPES } from '@shared/fp'

interface FunctionEntryFormProps {
  projectName: string
  values: {
    name: string
    functionType: FunctionType
    det: string
    referenceCount: string
    note: string
  }
  preview: FunctionPointAnalysis | null
  referenceLabel: 'FTR' | 'RET'
  isBusy: boolean
  onFieldChange: (
    field: 'name' | 'functionType' | 'det' | 'referenceCount' | 'note',
    value: string
  ) => void
  onSubmit: () => void
}

export function FunctionEntryForm({
  projectName,
  values,
  preview,
  referenceLabel,
  isBusy,
  onFieldChange,
  onSubmit
}: FunctionEntryFormProps): React.JSX.Element {
  return (
    <section className="studio-panel px-6 py-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h3 className="studio-text-primary text-xl font-semibold tracking-tight">
          {projectName} に機能を追加
        </h3>

        <div className="studio-preview" data-testid="function-preview">
          <p className="studio-text-primary text-lg font-semibold">
            {preview ? `${preview.difficulty} / ${preview.functionPoints} FP` : '入力待ち'}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 xl:col-span-2">
          <span className="studio-input-label">機能名</span>
          <input
            className="studio-input"
            data-testid="function-name-input"
            disabled={isBusy}
            value={values.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
            placeholder="例: 顧客登録、売上照会"
          />
        </label>

        <label className="space-y-2">
          <span className="studio-input-label">Function Type</span>
          <select
            className="studio-input"
            data-testid="function-type-select"
            disabled={isBusy}
            value={values.functionType}
            onChange={(event) => onFieldChange('functionType', event.target.value)}
          >
            {FUNCTION_TYPES.map((functionType) => (
              <option key={functionType} value={functionType}>
                {functionType}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="studio-input-label">DET</span>
          <input
            className="studio-input"
            data-testid="det-input"
            disabled={isBusy}
            inputMode="numeric"
            value={values.det}
            onChange={(event) => onFieldChange('det', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="studio-input-label">{referenceLabel}</span>
          <input
            className="studio-input"
            data-testid="reference-count-input"
            disabled={isBusy}
            inputMode="numeric"
            value={values.referenceCount}
            onChange={(event) => onFieldChange('referenceCount', event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="studio-input-label">備考</span>
        <textarea
          className="studio-textarea"
          data-testid="function-note-input"
          disabled={isBusy}
          rows={3}
          value={values.note}
          onChange={(event) => onFieldChange('note', event.target.value)}
          placeholder="判断根拠や対象画面などをメモ"
        />
      </label>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button
          className="studio-primary-button md:ml-auto"
          data-testid="add-function-button"
          disabled={isBusy || !preview || !values.name.trim()}
          onClick={onSubmit}
        >
          機能を追加
        </button>
      </div>
    </section>
  )
}
