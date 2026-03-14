import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest'

import { createStudioService } from './studio-service'
import type { StudioRepository } from '../repositories/studio-repository'
import {
  DEFAULT_STUDIO_SETTINGS,
  type StudioSettings,
  type DifficultyRule,
  type WeightTable
} from '@shared/fp'

function createRepositoryMock(): Mocked<StudioRepository> {
  const repository: Mocked<StudioRepository> = {
    listProjects: vi.fn<StudioRepository['listProjects']>(),
    getProject: vi.fn<StudioRepository['getProject']>(),
    createProject: vi.fn<StudioRepository['createProject']>(),
    updateProjectTimestamp: vi.fn<StudioRepository['updateProjectTimestamp']>(),
    deleteProject: vi.fn<StudioRepository['deleteProject']>(),
    listFunctionEntries: vi.fn<StudioRepository['listFunctionEntries']>(),
    createFunctionEntry: vi.fn<StudioRepository['createFunctionEntry']>(),
    updateFunctionEntry: vi.fn<StudioRepository['updateFunctionEntry']>(),
    deleteFunctionEntry: vi.fn<StudioRepository['deleteFunctionEntry']>(),
    getSettings: vi.fn<StudioRepository['getSettings']>(),
    setDefaultProductivity: vi.fn<StudioRepository['setDefaultProductivity']>(),
    setDifficultyRules: vi.fn<StudioRepository['setDifficultyRules']>(),
    setWeightTable: vi.fn<StudioRepository['setWeightTable']>(),
    setProjectProductivity: vi.fn<StudioRepository['setProjectProductivity']>(),
    close: vi.fn<StudioRepository['close']>()
  }

  return repository
}

function createTestSettings(overrides: Partial<StudioSettings> = {}): StudioSettings {
  return {
    defaultProductivity:
      overrides.defaultProductivity ?? DEFAULT_STUDIO_SETTINGS.defaultProductivity,
    difficultyRules: overrides.difficultyRules ?? DEFAULT_STUDIO_SETTINGS.difficultyRules,
    weightTable: overrides.weightTable ?? DEFAULT_STUDIO_SETTINGS.weightTable
  }
}

