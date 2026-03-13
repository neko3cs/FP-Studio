export const FUNCTION_TYPES = ['EI', 'EO', 'EQ', 'ILF', 'EIF'] as const
export const COMPLEXITY_LEVELS = ['Low', 'Average', 'High'] as const

export type FunctionType = (typeof FUNCTION_TYPES)[number]
export type ComplexityLevel = (typeof COMPLEXITY_LEVELS)[number]

export interface StudioSettings {
  defaultProductivity: number
}

export interface ProjectTotals {
  functionCount: number
  totalFunctionPoints: number
  estimatedEffortDays: number
}

export interface FunctionEntry {
  id: string
  projectId: string
  name: string
  functionType: FunctionType
  det: number
  referenceCount: number
  difficulty: ComplexityLevel
  functionPoints: number
  note: string
  createdAt: string
  updatedAt: string
}

export interface ProjectSummary extends ProjectTotals {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
  productivity: number
}

export interface ProjectDetail extends ProjectSummary {
  entries: FunctionEntry[]
}

export interface CreateProjectInput {
  name: string
  description: string
}

export interface DeleteProjectInput {
  projectId: string
}

export interface GetProjectInput {
  projectId: string
}

export interface CreateFunctionEntryInput {
  projectId: string
  name: string
  functionType: FunctionType
  det: number
  referenceCount: number
  note: string
}

export interface UpdateFunctionEntryInput extends CreateFunctionEntryInput {
  entryId: string
}

export interface DeleteFunctionEntryInput {
  projectId: string
  entryId: string
}

export interface UpdateSettingsInput {
  defaultProductivity: number
}

export interface UpdateProjectProductivityInput {
  projectId: string
  productivity: number
}

export interface FunctionPointAnalysis {
  difficulty: ComplexityLevel
  functionPoints: number
}

const WEIGHT_TABLE: Record<FunctionType, Record<ComplexityLevel, number>> = {
  EI: { Low: 3, Average: 4, High: 6 },
  EO: { Low: 4, Average: 5, High: 7 },
  EQ: { Low: 3, Average: 4, High: 6 },
  ILF: { Low: 7, Average: 10, High: 15 },
  EIF: { Low: 5, Average: 7, High: 10 }
}

const COMPLEXITY_MATRIX: Record<FunctionType, readonly (readonly ComplexityLevel[])[]> = {
  EI: [
    ['Low', 'Low', 'Average'],
    ['Low', 'Average', 'High'],
    ['Average', 'High', 'High']
  ],
  EO: [
    ['Low', 'Low', 'Average'],
    ['Low', 'Average', 'High'],
    ['Average', 'High', 'High']
  ],
  EQ: [
    ['Low', 'Low', 'Average'],
    ['Low', 'Average', 'High'],
    ['Average', 'High', 'High']
  ],
  ILF: [
    ['Low', 'Low', 'Average'],
    ['Low', 'Average', 'High'],
    ['Average', 'High', 'High']
  ],
  EIF: [
    ['Low', 'Low', 'Average'],
    ['Low', 'Average', 'High'],
    ['Average', 'High', 'High']
  ]
}

const TRANSACTIONAL_DET_BUCKETS: Record<
  Extract<FunctionType, 'EI' | 'EO' | 'EQ'>,
  readonly [number, number]
> = {
  EI: [5, 16],
  EO: [6, 20],
  EQ: [6, 20]
}

const DATA_DET_BUCKETS: readonly [number, number] = [20, 51]

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100
}

export function isDataFunction(functionType: FunctionType): boolean {
  return functionType === 'ILF' || functionType === 'EIF'
}

export function getReferenceLabel(functionType: FunctionType): 'FTR' | 'RET' {
  return isDataFunction(functionType) ? 'RET' : 'FTR'
}

function getDetBucket(functionType: FunctionType, det: number): number {
  if (isDataFunction(functionType)) {
    if (det < DATA_DET_BUCKETS[0]) {
      return 0
    }

    if (det < DATA_DET_BUCKETS[1]) {
      return 1
    }

    return 2
  }

  const [mediumStart, highStart] = TRANSACTIONAL_DET_BUCKETS[functionType]

  if (det < mediumStart) {
    return 0
  }

  if (det < highStart) {
    return 1
  }

  return 2
}

function getReferenceBucket(functionType: FunctionType, referenceCount: number): number {
  if (isDataFunction(functionType)) {
    if (referenceCount <= 1) {
      return 0
    }

    if (referenceCount <= 5) {
      return 1
    }

    return 2
  }

  if (functionType === 'EI') {
    if (referenceCount <= 1) {
      return 0
    }

    if (referenceCount === 2) {
      return 1
    }

    return 2
  }

  if (referenceCount <= 1) {
    return 0
  }

  if (referenceCount <= 3) {
    return 1
  }

  return 2
}

export function analyzeFunctionPoint(
  functionType: FunctionType,
  det: number,
  referenceCount: number
): FunctionPointAnalysis {
  const detBucket = getDetBucket(functionType, det)
  const referenceBucket = getReferenceBucket(functionType, referenceCount)
  const difficulty = COMPLEXITY_MATRIX[functionType][referenceBucket][detBucket]

  return {
    difficulty,
    functionPoints: WEIGHT_TABLE[functionType][difficulty]
  }
}

export function buildProjectTotals(entries: FunctionEntry[], productivity: number): ProjectTotals {
  const totalFunctionPoints = entries.reduce((total, entry) => total + entry.functionPoints, 0)

  return {
    functionCount: entries.length,
    totalFunctionPoints,
    estimatedEffortDays: roundToTwoDecimals(totalFunctionPoints * productivity)
  }
}

export function buildProjectSummary(
  project: Pick<ProjectDetail, 'id' | 'name' | 'description' | 'createdAt' | 'updatedAt'> & {
    productivity: number
  },
  entries: FunctionEntry[]
): ProjectSummary {
  return {
    ...project,
    ...buildProjectTotals(entries, project.productivity)
  }
}
