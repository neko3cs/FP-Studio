import { FluentProvider, makeStyles, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { useEffect, useMemo, useState } from 'react'

import App from './App'
import { RendererErrorBoundary } from './RendererErrorBoundary'

type ColorScheme = 'light' | 'dark'

const useStyles = makeStyles({
  provider: {
    height: '100%'
  }
})

function getSystemColorScheme(): ColorScheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function FluentRoot(): React.JSX.Element {
  const styles = useStyles()
  const [colorScheme, setColorScheme] = useState<ColorScheme>(getSystemColorScheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent): void => {
      setColorScheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const theme = useMemo(
    () => (colorScheme === 'dark' ? webDarkTheme : webLightTheme),
    [colorScheme]
  )

  return (
    <FluentProvider className={styles.provider} theme={theme}>
      <RendererErrorBoundary>
        <App />
      </RendererErrorBoundary>
    </FluentProvider>
  )
}
