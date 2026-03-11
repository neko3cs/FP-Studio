import { useCallback, useState } from 'react'

interface ProjectFormState {
  name: string
  description: string
}

interface UseProjectFormResult {
  values: ProjectFormState
  canSubmit: boolean
  updateField: (field: keyof ProjectFormState, value: string) => void
  reset: () => void
}

const initialState: ProjectFormState = {
  name: '',
  description: ''
}

export function useProjectForm(): UseProjectFormResult {
  const [values, setValues] = useState<ProjectFormState>(initialState)

  const updateField = useCallback((field: keyof ProjectFormState, value: string) => {
    setValues((current) => ({
      ...current,
      [field]: value
    }))
  }, [])

  const reset = useCallback(() => {
    setValues(initialState)
  }, [])

  return {
    values,
    canSubmit: values.name.trim().length > 0,
    updateField,
    reset
  }
}
