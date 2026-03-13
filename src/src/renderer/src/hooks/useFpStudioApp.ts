import { useCallback, useEffect, useState } from 'react'

import type { FunctionEntry, ProjectDetail, ProjectSummary } from '@shared/fp'
import type { UpdateState } from '@shared/ipc'

import { useFunctionEntryForm } from './useFunctionEntryForm'
import { useProjectForm } from './useProjectForm'
import { useProjectProductivityForm } from './useProjectProductivityForm'

interface UseFpStudioAppResult {
  projects: ProjectSummary[]
  selectedProject: ProjectDetail | null
  selectedProjectId: string | null
  projectForm: ReturnType<typeof useProjectForm>
  entryForm: ReturnType<typeof useFunctionEntryForm>
  projectProductivityForm: ReturnType<typeof useProjectProductivityForm>
  isLoading: boolean
  isBusy: boolean
  errorMessage: string | null
  updateState: UpdateState
  updateActions: {
    checkForUpdates: () => void
    installUpdate: () => void
  }
  actions: {
    createProject: () => void
    selectProject: (projectId: string) => void
    deleteProject: (projectId: string) => void
    submitFunctionEntry: () => void
    startEditingFunctionEntry: (entry: FunctionEntry) => void
    cancelEditingFunctionEntry: () => void
    deleteFunctionEntry: (entryId: string) => void
    updateProjectProductivity: () => void
  }
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
  const projectProductivityForm = useProjectProductivityForm(1)
  const { productivity: projectProductivityValue, reset: resetProjectProductivity } =
    projectProductivityForm
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [updateState, setUpdateState] = useState<UpdateState>({
    status: 'idle',
    message: 'アップデート状態を確認しています…'
  })

  const loadProjectDetail = useCallback(
    async (projectId: string | null) => {
      if (!projectId) {
        setSelectedProject(null)
        return
      }

      const detail = await window.fpStudio.getProject({ projectId })
      setSelectedProject(detail)

      if (detail) {
        resetProjectProductivity(detail.productivity)
      }
    },
    [resetProjectProductivity]
  )

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
      const nextProjects = await window.fpStudio.listProjects()
      setProjects(nextProjects)

      const firstProjectId = nextProjects[0]?.id ?? null
      setSelectedProjectId(firstProjectId)
      await loadProjectDetail(firstProjectId)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [loadProjectDetail])

  useEffect(() => {
    void initialize()
  }, [initialize])

  useEffect(() => {
    const unsubscribe = window.fpStudio.subscribeToUpdateState((state) => {
      setUpdateState(state)
    })

    let isMounted = true
    void window.fpStudio.getUpdateState().then((state) => {
      if (isMounted) {
        setUpdateState(state)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

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
      entryForm.reset()
      setSelectedProject(detail)
      setSelectedProjectId(detail.id)
      await refreshProjects(detail.id)
    })
  }, [entryForm, projectForm, refreshProjects, runAction])

  const selectProject = useCallback(
    (projectId: string) => {
      void runAction(async () => {
        entryForm.reset()
        setSelectedProjectId(projectId)
        await loadProjectDetail(projectId)
      })
    },
    [entryForm, loadProjectDetail, runAction]
  )

  const deleteProject = useCallback(
    (projectId: string) => {
      void runAction(async () => {
        await window.fpStudio.deleteProject({ projectId })
        const remainingProjects = projects.filter((project) => project.id !== projectId)
        const nextSelectedProjectId =
          selectedProjectId === projectId ? (remainingProjects[0]?.id ?? null) : selectedProjectId
        entryForm.reset()
        await refreshProjects(nextSelectedProjectId)
      })
    },
    [entryForm, projects, refreshProjects, runAction, selectedProjectId]
  )

  const submitFunctionEntry = useCallback(() => {
    if (!selectedProjectId) {
      return
    }

    void runAction(async () => {
      const input = {
        projectId: selectedProjectId,
        name: entryForm.values.name,
        functionType: entryForm.values.functionType,
        det: Number(entryForm.values.det),
        referenceCount: Number(entryForm.values.referenceCount),
        note: entryForm.values.note
      }
      const detail = entryForm.editingEntryId
        ? await window.fpStudio.updateFunctionEntry({
            entryId: entryForm.editingEntryId,
            ...input
          })
        : await window.fpStudio.createFunctionEntry(input)

      entryForm.reset()
      setSelectedProject(detail)
      await refreshProjects(selectedProjectId)
    })
  }, [entryForm, refreshProjects, runAction, selectedProjectId])

  const startEditingFunctionEntry = useCallback(
    (entry: FunctionEntry) => {
      entryForm.startEditing(entry)
    },
    [entryForm]
  )

  const cancelEditingFunctionEntry = useCallback(() => {
    entryForm.cancelEditing()
  }, [entryForm])

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

        if (entryForm.editingEntryId === entryId) {
          entryForm.reset()
        }
        setSelectedProject(detail)
        await refreshProjects(selectedProjectId)
      })
    },
    [entryForm, refreshProjects, runAction, selectedProjectId]
  )

  const updateProjectProductivity = useCallback(() => {
    if (!selectedProjectId) {
      return
    }

    void runAction(async () => {
      const detail = await window.fpStudio.updateProjectProductivity({
        projectId: selectedProjectId,
        productivity: Number(projectProductivityValue)
      })

      setSelectedProject(detail)
      resetProjectProductivity(detail.productivity)
      await refreshProjects(selectedProjectId)
    })
  }, [
    projectProductivityValue,
    refreshProjects,
    runAction,
    resetProjectProductivity,
    selectedProjectId
  ])

  const checkForUpdates = useCallback(() => {
    void window.fpStudio.checkForUpdates()
  }, [])

  const installUpdate = useCallback(() => {
    void window.fpStudio.installUpdate()
  }, [])

  return {
    projects,
    selectedProject,
    selectedProjectId,
    projectForm,
    entryForm,
    projectProductivityForm,
    isLoading,
    isBusy,
    errorMessage,
    updateState,
    updateActions: {
      checkForUpdates,
      installUpdate
    },
    actions: {
      createProject,
      selectProject,
      deleteProject,
      submitFunctionEntry,
      startEditingFunctionEntry,
      cancelEditingFunctionEntry,
      deleteFunctionEntry,
      updateProjectProductivity
    }
  }
}
