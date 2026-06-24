import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest'

import { createStudioService } from './studio-service'
import type { StudioRepository } from '../repositories/studio-repository'
import { DEFAULT_STUDIO_SETTINGS, type StudioSettings } from '@shared/fp'

function createRepositoryMock(): Mocked<StudioRepository> {
  return {
    listProjects: vi.fn<StudioRepository['listProjects']>(),
    getProject: vi.fn<StudioRepository['getProject']>(),
    createProject: vi.fn<StudioRepository['createProject']>(),
    updateProjectTimestamp: vi.fn<StudioRepository['updateProjectTimestamp']>(),
    renameProject: vi.fn<StudioRepository['renameProject']>(),
    deleteProject: vi.fn<StudioRepository['deleteProject']>(),
    listFunctionEntries: vi.fn<StudioRepository['listFunctionEntries']>(),
    createFunctionEntry: vi.fn<StudioRepository['createFunctionEntry']>(),
    updateFunctionEntry: vi.fn<StudioRepository['updateFunctionEntry']>(),
    deleteFunctionEntry: vi.fn<StudioRepository['deleteFunctionEntry']>(),
    getSettings: vi.fn<StudioRepository['getSettings']>(),
    setDefaultProductivity: vi.fn<StudioRepository['setDefaultProductivity']>(),
    setProjectProductivity: vi.fn<StudioRepository['setProjectProductivity']>(),
    close: vi.fn<StudioRepository['close']>()
  }
}

function createTestSettings(overrides: Partial<StudioSettings> = {}): StudioSettings {
  return {
    defaultProductivity:
      overrides.defaultProductivity ?? DEFAULT_STUDIO_SETTINGS.defaultProductivity,
    difficultyRules: overrides.difficultyRules ?? DEFAULT_STUDIO_SETTINGS.difficultyRules,
    weightTable: overrides.weightTable ?? DEFAULT_STUDIO_SETTINGS.weightTable
  }
}

