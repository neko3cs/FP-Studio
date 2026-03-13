import { Component, useEffect, useState } from 'react'
import type { CSSProperties, ErrorInfo, ReactNode } from 'react'
import { normalizeError, reloadRenderer } from './rendererErrorUtils'

interface RendererErrorBoundaryProps {
  children: ReactNode
}

interface CaughtErrorBoundaryState {
  error: Error | null
}

const shellStyle: CSSProperties = {
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  backgroundColor: '#f5f5f5',
  color: '#1a1a1a'
}

const cardStyle: CSSProperties = {
  width: 'min(560px, 100%)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '24px',
  borderRadius: '12px',
  backgroundColor: '#ffffff',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)'
}

const messageStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: '8px',
  backgroundColor: '#fde7e9',
  color: '#a4262c',
  whiteSpace: 'pre-wrap'
}

const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end'
}

const reloadButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '6px',
  padding: '10px 16px',
  backgroundColor: '#0f6cbd',
  color: '#ffffff',
  font: 'inherit',
  cursor: 'pointer'
}

function RendererErrorFallback({ error }: { error: Error }): React.JSX.Element {
  return (
    <div data-testid="renderer-error-fallback" style={shellStyle}>
      <div style={cardStyle}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>画面の表示中にエラーが発生しました。</h1>
          <p style={{ marginBottom: 0 }}>
            再読み込みで復旧する場合があります。問題が続く場合は直前の操作を確認してください。
          </p>
        </div>

        <div style={messageStyle}>{error.message}</div>

        <div style={actionsStyle}>
          <button style={reloadButtonStyle} type="button" onClick={reloadRenderer}>
            再読み込み
          </button>
        </div>
      </div>
    </div>
  )
}

class CaughtRendererErrorBoundary extends Component<
  RendererErrorBoundaryProps,
  CaughtErrorBoundaryState
> {
  state: CaughtErrorBoundaryState = {
    error: null
  }

  static getDerivedStateFromError(error: Error): CaughtErrorBoundaryState {
    return {
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Renderer crashed while rendering the app.', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.error) {
      return <RendererErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}

export function RendererErrorBoundary({ children }: RendererErrorBoundaryProps): React.JSX.Element {
  const [globalError, setGlobalError] = useState<Error | null>(null)

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const nextError = normalizeError(event.reason)
      console.error('Renderer emitted an unhandled rejection.', nextError)
      setGlobalError(nextError)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (globalError) {
    return <RendererErrorFallback error={globalError} />
  }

  return <CaughtRendererErrorBoundary>{children}</CaughtRendererErrorBoundary>
}