describe('createStudioService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('11111111-1111-4111-8111-111111111111')
      .mockReturnValueOnce('22222222-2222-4222-8222-222222222222')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('一覧取得時に設定値を用いてプロジェクト集計を返す', () => {
    const repository = createRepositoryMock()
    repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 1.5 }))
    repository.listProjects.mockReturnValue([
      {
        id: 'project-1',
        name: '案件A',
        description: '説明',
        createdAt: '2025-12-31T00:00:00.000Z',
        updatedAt: '2025-12-31T00:00:00.000Z',
        productivity: 1.5
      }
    ])
    repository.listFunctionEntries.mockReturnValue([
      {
        id: 'entry-1',
        projectId: 'project-1',
        name: '顧客登録',
        functionType: 'EI',
        det: 5,
        referenceCount: 2,
        difficulty: 'Average',
        functionPoints: 4,
        note: '',
        createdAt: '2025-12-31T00:00:00.000Z',
        updatedAt: '2025-12-31T00:00:00.000Z'
      }
    ])

    const service = createStudioService(repository)

    expect(service.listProjects()).toEqual([
      {
        id: 'project-1',
        name: '案件A',
        description: '説明',
        createdAt: '2025-12-31T00:00:00.000Z',
        updatedAt: '2025-12-31T00:00:00.000Z',
        productivity: 1.5,
        functionCount: 1,
        totalFunctionPoints: 4,
        estimatedEffortDays: 6
      }
    ])
  })

  it('詳細取得で対象がなければ null を返す', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue(null)

    const service = createStudioService(repository)

    expect(service.getProjectDetail('missing')).toBeNull()
  })

  it('プロジェクトを作成し、入力を trim した詳細を返す', () => {
    const repository = createRepositoryMock()
    repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 1.25 }))

    const service = createStudioService(repository)

    expect(service.createProject({ name: '  新規案件  ', description: '  説明  ' })).toEqual({
      id: '11111111-1111-4111-8111-111111111111',
      name: '新規案件',
      description: '説明',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      productivity: 1.25,
      functionCount: 0,
      totalFunctionPoints: 0,
      estimatedEffortDays: 0,
      entries: []
    })
    expect(repository.createProject).toHaveBeenCalledWith({
      id: '11111111-1111-4111-8111-111111111111',
      name: '新規案件',
      description: '説明',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      productivity: 1.25
    })
  })

  it('空のプロジェクト名ではエラーにする', () => {
    const service = createStudioService(createRepositoryMock())

    expect(() => service.createProject({ name: '   ', description: '' })).toThrow(
      'プロジェクト名は必須です。'
    )
  })

  it('存在しないプロジェクトは削除できない', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue(null)

    const service = createStudioService(repository)

    expect(() => service.deleteProject('missing')).toThrow(
      '削除対象のプロジェクトが見つかりません。'
    )
  })

  it('機能を追加して集計済みの詳細を返す', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 2
    })
    repository.listFunctionEntries.mockReturnValue([
      {
        id: '22222222-2222-4222-8222-222222222222',
        projectId: 'project-1',
        name: '顧客登録',
        functionType: 'EI',
        det: 5,
        referenceCount: 2,
        difficulty: 'Average',
        functionPoints: 4,
        note: 'メモ',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }
    ])
    repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 2 }))

    const service = createStudioService(repository)

    expect(
      service.createFunctionEntry({
        projectId: 'project-1',
        name: '  顧客登録  ',
        functionType: 'EI',
        det: 5,
        referenceCount: 2,
        note: '  メモ  '
      })
    ).toEqual({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      productivity: 2,
      functionCount: 1,
      totalFunctionPoints: 4,
      estimatedEffortDays: 8,
      entries: [
        {
          id: '22222222-2222-4222-8222-222222222222',
          projectId: 'project-1',
          name: '顧客登録',
          functionType: 'EI',
          det: 5,
          referenceCount: 2,
          difficulty: 'Average',
          functionPoints: 4,
          note: 'メモ',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    })
    expect(repository.createFunctionEntry).toHaveBeenCalledWith({
      id: '11111111-1111-4111-8111-111111111111',
      projectId: 'project-1',
      name: '顧客登録',
      functionType: 'EI',
      det: 5,
      referenceCount: 2,
      difficulty: 'Average',
      functionPoints: 4,
      note: 'メモ',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
    expect(repository.updateProjectTimestamp).toHaveBeenCalledWith(
      'project-1',
      '2026-01-01T00:00:00.000Z'
    )
  })

  it('機能追加時に対象プロジェクトがなければ失敗する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue(null)

    const service = createStudioService(repository)

    expect(() =>
      service.createFunctionEntry({
        projectId: 'missing',
        name: '顧客登録',
        functionType: 'EI',
        det: 5,
        referenceCount: 2,
        note: ''
      })
    ).toThrow('対象プロジェクトが見つかりません。')
  })

  it('機能追加時に数値の妥当性を検証する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 1
    })

    const service = createStudioService(repository)

    expect(() =>
      service.createFunctionEntry({
        projectId: 'project-1',
        name: '顧客登録',
        functionType: 'EI',
        det: 0,
        referenceCount: 2,
        note: ''
      })
    ).toThrow('DETは1以上の整数で入力してください。')
    expect(() =>
      service.createFunctionEntry({
        projectId: 'project-1',
        name: '顧客登録',
        functionType: 'EI',
        det: 4,
        referenceCount: -1,
        note: ''
      })
    ).toThrow('FTR/RETは0以上の整数で入力してください。')
  })

  it('機能を更新する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 1
    })
    repository.listFunctionEntries
      .mockReturnValueOnce([
        {
          id: 'entry-1',
          projectId: 'project-1',
          name: '旧機能',
          functionType: 'EI',
          det: 4,
          referenceCount: 1,
          difficulty: 'Low',
          functionPoints: 3,
          note: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z'
        }
      ])
      .mockReturnValueOnce([
        {
          id: 'entry-1',
          projectId: 'project-1',
          name: '更新後',
          functionType: 'EO',
          det: 20,
          referenceCount: 4,
          difficulty: 'High',
          functionPoints: 7,
          note: '更新',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ])
    repository.getSettings.mockReturnValue(createTestSettings())

    const service = createStudioService(repository)

    expect(
      service.updateFunctionEntry({
        projectId: 'project-1',
        entryId: 'entry-1',
        name: '  更新後  ',
        functionType: 'EO',
        det: 20,
        referenceCount: 4,
        note: '  更新  '
      })
    ).toEqual({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      productivity: 1,
      functionCount: 1,
      totalFunctionPoints: 7,
      estimatedEffortDays: 7,
      entries: [
        {
          id: 'entry-1',
          projectId: 'project-1',
          name: '更新後',
          functionType: 'EO',
          det: 20,
          referenceCount: 4,
          difficulty: 'High',
          functionPoints: 7,
          note: '更新',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z'
        }
      ]
    })
    expect(repository.updateFunctionEntry).toHaveBeenCalledWith({
      id: 'entry-1',
      projectId: 'project-1',
      name: '更新後',
      functionType: 'EO',
      det: 20,
      referenceCount: 4,
      difficulty: 'High',
      functionPoints: 7,
      note: '更新',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
  })

  it('更新対象の機能がなければ失敗する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 1
    })
    repository.listFunctionEntries.mockReturnValue([])

    const service = createStudioService(repository)

    expect(() =>
      service.updateFunctionEntry({
        projectId: 'project-1',
        entryId: 'missing',
        name: '更新後',
        functionType: 'EO',
        det: 20,
        referenceCount: 4,
        note: ''
      })
    ).toThrow('更新対象の機能が見つかりません。')
  })

  it('機能を削除する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 1
    })
    repository.listFunctionEntries
      .mockReturnValueOnce([
        {
          id: 'entry-1',
          projectId: 'project-1',
          name: '削除対象',
          functionType: 'EI',
          det: 4,
          referenceCount: 1,
          difficulty: 'Low',
          functionPoints: 3,
          note: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z'
        }
      ])
      .mockReturnValueOnce([])
    repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 1.25 }))

    const service = createStudioService(repository)

    expect(service.deleteFunctionEntry({ projectId: 'project-1', entryId: 'entry-1' })).toEqual({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      productivity: 1,
      functionCount: 0,
      totalFunctionPoints: 0,
      estimatedEffortDays: 0,
      entries: []
    })
    expect(repository.deleteFunctionEntry).toHaveBeenCalledWith('entry-1')
  })

  it('削除対象の機能がなければ失敗する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 1
    })
    repository.listFunctionEntries.mockReturnValue([])

    const service = createStudioService(repository)

    expect(() =>
      service.deleteFunctionEntry({ projectId: 'project-1', entryId: 'missing' })
    ).toThrow('削除対象の機能が見つかりません。')
  })

  it('プロジェクトの生産性を更新する', () => {
    const repository = createRepositoryMock()
    repository.getProject.mockReturnValue({
      id: 'project-1',
      name: '案件A',
      description: '',
      createdAt: '2025-12-31T00:00:00.000Z',
      updatedAt: '2025-12-31T00:00:00.000Z',
      productivity: 1
    })
    repository.listFunctionEntries.mockReturnValue([])
    repository.getSettings.mockReturnValue(createTestSettings())

    const service = createStudioService(repository)

    const detail = service.updateProjectProductivity({
      projectId: 'project-1',
      productivity: 2.456
    })

    expect(detail.productivity).toBe(2.46)
    expect(repository.setProjectProductivity).toHaveBeenCalledWith(
      'project-1',
      2.46,
      '2026-01-01T00:00:00.000Z'
    )
  })

  it('設定値を更新して小数第2位に丸める', () => {
    const repository = createRepositoryMock()
    repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 1.23 }))

    const service = createStudioService(repository)
    const baseline = createTestSettings({ defaultProductivity: 1.23 })

    expect(service.getSettings()).toEqual(baseline)
    expect(service.updateSettings({ defaultProductivity: 1.234 })).toEqual(baseline)
    expect(repository.setDefaultProductivity).toHaveBeenCalledWith(1.23)
  })

  it('不正な生産性は拒否する', () => {
    const service = createStudioService(createRepositoryMock())

    expect(() => service.updateSettings({ defaultProductivity: 0 })).toThrow(
      '生産性は0より大きい数値で入力してください。'
    )
    expect(() => service.updateSettings({ defaultProductivity: Number.NaN })).toThrow(
      '生産性は0より大きい数値で入力してください。'
    )
  })

  it('難易度ルールと重みを同時に変更できる', () => {
    const repository = createRepositoryMock()
    repository.getSettings.mockReturnValue(createTestSettings())
    const rules: DifficultyRule[] = DEFAULT_STUDIO_SETTINGS.difficultyRules.map((rule) => ({
      functionType: rule.functionType,
      det: [rule.det[0] + 1, rule.det[1] + 1],
      reference: [rule.reference[0] + 1, rule.reference[1] + 1]
    }))
    const weight: WeightTable = {
      ...DEFAULT_STUDIO_SETTINGS.weightTable,
      EI: {
        ...DEFAULT_STUDIO_SETTINGS.weightTable.EI,
        Low: DEFAULT_STUDIO_SETTINGS.weightTable.EI.Low + 1
      }
    }

    const service = createStudioService(repository)

    service.updateSettings({
      difficultyRules: rules,
      weightTable: weight
    })

    expect(repository.setDifficultyRules).toHaveBeenCalledWith(rules)
    expect(repository.setWeightTable).toHaveBeenCalledWith(weight)
  })
})