describe('StudioService', () => {
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

  describe('プロジェクト管理', () => {
    describe('一覧取得', () => {
      it('設定の生産性でプロジェクト集計を返す', () => {
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

      it('生産性が未設定（NaN）のプロジェクトはデフォルト生産性で集計する', () => {
        const repository = createRepositoryMock()
        repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 3 }))
        repository.listProjects.mockReturnValue([
          {
            id: 'project-1',
            name: '案件A',
            description: '説明',
            createdAt: '2025-12-31T00:00:00.000Z',
            updatedAt: '2025-12-31T00:00:00.000Z',
            productivity: Number.NaN
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
            productivity: 3,
            functionCount: 1,
            totalFunctionPoints: 4,
            estimatedEffortDays: 12
          }
        ])
      })
    })

    describe('詳細取得', () => {
      it('存在しないプロジェクトは null を返す', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(service.getProjectDetail('missing')).toBeNull()
      })

      it('生産性が無効（NaN）なら設定のデフォルト生産性で集計する', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '説明',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: Number.NaN
        })
        repository.listFunctionEntries.mockReturnValue([
          {
            id: 'entry-1',
            projectId: 'project-1',
            name: '顧客照会',
            functionType: 'EQ',
            det: 8,
            referenceCount: 2,
            difficulty: 'Average',
            functionPoints: 4,
            note: '',
            createdAt: '2025-12-31T00:00:00.000Z',
            updatedAt: '2025-12-31T00:00:00.000Z'
          }
        ])
        repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 2.5 }))

        const service = createStudioService(repository)

        expect(service.getProjectDetail('project-1')).toEqual({
          id: 'project-1',
          name: '案件A',
          description: '説明',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 2.5,
          functionCount: 1,
          totalFunctionPoints: 4,
          estimatedEffortDays: 10,
          entries: [
            {
              id: 'entry-1',
              projectId: 'project-1',
              name: '顧客照会',
              functionType: 'EQ',
              det: 8,
              referenceCount: 2,
              difficulty: 'Average',
              functionPoints: 4,
              note: '',
              createdAt: '2025-12-31T00:00:00.000Z',
              updatedAt: '2025-12-31T00:00:00.000Z'
            }
          ]
        })
      })
    })

    describe('作成', () => {
      it('名前・説明の前後スペースを除去してデフォルト生産性で作成する', () => {
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

      it('空のプロジェクト名では作成できない', () => {
        const service = createStudioService(createRepositoryMock())

        expect(() => service.createProject({ name: '   ', description: '' })).toThrow(
          'プロジェクト名は必須です。'
        )
      })
    })

    describe('削除', () => {
      it('存在するプロジェクトを削除できる', () => {
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

        expect(service.deleteProject('project-1')).toBeUndefined()
        expect(repository.deleteProject).toHaveBeenCalledWith('project-1')
      })

      it('存在しないプロジェクトは削除できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(() => service.deleteProject('missing')).toThrow(
          '削除対象のプロジェクトが見つかりません。'
        )
      })
    })

    describe('複製', () => {
      it('名前に「コピー」が付いた新規プロジェクトが作成される', () => {
        const repository = createRepositoryMock()
        repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 1.5 }))
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '説明',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1.5
        })
        repository.listFunctionEntries.mockReturnValue([])

        const service = createStudioService(repository)
        const result = service.duplicateProject({ projectId: 'project-1' })

        expect(result.name).toBe('案件A コピー')
        expect(result.description).toBe('説明')
        expect(result.productivity).toBe(1.5)
        expect(repository.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '11111111-1111-4111-8111-111111111111',
            name: '案件A コピー',
            description: '説明',
            productivity: 1.5
          })
        )
      })

      it('元の機能エントリが全て新しいプロジェクトにコピーされる', () => {
        const repository = createRepositoryMock()
        repository.getSettings.mockReturnValue(createTestSettings())
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        const sourceEntries = [
          {
            id: 'entry-1',
            projectId: 'project-1',
            name: '顧客登録',
            functionType: 'EI' as const,
            det: 5,
            referenceCount: 2,
            difficulty: 'Average' as const,
            functionPoints: 4,
            note: '',
            createdAt: '2025-12-31T00:00:00.000Z',
            updatedAt: '2025-12-31T00:00:00.000Z'
          }
        ]
        repository.listFunctionEntries.mockReturnValueOnce(sourceEntries).mockReturnValueOnce([
          {
            ...sourceEntries[0],
            id: '22222222-2222-4222-8222-222222222222',
            projectId: '11111111-1111-4111-8111-111111111111'
          }
        ])

        const service = createStudioService(repository)
        const result = service.duplicateProject({ projectId: 'project-1' })

        expect(repository.createFunctionEntry).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '22222222-2222-4222-8222-222222222222',
            projectId: '11111111-1111-4111-8111-111111111111',
            name: '顧客登録',
            functionType: 'EI',
            det: 5,
            referenceCount: 2
          })
        )
        expect(result.entries).toHaveLength(1)
        expect(result.entries[0].name).toBe('顧客登録')
      })

      it('存在しないプロジェクトは複製できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(() => service.duplicateProject({ projectId: 'missing' })).toThrow(
          '複製対象のプロジェクトが見つかりません。'
        )
      })
    })

    describe('リネーム', () => {
      it('名前の前後スペースを除去してリネームし、更新後の詳細を返す', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '旧名称',
          description: '説明',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([])
        repository.getSettings.mockReturnValue(createTestSettings())

        const service = createStudioService(repository)
        const result = service.renameProject({ projectId: 'project-1', name: '  新名称  ' })

        expect(result.name).toBe('新名称')
        expect(repository.renameProject).toHaveBeenCalledWith(
          'project-1',
          '新名称',
          '2026-01-01T00:00:00.000Z'
        )
      })

      it('空のプロジェクト名では名前変更できない', () => {
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

        expect(() => service.renameProject({ projectId: 'project-1', name: '   ' })).toThrow(
          'プロジェクト名は必須です。'
        )
      })

      it('存在しないプロジェクトは名前変更できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(() => service.renameProject({ projectId: 'missing', name: '新名称' })).toThrow(
          '対象プロジェクトが見つかりません。'
        )
      })
    })
  })

  describe('機能エントリ管理', () => {
    describe('追加', () => {
      it('DET・FTR/RETから難易度とFPを自動判定して集計済み詳細を返す', () => {
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

      it('カスタム難易度ルールと重みを使って難易度とFPを判定する', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([
          {
            id: '11111111-1111-4111-8111-111111111111',
            projectId: 'project-1',
            name: '追加機能',
            functionType: 'EI',
            det: 4,
            referenceCount: 1,
            difficulty: 'High',
            functionPoints: 60,
            note: '',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ])
        repository.getSettings.mockReturnValue(
          createTestSettings({
            difficultyRules: DEFAULT_STUDIO_SETTINGS.difficultyRules.map((rule) =>
              rule.functionType === 'EI'
                ? { functionType: 'EI', det: [1, 2], reference: [0, 0] }
                : rule
            ),
            weightTable: {
              ...DEFAULT_STUDIO_SETTINGS.weightTable,
              EI: { Low: 30, Average: 40, High: 60 }
            }
          })
        )

        const service = createStudioService(repository)

        const detail = service.createFunctionEntry({
          projectId: 'project-1',
          name: '追加機能',
          functionType: 'EI',
          det: 4,
          referenceCount: 1,
          note: ''
        })

        expect(detail.entries[0]).toMatchObject({ difficulty: 'High', functionPoints: 60 })
        expect(repository.createFunctionEntry).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'High', functionPoints: 60 })
        )
      })

      it('DET=1・FTR/RET=0 の最小入力を許可する', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.getSettings.mockReturnValue(createTestSettings())
        repository.listFunctionEntries.mockReturnValue([
          {
            id: '11111111-1111-4111-8111-111111111111',
            projectId: 'project-1',
            name: '最小入力',
            functionType: 'EI',
            det: 1,
            referenceCount: 0,
            difficulty: 'Low',
            functionPoints: 3,
            note: '',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z'
          }
        ])

        const service = createStudioService(repository)

        expect(
          service.createFunctionEntry({
            projectId: 'project-1',
            name: '最小入力',
            functionType: 'EI',
            det: 1,
            referenceCount: 0,
            note: ''
          }).entries[0]
        ).toMatchObject({
          name: '最小入力',
          det: 1,
          referenceCount: 0,
          difficulty: 'Low',
          functionPoints: 3
        })
      })

      it('存在しないプロジェクトへの追加はエラーになる', () => {
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

      it('空の機能名では追加できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.getSettings.mockReturnValue(createTestSettings())

        const service = createStudioService(repository)

        expect(() =>
          service.createFunctionEntry({
            projectId: 'project-1',
            name: '   ',
            functionType: 'EI',
            det: 4,
            referenceCount: 1,
            note: ''
          })
        ).toThrow('機能名は必須です。')
      })

      it('DET は1以上の整数が必要で、0以下はエラーになる', () => {
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
      })

      it('FTR/RET は0以上の整数が必要で、負値はエラーになる', () => {
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
            det: 4,
            referenceCount: -1,
            note: ''
          })
        ).toThrow('FTR/RETは0以上の整数で入力してください。')
      })
    })

    describe('更新', () => {
      it('DET・FTR/RETから難易度とFPを再計算して集計済み詳細を返す', () => {
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

      it('カスタム難易度ルールと重みで再計算する', () => {
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
              functionType: 'EI',
              det: 4,
              referenceCount: 1,
              difficulty: 'High',
              functionPoints: 60,
              note: '更新',
              createdAt: '2025-12-31T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z'
            }
          ])
        repository.getSettings.mockReturnValue(
          createTestSettings({
            difficultyRules: DEFAULT_STUDIO_SETTINGS.difficultyRules.map((rule) =>
              rule.functionType === 'EI'
                ? { functionType: 'EI', det: [1, 2], reference: [0, 0] }
                : rule
            ),
            weightTable: {
              ...DEFAULT_STUDIO_SETTINGS.weightTable,
              EI: { Low: 30, Average: 40, High: 60 }
            }
          })
        )

        const service = createStudioService(repository)

        const detail = service.updateFunctionEntry({
          projectId: 'project-1',
          entryId: 'entry-1',
          name: '更新後',
          functionType: 'EI',
          det: 4,
          referenceCount: 1,
          note: '更新'
        })

        expect(detail.entries[0]).toMatchObject({ difficulty: 'High', functionPoints: 60 })
        expect(repository.updateFunctionEntry).toHaveBeenCalledWith(
          expect.objectContaining({ difficulty: 'High', functionPoints: 60 })
        )
      })

      it('DET=1・FTR/RET=0 の最小入力を許可する', () => {
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
              name: '最小更新',
              functionType: 'EI',
              det: 1,
              referenceCount: 0,
              difficulty: 'Low',
              functionPoints: 3,
              note: '',
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
            name: '最小更新',
            functionType: 'EI',
            det: 1,
            referenceCount: 0,
            note: ''
          }).entries[0]
        ).toMatchObject({
          name: '最小更新',
          det: 1,
          referenceCount: 0,
          difficulty: 'Low',
          functionPoints: 3
        })
      })

      it('存在しないプロジェクトの機能は更新できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(() =>
          service.updateFunctionEntry({
            projectId: 'missing',
            entryId: 'entry-1',
            name: '更新後',
            functionType: 'EO',
            det: 20,
            referenceCount: 4,
            note: ''
          })
        ).toThrow('対象プロジェクトが見つかりません。')
      })

      it('存在しない機能は更新できない（エントリが0件の場合）', () => {
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

      it('entryId が一致しない機能は更新できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([
          {
            id: 'another-entry',
            projectId: 'project-1',
            name: '既存機能',
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

        const service = createStudioService(repository)

        expect(() =>
          service.updateFunctionEntry({
            projectId: 'project-1',
            entryId: 'entry-1',
            name: '更新後',
            functionType: 'EO',
            det: 20,
            referenceCount: 4,
            note: ''
          })
        ).toThrow('更新対象の機能が見つかりません。')
      })

      it('空の機能名では更新できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([
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
        repository.getSettings.mockReturnValue(createTestSettings())

        const service = createStudioService(repository)

        expect(() =>
          service.updateFunctionEntry({
            projectId: 'project-1',
            entryId: 'entry-1',
            name: '   ',
            functionType: 'EI',
            det: 4,
            referenceCount: 1,
            note: ''
          })
        ).toThrow('機能名は必須です。')
      })

      it('DET は1以上の整数が必要で、0以下はエラーになる', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([
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
        repository.getSettings.mockReturnValue(createTestSettings())

        const service = createStudioService(repository)

        expect(() =>
          service.updateFunctionEntry({
            projectId: 'project-1',
            entryId: 'entry-1',
            name: '更新後',
            functionType: 'EI',
            det: 0,
            referenceCount: 1,
            note: ''
          })
        ).toThrow('DETは1以上の整数で入力してください。')
      })

      it('FTR/RET は0以上の整数が必要で、負値はエラーになる', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([
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
        repository.getSettings.mockReturnValue(createTestSettings())

        const service = createStudioService(repository)

        expect(() =>
          service.updateFunctionEntry({
            projectId: 'project-1',
            entryId: 'entry-1',
            name: '更新後',
            functionType: 'EI',
            det: 1,
            referenceCount: -1,
            note: ''
          })
        ).toThrow('FTR/RETは0以上の整数で入力してください。')
      })
    })

    describe('削除', () => {
      it('機能を削除すると集計が更新された詳細を返す', () => {
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

        expect(service.deleteFunctionEntry({ projectId: 'project-1', entryId: 'entry-1' })).toEqual(
          {
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
          }
        )
        expect(repository.deleteFunctionEntry).toHaveBeenCalledWith('entry-1')
      })

      it('存在しないプロジェクトの機能は削除できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(() =>
          service.deleteFunctionEntry({ projectId: 'missing', entryId: 'entry-1' })
        ).toThrow('対象プロジェクトが見つかりません。')
      })

      it('存在しない機能は削除できない（エントリが0件の場合）', () => {
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

      it('entryId が一致しない機能は削除できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue({
          id: 'project-1',
          name: '案件A',
          description: '',
          createdAt: '2025-12-31T00:00:00.000Z',
          updatedAt: '2025-12-31T00:00:00.000Z',
          productivity: 1
        })
        repository.listFunctionEntries.mockReturnValue([
          {
            id: 'another-entry',
            projectId: 'project-1',
            name: '削除対象外',
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

        const service = createStudioService(repository)

        expect(() =>
          service.deleteFunctionEntry({ projectId: 'project-1', entryId: 'entry-1' })
        ).toThrow('削除対象の機能が見つかりません。')
      })
    })
  })

  describe('生産性設定管理', () => {
    describe('プロジェクト生産性', () => {
      it('小数第2位に丸めて更新できる', () => {
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

      it('存在しないプロジェクトの生産性は更新できない', () => {
        const repository = createRepositoryMock()
        repository.getProject.mockReturnValue(null)

        const service = createStudioService(repository)

        expect(() =>
          service.updateProjectProductivity({ projectId: 'missing', productivity: 1.5 })
        ).toThrow('対象プロジェクトが見つかりません。')
      })

      it('0以下や無限大は設定できない', () => {
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
          service.updateProjectProductivity({
            projectId: 'project-1',
            productivity: Number.POSITIVE_INFINITY
          })
        ).toThrow('生産性は0より大きい数値で入力してください。')
        expect(() =>
          service.updateProjectProductivity({ projectId: 'project-1', productivity: 0 })
        ).toThrow('生産性は0より大きい数値で入力してください。')
      })
    })

    describe('デフォルト生産性', () => {
      it('小数第2位に丸めて更新できる', () => {
        const repository = createRepositoryMock()
        repository.getSettings.mockReturnValue(createTestSettings({ defaultProductivity: 1.23 }))

        const service = createStudioService(repository)
        const baseline = createTestSettings({ defaultProductivity: 1.23 })

        expect(service.getSettings()).toEqual(baseline)
        expect(service.updateSettings({ defaultProductivity: 1.234 })).toEqual(baseline)
        expect(repository.setDefaultProductivity).toHaveBeenCalledWith(1.23)
      })

      it('0やNaNは設定できない', () => {
        const service = createStudioService(createRepositoryMock())

        expect(() => service.updateSettings({ defaultProductivity: 0 })).toThrow(
          '生産性は0より大きい数値で入力してください。'
        )
        expect(() => service.updateSettings({ defaultProductivity: Number.NaN })).toThrow(
          '生産性は0より大きい数値で入力してください。'
        )
      })
    })
  })
})
