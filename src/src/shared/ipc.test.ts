import { describe, expect, it } from 'vitest'

import { STUDIO_CHANNELS } from './ipc'

describe('STUDIO_CHANNELS', () => {
  it('IPC チャンネル名を固定値として公開する', () => {
    expect(STUDIO_CHANNELS).toEqual({
      listProjects: 'studio:list-projects',
      getProject: 'studio:get-project',
      createProject: 'studio:create-project',
      deleteProject: 'studio:delete-project',
      createFunctionEntry: 'studio:create-function-entry',
      updateFunctionEntry: 'studio:update-function-entry',
      deleteFunctionEntry: 'studio:delete-function-entry',
      getSettings: 'studio:get-settings',
      updateSettings: 'studio:update-settings'
    })
  })

  it('各チャンネル名が重複しない', () => {
    const values = Object.values(STUDIO_CHANNELS)

    expect(new Set(values).size).toBe(values.length)
    expect(values.every((value) => value.startsWith('studio:'))).toBe(true)
  })
})
