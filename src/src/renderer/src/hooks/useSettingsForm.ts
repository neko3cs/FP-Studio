import { useCallback, useState } from 'react'

interface UseSettingsFormResult {
  defaultProductivity: string
  canSubmit: boolean
  updateValue: (value: string) => void
  reset: (value: number) => void
}

export function useSettingsForm(initialValue: number): UseSettingsFormResult {
  const [defaultProductivity, setDefaultProductivity] = useState(String(initialValue))

  const updateValue = useCallback((value: string) => {
    setDefaultProductivity(value)
  }, [])

  const reset = useCallback((value: number) => {
    setDefaultProductivity(String(value))
  }, [])

  return {
    defaultProductivity,
    canSubmit: Number(defaultProductivity) > 0,
    updateValue,
    reset
  }
}
