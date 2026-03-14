import { builtinModules } from 'module'
import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const sharedAlias = resolve('src/shared')
const nativeMainExternals = new Set([
  'electron',
  'better-sqlite3',
  ...builtinModules,
  ...builtinModules.map((moduleName) => `node:${moduleName}`)
])

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: Array.from(nativeMainExternals)
      }
    },
    resolve: {
      alias: {
        '@shared': sharedAlias
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': sharedAlias
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': sharedAlias
      }
    },
    plugins: [react()]
  }
})
