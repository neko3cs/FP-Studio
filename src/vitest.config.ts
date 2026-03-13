import { resolve } from 'path'

import { defineConfig } from 'vitest/config'

const setupFile = resolve('src/test/setup.ts')

export default defineConfig({
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src'),
      '@shared': resolve('src/shared')
    }
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: [setupFile],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: 'coverage',
      include: [
        'src/shared/fp.ts',
        'src/shared/ipc.ts',
        'src/main/app-paths.ts',
        'src/main/ipc/handlers.ts',
        'src/main/ipc/register-handlers.ts',
        'src/main/services/studio-service.ts',
        'src/renderer/src/RendererErrorBoundary.tsx',
        'src/renderer/src/hooks/useFunctionEntryForm.ts',
        'src/renderer/src/hooks/useProjectForm.ts',
        'src/renderer/src/hooks/useSettingsForm.ts'
      ],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      thresholds: {
        branches: 80
      }
    }
  }
})
