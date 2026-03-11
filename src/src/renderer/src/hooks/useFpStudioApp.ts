import { useCallback, useEffect, useState } from 'react'

import type { ProjectDetail, ProjectSummary, StudioSettings } from '@shared/fp'

import { useFunctionEntryForm } from './useFunctionEntryForm'
import { useProjectForm } from './useProjectForm'
import { useSettingsForm } from './useSettingsForm'

interface UseFpStudioAppResult {
  projects: ProjectSummary[]
  selectedProject: ProjectDetail | null
  selectedProjectId: string | null
  settings: StudioSettings
  projectForm: ReturnType<typeof useProjectForm>
  entryForm: ReturnType<typeof useFunctionEntryForm>
  settingsForm: ReturnType<typeof useSettingsForm>
  isLoading: boolean
  isBusy: boolean
  errorMessage: string | null
  actions: {
    createProject: () => void
    selectProject: (projectId: string) => void
    deleteProject: (projectId: string) => void
    createFunctionEntry: () => void
    deleteFunctionEntry: (entryId: string) => void
    updateSettings: () => void
  }
}

const defaultSettings: StudioSettings = {
  defaultProductivity: 1
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '予期しないエラーが発生しました。'
}

export function useFpStudioApp(): UseFpStudioAppResult {
  const projectForm = useProjectForm()
  const entryForm = useFunctionEntryForm()
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null)
  const [settings, setSettings] = useState<StudioSettings>(defaultSettings)
  const settingsForm = useSettingsForm(defaultSettings.defaultProductivity)
  const resetSettingsForm = settingsForm.reset
  const settingsFormValue = settingsForm.defaultProductivity
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadProjectDetail = useCallback(async (projectId: string | null) => {
    if (!projectId) {
      setSelectedProject(null)
      return
    }

    const detail = await window.fpStudio.getProject({ projectId })
    setSelectedProject(detail)
  }, [])

  const refreshProjects = useCallback(
    async (preferredProjectId?: string | null) => {
      const nextProjects = await window.fpStudio.listProjects()
      setProjects(nextProjects)

      const fallbackProjectId = preferredProjectId ?? selectedProjectId
      const nextSelectedProjectId = nextProjects.some((project) => project.id === fallbackProjectId)
        ? (fallbackProjectId ?? null)
        : (nextProjects[0]?.id ?? null)

      setSelectedProjectId(nextSelectedProjectId)
      await loadProjectDetail(nextSelectedProjectId)
    },
    [loadProjectDetail, selectedProjectId]
  )

  const initialize = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [nextSettings, nextProjects] = await Promise.all([
        window.fpStudio.getSettings(),
        window.fpStudio.listProjects()
      ])

      setSettings(nextSettings)
      resetSettingsForm(nextSettings.defaultProductivity)
      setProjects(nextProjects)

      const firstProjectId = nextProjects[0]?.id ?? null
      setSelectedProjectId(firstProjectId)
      await loadProjectDetail(firstProjectId)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [loadProjectDetail, resetSettingsForm])

  useEffect(() => {
    void initialize()
  }, [initialize])

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setIsBusy(true)
    setErrorMessage(null)

    try {
      await action()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }, [])

  const createProject = useCallback(() => {
    void runAction(async () => {
      const detail = await window.fpStudio.createProject(projectForm.values)
      projectForm.reset()
      setSelectedProject(detail)
      setSelectedProjectId(detail.id)
      await refreshProjects(detail.id)
    })
  }, [projectForm, refreshProjects, runAction])

  const selectProject = useCallback(
    (projectId: string) => {
      void runAction(async () => {
        setSelectedProjectId(projectId)
        await loadProjectDetail(projectId)
      })
    },
    [loadProjectDetail, runAction]
  )

  const deleteProject = useCallback(
    (projectId: string) => {
      void runAction(async () => {
        await window.fpStudio.deleteProject({ projectId })
        const remainingProjects = projects.filter((project) => project.id !== projectId)
        const nextSelectedProjectId =
          selectedProjectId === projectId ? (remainingProjects[0]?.id ?? null) : selectedProjectId
        await refreshProjects(nextSelectedProjectId)
      })
    },
    [projects, refreshProjects, runAction, selectedProjectId]
  )

  const createFunctionEntry = useCallback(() => {
    if (!selectedProjectId) {
      return
    }

    void runAction(async () => {
      const detail = await window.fpStudio.createFunctionEntry({
        projectId: selectedProjectId,
        name: entryForm.values.name,
        functionType: entryForm.values.functionType,
        det: Number(entryForm.values.det),
        referenceCount: Number(entryForm.values.referenceCount),
        note: entryForm.values.note
      })

      entryForm.reset()
      setSelectedProject(detail)
      await refreshProjects(selectedProjectId)
    })
  }, [entryForm, refreshProjects, runAction, selectedProjectId])

  const deleteFunctionEntry = useCallback(
    (entryId: string) => {
      if (!selectedProjectId) {
        return
      }

      void runAction(async () => {
        const detail = await window.fpStudio.deleteFunctionEntry({
          projectId: selectedProjectId,
          entryId
        })

        setSelectedProject(detail)
        await refreshProjects(selectedProjectId)
      })
    },
    [refreshProjects, runAction, selectedProjectId]
  )

  const updateSettings = useCallback(() => {
    void runAction(async () => {
      const nextSettings = await window.fpStudio.updateSettings({
        defaultProductivity: Number(settingsFormValue)
      })

      setSettings(nextSettings)
      resetSettingsForm(nextSettings.defaultProductivity)
      await refreshProjects(selectedProjectId)
    })
  }, [refreshProjects, resetSettingsForm, runAction, selectedProjectId, settingsFormValue])

  return {
    projects,
    selectedProject,
    selectedProjectId,
    settings,
    projectForm,
    entryForm,
    settingsForm,
    isLoading,
    isBusy,
    errorMessage,
    actions: {
      createProject,
      selectProject,
      deleteProject,
      createFunctionEntry,
      deleteFunctionEntry,
      updateSettings
    }
  }
}
