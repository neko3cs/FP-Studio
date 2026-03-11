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
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-panel">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-400">
            Function Point
          </p>
          <h3 className="mt-1 text-2xl font-semibold text-white">{projectName} に機能を追加</h3>
          <p className="mt-1 text-sm text-slate-400">
            Function Type と DET / {referenceLabel} を入れると難易度と FP を即時計算します。
          </p>
        </div>

        <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 px-4 py-3 text-right">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-brand-200">Preview</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {preview ? `${preview.difficulty} / ${preview.functionPoints} FP` : '入力待ち'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2 xl:col-span-2">
          <span className="text-sm font-medium text-slate-200">機能名</span>
          <input
            className="studio-input"
            disabled={isBusy}
            value={values.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
            placeholder="例: 顧客登録、売上照会"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-200">Function Type</span>
          <select
            className="studio-input"
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
          <span className="text-sm font-medium text-slate-200">DET</span>
          <input
            className="studio-input"
            disabled={isBusy}
            inputMode="numeric"
            value={values.det}
            onChange={(event) => onFieldChange('det', event.target.value)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-200">{referenceLabel}</span>
          <input
            className="studio-input"
            disabled={isBusy}
            inputMode="numeric"
            value={values.referenceCount}
            onChange={(event) => onFieldChange('referenceCount', event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-slate-200">備考</span>
        <textarea
          className="studio-textarea"
          disabled={isBusy}
          rows={3}
          value={values.note}
          onChange={(event) => onFieldChange('note', event.target.value)}
          placeholder="判断根拠や対象画面などをメモ"
        />
      </label>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-400">
          標準重みを適用し、合計 UFP と概算工数に即時反映します。
        </p>
        <button
          className="studio-primary-button"
          disabled={isBusy || !preview || !values.name.trim()}
          onClick={onSubmit}
        >
          機能を追加
        </button>
      </div>
    </section>
  )
}
