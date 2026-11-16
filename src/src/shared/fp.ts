export const FUNCTION_TYPES = ['EI', 'EO', 'EQ', 'ILF', 'EIF'] as const
export const COMPLEXITY_LEVELS = ['Low', 'Average', 'High'] as const

export type FunctionType = (typeof FUNCTION_TYPES)[number]
export type ComplexityLevel = (typeof COMPLEXITY_LEVELS)[number]
export type WeightTable = Record<FunctionType, Record<ComplexityLevel, number>>

export interface StudioSettings {
  defaultProductivity: number
  difficultyRules: readonly DifficultyRule[]
  weightTable: WeightTable
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
  defaultProductivity?: number
}

export interface UpdateProjectProductivityInput {
  projectId: string
  productivity: number
}

export interface DuplicateProjectInput {
  projectId: string
}

export interface RenameProjectInput {
  projectId: string
  name: string
}

export interface FunctionPointAnalysis {
  difficulty: ComplexityLevel
  functionPoints: number
}

export interface DifficultyRule {
  functionType: FunctionType
  det: readonly [number, number]
  reference: readonly [number, number]
}

export const DEFAULT_WEIGHT_TABLE: WeightTable = {
  EI: { Low: 3, Average: 4, High: 6 },
  EO: { Low: 4, Average: 5, High: 7 },
  EQ: { Low: 3, Average: 4, High: 6 },
  ILF: { Low: 7, Average: 10, High: 15 },
  EIF: { Low: 5, Average: 7, High: 10 }
}

export const WEIGHT_TABLE = DEFAULT_WEIGHT_TABLE

export const DEFAULT_DIFFICULTY_RULES: readonly DifficultyRule[] = [
  { functionType: 'EI', det: [5, 16], reference: [1, 2] },
  { functionType: 'EO', det: [6, 20], reference: [1, 3] },
  { functionType: 'EQ', det: [6, 20], reference: [1, 3] },
  { functionType: 'ILF', det: [20, 51], reference: [1, 5] },
  { functionType: 'EIF', det: [20, 51], reference: [1, 5] }
] as const

export const DIFFICULTY_RULES = DEFAULT_DIFFICULTY_RULES

function isFiniteNumber(value: unknown): value is number {
  return Number.isFinite(value)
}

function isBounds(value: unknown): value is readonly [number, number] {
  return Array.isArray(value) && value.length === 2 && value.every(isFiniteNumber)
}

function isDifficultyRule(value: unknown): value is DifficultyRule {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const rule = value as Partial<DifficultyRule>

  return (
    FUNCTION_TYPES.includes(rule.functionType as FunctionType) &&
    isBounds(rule.det) &&
    isBounds(rule.reference)
  )
}

/**
 * 算出に使う難易度ルールを、Function Type の順に5件そろえて返す。
 * 一覧でない場合は全体を、欠けている・形が正しくない Function Type はその分だけ IFPUG 標準値にする。
 * 設定は DB から読んだ値で型の保証が無いため、unknown として受ける。
 */
export function resolveDifficultyRules(rules?: unknown): readonly DifficultyRule[] {
  if (!Array.isArray(rules)) {
    return DEFAULT_DIFFICULTY_RULES
  }

  const provided = new Map<FunctionType, DifficultyRule>()

  for (const rule of rules) {
    if (isDifficultyRule(rule)) {
      provided.set(rule.functionType, rule)
    }
  }

  return DEFAULT_DIFFICULTY_RULES.map((defaultRule) => {
    const rule = provided.get(defaultRule.functionType)

    return rule
      ? { functionType: rule.functionType, det: rule.det, reference: rule.reference }
      : defaultRule
  })
}

/**
 * 算出に使う重みを、全 Function Type × 全難易度そろえて返す。
 * 欠けている・数値でない項目はその項目だけ IFPUG 標準値にする。
 */
export function resolveWeightTable(table?: unknown): WeightTable {
  const candidateTable = table as Partial<Record<FunctionType, unknown>> | null | undefined

  return FUNCTION_TYPES.reduce<WeightTable>((acc, type) => {
    const defaultRow = DEFAULT_WEIGHT_TABLE[type]
    const customRow = candidateTable?.[type] as
      Partial<Record<ComplexityLevel, unknown>> | null | undefined

    acc[type] = COMPLEXITY_LEVELS.reduce<Record<ComplexityLevel, number>>(
      (rowAcc, level) => {
        const candidate = customRow?.[level]
        rowAcc[level] = isFiniteNumber(candidate) ? candidate : defaultRow[level]
        return rowAcc
      },
      {} as Record<ComplexityLevel, number>
    )

    return acc
  }, {} as WeightTable)
}

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

export interface AnalyzeFunctionPointOptions {
  difficultyRules?: readonly DifficultyRule[]
  weightTable?: WeightTable
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

function getDetBucket(bounds: readonly [number, number], det: number): number {
  const [mediumStart, highStart] = bounds

  if (det < mediumStart) {
    return 0
  }

  if (det < highStart) {
    return 1
  }

  return 2
}

function getReferenceBucket(bounds: readonly [number, number], referenceCount: number): number {
  const [lowThreshold, highThreshold] = bounds

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
  referenceCount: number,
  options?: AnalyzeFunctionPointOptions
): FunctionPointAnalysis {
  const weightTable = resolveWeightTable(options?.weightTable)
  const rule = resolveDifficultyRules(options?.difficultyRules)[
    FUNCTION_TYPES.indexOf(functionType)
  ]

  const detBucket = getDetBucket(rule.det, det)
  const referenceBucket = getReferenceBucket(rule.reference, referenceCount)
  const difficulty = DIFFICULTY_MATRIX[functionType][referenceBucket][detBucket]

  return {
    difficulty,
    functionPoints: weightTable[functionType][difficulty]
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

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  defaultProductivity: 1,
  difficultyRules: DEFAULT_DIFFICULTY_RULES,
  weightTable: DEFAULT_WEIGHT_TABLE
}
