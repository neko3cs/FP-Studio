if (typeof globalThis.NodeFilter === 'undefined') {
  class PolyfilledNodeFilter {
    static FILTER_ACCEPT = 1
    static FILTER_REJECT = 2
    static FILTER_SKIP = 3
  }

  globalThis.NodeFilter = PolyfilledNodeFilter as unknown as typeof NodeFilter
}

if (typeof NodeFilter === 'undefined') {
  globalThis.eval('var NodeFilter = globalThis.NodeFilter')
}

if (typeof window !== 'undefined' && typeof window.NodeFilter === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).NodeFilter = globalThis.NodeFilter
}
