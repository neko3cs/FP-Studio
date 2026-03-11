import { useCallback, useMemo, useState } from 'react'

import {
  analyzeFunctionPoint,
  getReferenceLabel,
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
  referenceLabel: 'FTR' | 'RET'
  updateField: (field: keyof FunctionEntryFormState, value: string) => void
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

  const updateField = useCallback((field: keyof FunctionEntryFormState, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value
    }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialState)
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
    referenceLabel: getReferenceLabel(values.functionType),
    updateField,
    reset
  }
}
