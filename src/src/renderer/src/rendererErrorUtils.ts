export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  if (typeof error === 'string' && error.length > 0) {
    return new Error(error)
  }

  return new Error('予期しないエラーが発生しました。')
}

export function reloadRenderer(): void {
  window.location.reload()
}
