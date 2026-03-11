import { useCallback, useState } from 'react'

function formatProductivity(value: number): string {
  return value.toFixed(2)
}

interface UseSettingsFormResult {
  defaultProductivity: string
  canSubmit: boolean
  updateValue: (value: string) => void
  reset: (value: number) => void
}

export function useSettingsForm(initialValue: number): UseSettingsFormResult {
  const [defaultProductivity, setDefaultProductivity] = useState(formatProductivity(initialValue))

  const updateValue = useCallback((value: string) => {
    setDefaultProductivity(value)
  }, [])

  const reset = useCallback((value: number) => {
    setDefaultProductivity(formatProductivity(value))
  }, [])

  return {
    defaultProductivity,
    canSubmit: Number(defaultProductivity) > 0,
    updateValue,
    reset
  }
}
