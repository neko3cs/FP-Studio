import { useState } from 'react'

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
  const [{ updateField, reset }] = useState(() => ({
    updateField: (field: keyof ProjectFormState, value: string): void => {
      setValues((current) => ({
        ...current,
        [field]: value
      }))
    },
    reset: (): void => {
      setValues(initialState)
    }
  }))

  return {
    values,
    canSubmit: values.name.trim().length > 0,
    updateField,
    reset
  }
}
