import ExcelJS from 'exceljs'

import type { AnalyzeFunctionPointOptions, ProjectDetail } from '@shared/fp'
import {
  COMPLEXITY_LEVELS,
  FUNCTION_TYPES,
  resolveDifficultyRules,
  resolveWeightTable
} from '@shared/fp'

const SUMMARY_SHEET_NAME = 'Summary'
const ENTRIES_SHEET_NAME = 'Function Entries'
const WEIGHTS_SHEET_NAME = 'Weights'
const DIFFICULTY_RULES_SHEET_NAME = 'Difficulty Rules'

function quoteSheet(name: string): string {
  return `'${name}'`
}

const ENTRIES_FP_RANGE = `${quoteSheet(ENTRIES_SHEET_NAME)}!H2:H1048576`
const WEIGHTS_START_ROW = 2
const DIFFICULTY_RULES_START_ROW = 2
const DIFFICULTY_RULES_END_ROW = DIFFICULTY_RULES_START_ROW + FUNCTION_TYPES.length - 1

function getWeightFormula(rowNumber: number): string {
  const weightsEndRow = WEIGHTS_START_ROW + FUNCTION_TYPES.length - 1
  return `INDEX(${quoteSheet(WEIGHTS_SHEET_NAME)}!$B$${WEIGHTS_START_ROW}:$D$${weightsEndRow}, MATCH(C${rowNumber}, ${quoteSheet(
    WEIGHTS_SHEET_NAME
  )}!$A$${WEIGHTS_START_ROW}:$A$${weightsEndRow}, 0), MATCH(F${rowNumber}, ${quoteSheet(
    WEIGHTS_SHEET_NAME
  )}!$B$1:$D$1, 0))`
}

function getDifficultyFormula(rowNumber: number): string {
  const typeRange = `${quoteSheet(
    DIFFICULTY_RULES_SHEET_NAME
  )}!$A$${DIFFICULTY_RULES_START_ROW}:$A$${DIFFICULTY_RULES_END_ROW}`
  const detBounds = `${quoteSheet(
    DIFFICULTY_RULES_SHEET_NAME
  )}!$B$${DIFFICULTY_RULES_START_ROW}:$B$${DIFFICULTY_RULES_END_ROW}`
  const detBoundsHigh = `${quoteSheet(
    DIFFICULTY_RULES_SHEET_NAME
  )}!$C$${DIFFICULTY_RULES_START_ROW}:$C$${DIFFICULTY_RULES_END_ROW}`
  const referenceBounds = `${quoteSheet(
    DIFFICULTY_RULES_SHEET_NAME
  )}!$D$${DIFFICULTY_RULES_START_ROW}:$D$${DIFFICULTY_RULES_END_ROW}`
  const referenceBoundsHigh = `${quoteSheet(
    DIFFICULTY_RULES_SHEET_NAME
  )}!$E$${DIFFICULTY_RULES_START_ROW}:$E$${DIFFICULTY_RULES_END_ROW}`

  return `LET(
fnType, C${rowNumber},
det, D${rowNumber},
ref, E${rowNumber},
rowIndex, MATCH(fnType, ${typeRange}, 0),
detBucket, IF(det<INDEX(${detBounds}, rowIndex), 0, IF(det<INDEX(${detBoundsHigh}, rowIndex), 1, 2)),
refBucket, IF(ref<=INDEX(${referenceBounds}, rowIndex), 0, IF(ref<=INDEX(${referenceBoundsHigh}, rowIndex), 1, 2)),
matrix, {"Low","Low","Average";"Low","Average","High";"Average","High","High"},
INDEX(matrix, refBucket+1, detBucket+1)
)`
}

