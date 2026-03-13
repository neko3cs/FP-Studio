import { useCallback, useMemo, useState } from 'react'

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

  const parsedProductivity = useMemo(() => Number(productivity), [productivity])
  const isValidValue = Number.isFinite(parsedProductivity) && parsedProductivity > 0

  const updateValue = useCallback((value: string) => {
    setProductivity(value)
  }, [])

  const reset = useCallback((value: number) => {
    const formatted = formatProductivity(value)
    setProductivity(formatted)
    setBaseline(formatted)
  }, [])

  const canSubmit = isValidValue && productivity !== baseline

  return {
    productivity,
    canSubmit,
    updateValue,
    reset
  }
}
