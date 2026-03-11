import { useCallback, useMemo, useState } from 'react'

import {
  analyzeFunctionPoint,
  getReferenceLabel,
  type FunctionEntry,
  type FunctionPointAnalysis,
  type FunctionType
} from '@shared/fp'

interface FunctionEntryFormState {
  name: string
  functionType: FunctionType
  det: string
  referenceCount: string
  note: string
}

interface UseFunctionEntryFormResult {
  values: FunctionEntryFormState
  preview: FunctionPointAnalysis | null
  canSubmit: boolean
  editingEntryId: string | null
  isEditing: boolean
  referenceLabel: 'FTR' | 'RET'
  updateField: (field: keyof FunctionEntryFormState, value: string) => void
  startEditing: (entry: FunctionEntry) => void
  cancelEditing: () => void
  reset: () => void
}

const initialState: FunctionEntryFormState = {
  name: '',
  functionType: 'EI',
  det: '4',
  referenceCount: '1',
  note: ''
}

export function useFunctionEntryForm(): UseFunctionEntryFormResult {
  const [values, setValues] = useState<FunctionEntryFormState>(initialState)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  const updateField = useCallback((field: keyof FunctionEntryFormState, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value
    }))
  }, [])

  const startEditing = useCallback((entry: FunctionEntry) => {
    setValues({
      name: entry.name,
      functionType: entry.functionType,
      det: String(entry.det),
      referenceCount: String(entry.referenceCount),
      note: entry.note
    })
    setEditingEntryId(entry.id)
  }, [])

  const cancelEditing = useCallback(() => {
    setValues(initialState)
    setEditingEntryId(null)
  }, [])

  const reset = useCallback(() => {
    setValues(initialState)
    setEditingEntryId(null)
  }, [])

  const parsedDet = Number(values.det)
  const parsedReferenceCount = Number(values.referenceCount)

  const preview = useMemo(() => {
    if (!Number.isInteger(parsedDet) || parsedDet < 1) {
      return null
    }

    if (!Number.isInteger(parsedReferenceCount) || parsedReferenceCount < 0) {
      return null
    }

    return analyzeFunctionPoint(values.functionType, parsedDet, parsedReferenceCount)
  }, [parsedDet, parsedReferenceCount, values.functionType])

  return {
    values,
    preview,
    canSubmit: values.name.trim().length > 0 && preview !== null,
    editingEntryId,
    isEditing: editingEntryId !== null,
    referenceLabel: getReferenceLabel(values.functionType),
    updateField,
    startEditing,
    cancelEditing,
    reset
  }
}
