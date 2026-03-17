import { useState } from 'react'

function formatProductivity(value: number): string {
  return value.toFixed(2)
}

interface UseProjectProductivityFormResult {
  productivity: string
  canSubmit: boolean
  updateValue: (value: string) => void
  reset: (value: number) => void
}

export function useProjectProductivityForm(initialValue: number): UseProjectProductivityFormResult {
  const [productivity, setProductivity] = useState(formatProductivity(initialValue))
  const [baseline, setBaseline] = useState(formatProductivity(initialValue))
  const [{ updateValue, reset }] = useState(() => ({
    updateValue: (value: string): void => {
      setProductivity(value)
    },
    reset: (value: number): void => {
      const formatted = formatProductivity(value)
      setProductivity(formatted)
      setBaseline(formatted)
    }
  }))

  const parsedProductivity = Number(productivity)
  const isValidValue = Number.isFinite(parsedProductivity) && parsedProductivity > 0

  const canSubmit = isValidValue && productivity !== baseline

  return {
    productivity,
    canSubmit,
    updateValue,
    reset
  }
}
