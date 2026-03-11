import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

const sharedAlias = resolve('src/shared')

export default defineConfig({
  main: {
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
