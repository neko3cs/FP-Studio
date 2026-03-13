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

export const WEIGHT_TABLE: Record<FunctionType, Record<ComplexityLevel, number>> = {
  EI: { Low: 3, Average: 4, High: 6 },
  EO: { Low: 4, Average: 5, High: 7 },
  EQ: { Low: 3, Average: 4, High: 6 },
  ILF: { Low: 7, Average: 10, High: 15 },
  EIF: { Low: 5, Average: 7, High: 10 }
}

export interface DifficultyRule {
  functionType: FunctionType
  det: readonly [number, number]
  reference: readonly [number, number]
}

export const DIFFICULTY_RULES: readonly DifficultyRule[] = [
  { functionType: 'EI', det: [5, 16], reference: [1, 2] },
  { functionType: 'EO', det: [6, 20], reference: [1, 3] },
  { functionType: 'EQ', det: [6, 20], reference: [1, 3] },
  { functionType: 'ILF', det: [20, 51], reference: [1, 5] },
  { functionType: 'EIF', det: [20, 51], reference: [1, 5] }
] as const

export const DIFFICULTY_RULES_BY_TYPE: Record<FunctionType, DifficultyRule> =
  DIFFICULTY_RULES.reduce<Record<FunctionType, DifficultyRule>>((acc, rule) => {
    acc[rule.functionType] = rule
    return acc
  }, {} as Record<FunctionType, DifficultyRule>)

export const DIFFICULTY_MATRIX: Record<FunctionType, readonly (readonly ComplexityLevel[])[]> = {
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
  const [mediumStart, highStart] = DIFFICULTY_RULES_BY_TYPE[functionType].det

  if (det < mediumStart) {
    return 0
  }

  if (det < highStart) {
    return 1
  }

  return 2
}

function getReferenceBucket(functionType: FunctionType, referenceCount: number): number {
  const [lowThreshold, highThreshold] = DIFFICULTY_RULES_BY_TYPE[functionType].reference

  if (referenceCount <= lowThreshold) {
    return 0
  }

  if (referenceCount <= highThreshold) {
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
  const difficulty = DIFFICULTY_MATRIX[functionType][referenceBucket][detBucket]

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
