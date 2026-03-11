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
  canSubmit: boolean
  isEditing: boolean
  referenceLabel: 'FTR' | 'RET'
  isBusy: boolean
  onFieldChange: (
    field: 'name' | 'functionType' | 'det' | 'referenceCount' | 'note',
    value: string
  ) => void
  onCancel: () => void
  onSubmit: () => void
}

export function FunctionEntryForm({
  projectName,
  values,
  preview,
  canSubmit,
  isEditing,
  referenceLabel,
  isBusy,
  onFieldChange,
  onCancel,
  onSubmit
}: FunctionEntryFormProps): React.JSX.Element {
  return (
    <section className="studio-panel px-5 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h3 className="studio-text-primary text-lg font-semibold tracking-tight">
          {isEditing ? `${projectName} の機能を編集` : `${projectName} に機能を追加`}
        </h3>

        <div className="studio-preview px-3.5 py-2.5" data-testid="function-preview">
          <p className="studio-text-primary text-base font-semibold">
            {preview ? `${preview.difficulty} / ${preview.functionPoints} FP` : '入力待ち'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
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

      <label className="mt-3 block space-y-2">
        <span className="studio-input-label">備考</span>
        <textarea
          className="studio-textarea"
          data-testid="function-note-input"
          disabled={isBusy}
          rows={2}
          value={values.note}
          onChange={(event) => onFieldChange('note', event.target.value)}
          placeholder="判断根拠や対象画面などをメモ"
        />
      </label>

      <div className="mt-4 flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
        {isEditing ? (
          <button
            className="studio-secondary-button"
            data-testid="cancel-edit-button"
            disabled={isBusy}
            onClick={onCancel}
            type="button"
          >
            編集をキャンセル
          </button>
        ) : (
          <div />
        )}
        <button
          className="studio-primary-button md:ml-auto"
          data-testid="add-function-button"
          disabled={isBusy || !canSubmit}
          onClick={onSubmit}
        >
          {isEditing ? '変更を保存' : '機能を追加'}
        </button>
      </div>
    </section>
  )
}