function sanitizeFileName(value: string): string {
  const cleaned = value
    .replace(/[<>:"/\\|?*]/g, '_')
    .split('\0')
    .join('_')
    .trim()
  return cleaned.replace(/\s+/g, ' ')
}

export function buildDefaultExportFileName(projectName: string): string {
  const safeName = sanitizeFileName(projectName) || 'project'
  const date = new Date().toISOString().slice(0, 10)
  return `${safeName}-${date}.xlsx`
}

/**
 * rules には設定に保持された難易度ルールと重みを渡す。
 * 同梱する表は、欠けた項目を IFPUG 標準値で補った後の値（アプリが算出に使う値と同じもの）にする。
 */
export function buildProjectWorkbook(
  project: ProjectDetail,
  rules: AnalyzeFunctionPointOptions = {}
): ExcelJS.Workbook {
  const weightTable = resolveWeightTable(rules.weightTable)
  const difficultyRules = resolveDifficultyRules(rules.difficultyRules)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'FP Studio'
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.calcProperties.fullCalcOnLoad = true

  const summarySheet = workbook.addWorksheet(SUMMARY_SHEET_NAME)
  summarySheet.columns = [{ width: 26 }, { width: 56 }]
  summarySheet.addRow(['プロジェクト名', project.name])
  summarySheet.addRow(['説明', project.description || ''])
  summarySheet.addRow(['生産性（人日/FP）', project.productivity])
  summarySheet.addRow(['合計 FP', null])
  summarySheet.addRow(['合計 工数（人日）', null])

  const totalFpRowNumber = 4
  const effortRowNumber = 5
  summarySheet.getCell(`B${totalFpRowNumber}`).value = {
    formula: `SUM(${ENTRIES_FP_RANGE})`,
    result: project.totalFunctionPoints
  }
  summarySheet.getCell(`B${effortRowNumber}`).value = {
    formula: `B${totalFpRowNumber} * B3`,
    result: project.estimatedEffortDays
  }

  const entriesSheet = workbook.addWorksheet(ENTRIES_SHEET_NAME)
  entriesSheet.columns = [
    { header: 'No.', key: 'index', width: 6 },
    { header: '機能名', key: 'name', width: 32 },
    { header: '機能種別', key: 'functionType', width: 14 },
    { header: 'DET', key: 'det', width: 8 },
    { header: 'FTR/RET', key: 'referenceCount', width: 16 },
    { header: '難易度', key: 'difficulty', width: 13 },
    { header: '重み', key: 'weight', width: 10 },
    { header: 'FP', key: 'functionPoints', width: 10 },
    { header: '生産性（人日/FP）', key: 'productivity', width: 20 },
    { header: '工数（人日）', key: 'effort', width: 16 },
    // 備考は末尾に置く。既存の列を動かすと数式の参照先が変わるため。
    { header: '備考', key: 'note', width: 40 }
  ]
  entriesSheet.getRow(1).font = { bold: true }

  project.entries.forEach((entry, index) => {
    const row = entriesSheet.addRow({
      index: index + 1,
      name: entry.name,
      functionType: entry.functionType,
      det: entry.det,
      referenceCount: entry.referenceCount,
      note: entry.note
    })
    const rowNumber = row.number

    const weightResult = weightTable[entry.functionType][entry.difficulty]
    const productivityResult = project.productivity
    const effortResult = Number((entry.functionPoints * productivityResult).toFixed(2))

    entriesSheet.getCell(`G${rowNumber}`).value = {
      formula: getWeightFormula(rowNumber),
      result: weightResult
    }
    entriesSheet.getCell(`F${rowNumber}`).value = {
      formula: getDifficultyFormula(rowNumber),
      result: entry.difficulty
    }
    entriesSheet.getCell(`H${rowNumber}`).value = {
      formula: `G${rowNumber}`,
      result: entry.functionPoints
    }
    entriesSheet.getCell(`I${rowNumber}`).value = {
      formula: `${quoteSheet(SUMMARY_SHEET_NAME)}!$B$3`,
      result: productivityResult
    }
    entriesSheet.getCell(`J${rowNumber}`).value = {
      formula: `H${rowNumber} * ${quoteSheet(SUMMARY_SHEET_NAME)}!$B$3`,
      result: effortResult
    }
  })

  const weightsSheet = workbook.addWorksheet(WEIGHTS_SHEET_NAME)
  const weightHeaderRow = ['機能種別', ...COMPLEXITY_LEVELS]
  weightsSheet.addRow(weightHeaderRow)
  weightsSheet.getRow(1).font = { bold: true }

  FUNCTION_TYPES.forEach((functionType) => {
    weightsSheet.addRow([
      functionType,
      ...COMPLEXITY_LEVELS.map((level) => weightTable[functionType][level])
    ])
  })

  const difficultySheet = workbook.addWorksheet(DIFFICULTY_RULES_SHEET_NAME)
  difficultySheet.columns = [
    { header: '機能種別', key: 'type', width: 10 },
    { header: 'DET バケット0 最大値', key: 'det0', width: 18 },
    { header: 'DET バケット1 最大値', key: 'det1', width: 18 },
    { header: 'FTR/RET バケット0 最大値', key: 'ref0', width: 18 },
    { header: 'FTR/RET バケット1 最大値', key: 'ref1', width: 18 }
  ]
  difficultySheet.getRow(1).font = { bold: true }
  difficultyRules.forEach((rule) => {
    difficultySheet.addRow([
      rule.functionType,
      rule.det[0],
      rule.det[1],
      rule.reference[0],
      rule.reference[1]
    ])
  })

  return workbook
}
