import { describe, expect, it } from 'vitest'

import type { CellFormulaValue } from 'exceljs'

import type { FunctionEntry, FunctionType, ProjectDetail } from '@shared/fp'
import { DIFFICULTY_RULES, FUNCTION_TYPES, WEIGHT_TABLE, analyzeFunctionPoint } from '@shared/fp'

import { buildDefaultExportFileName, buildProjectWorkbook } from './project-excel'

function makeEntry(
  id: string,
  functionType: FunctionType,
  det: number,
  referenceCount: number,
  overrides: Partial<FunctionEntry> = {}
): FunctionEntry {
  const { difficulty, functionPoints } = analyzeFunctionPoint(functionType, det, referenceCount)
  return {
    id,
    projectId: 'project-1',
    name: `機能-${id}`,
    functionType,
    det,
    referenceCount,
    difficulty,
    functionPoints,
    note: '',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  }
}

function makeProject(
  entries: FunctionEntry[],
  overrides: Partial<ProjectDetail> = {}
): ProjectDetail {
  const totalFunctionPoints = entries.reduce((sum, entry) => sum + entry.functionPoints, 0)
  const productivity = overrides.productivity ?? 1.5
  return {
    id: 'project-1',
    name: '販売管理システム',
    description: '受注から請求までの見積',
    productivity,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    functionCount: entries.length,
    totalFunctionPoints,
    estimatedEffortDays: Number((totalFunctionPoints * productivity).toFixed(2)),
    entries,
    ...overrides
  }
}

function formulaCell(value: unknown): CellFormulaValue {
  return value as CellFormulaValue
}

describe('Excelエクスポート', () => {
  describe('既定のエクスポートファイル名の組み立て', () => {
    it('プロジェクト名にISO日付を付けて.xlsx名を返す', () => {
      const fileName = buildDefaultExportFileName('販売管理')
      expect(fileName).toMatch(/^販売管理-\d{4}-\d{2}-\d{2}\.xlsx$/)
    })

    it('ファイル名に使えない文字はアンダースコアへ置き換える', () => {
      const fileName = buildDefaultExportFileName('見積<>:"/\\|?*版')
      expect(fileName.startsWith('見積_________版')).toBe(true)
      expect(fileName.endsWith('.xlsx')).toBe(true)
    })

    it('連続する空白は1つにまとめ、前後の空白は除去する', () => {
      const fileName = buildDefaultExportFileName('  受注   管理  ')
      expect(fileName).toMatch(/^受注 管理-\d{4}-\d{2}-\d{2}\.xlsx$/)
    })

    it('名前が空または空白のみのときは project にフォールバックする', () => {
      expect(buildDefaultExportFileName('   ').startsWith('project-')).toBe(true)
      expect(buildDefaultExportFileName('').startsWith('project-')).toBe(true)
    })
  })

  describe('プロジェクトワークブックの構築', () => {
    it('Summary・Function Entries・Weights・Difficulty Rules の4シートを作る', () => {
      const workbook = buildProjectWorkbook(makeProject([makeEntry('1', 'EI', 5, 2)]))
      expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
        'Summary',
        'Function Entries',
        'Weights',
        'Difficulty Rules'
      ])
    })

    it('Summaryシートにプロジェクト名・説明・生産性と合計/工数の数式を書き込む', () => {
      const entries = [makeEntry('1', 'EI', 12, 2), makeEntry('2', 'ILF', 30, 3)]
      const project = makeProject(entries, { productivity: 1.25 })
      const summary = buildProjectWorkbook(project).getWorksheet('Summary')!

      expect(summary.getCell('A1').value).toBe('プロジェクト名')
      expect(summary.getCell('B1').value).toBe('販売管理システム')
      expect(summary.getCell('B2').value).toBe('受注から請求までの見積')
      expect(summary.getCell('B3').value).toBe(1.25)

      const totalFp = formulaCell(summary.getCell('B4').value)
      expect(totalFp.formula).toBe("SUM('Function Entries'!H2:H1048576)")
      expect(totalFp.result).toBe(project.totalFunctionPoints)

      const effort = formulaCell(summary.getCell('B5').value)
      expect(effort.formula).toBe('B4 * B3')
      expect(effort.result).toBe(project.estimatedEffortDays)
    })

    it('説明が空のプロジェクトでは説明セルを空文字にする', () => {
      const summary = buildProjectWorkbook(
        makeProject([makeEntry('1', 'EI', 5, 2)], { description: '' })
      ).getWorksheet('Summary')!

      expect(summary.getCell('B2').value).toBe('')
    })

    it('機能行の難易度・重み・FP・工数の結果値が analyzeFunctionPoint と一致する', () => {
      const entries = [
        makeEntry('1', 'EI', 12, 2),
        makeEntry('2', 'EO', 20, 4),
        makeEntry('3', 'ILF', 30, 3)
      ]
      const project = makeProject(entries, { productivity: 2 })
      const sheet = buildProjectWorkbook(project).getWorksheet('Function Entries')!

      entries.forEach((entry, index) => {
        const rowNumber = index + 2
        const expected = analyzeFunctionPoint(entry.functionType, entry.det, entry.referenceCount)

        expect(formulaCell(sheet.getCell(`F${rowNumber}`).value).result).toBe(expected.difficulty)
        expect(formulaCell(sheet.getCell(`G${rowNumber}`).value).result).toBe(
          WEIGHT_TABLE[entry.functionType][expected.difficulty]
        )
        expect(formulaCell(sheet.getCell(`H${rowNumber}`).value).result).toBe(
          expected.functionPoints
        )
        expect(formulaCell(sheet.getCell(`J${rowNumber}`).value).result).toBe(
          Number((expected.functionPoints * project.productivity).toFixed(2))
        )
      })
    })

    it('難易度判定の数式はDETに厳密比較(<)を使い、fp.tsのバケット境界と一致する', () => {
      // fp.ts の getDetBucket は det < det[0] を境界に使う（境界値は次バケットの開始）。
      // Excelの再計算(fullCalcOnLoad)でも同じ難易度になるよう <= ではなく < を使う。
      const sheet = buildProjectWorkbook(makeProject([makeEntry('1', 'EI', 5, 2)])).getWorksheet(
        'Function Entries'
      )!

      const formula = formulaCell(sheet.getCell('F2').value).formula
      expect(formula).toContain('det<INDEX(')
      expect(formula).not.toContain('det<=')
      // 参照(FTR/RET)側は fp.ts が ref <= 閾値 のため <= のまま
      expect(formula).toContain('ref<=INDEX(')
    })

    it('難易度・重み・工数の数式が厳密なセル参照とレンジで生成される（同期ガード）', () => {
      const sheet = buildProjectWorkbook(makeProject([makeEntry('1', 'EI', 5, 2)])).getWorksheet(
        'Function Entries'
      )!

      // 重み: Weights シート（$A$2:$A$6 / $B$2:$D$6 / $B$1:$D$1）を INDEX/MATCH で参照
      expect(formulaCell(sheet.getCell('G2').value).formula).toBe(
        "INDEX('Weights'!$B$2:$D$6, MATCH(C2, 'Weights'!$A$2:$A$6, 0), MATCH(F2, 'Weights'!$B$1:$D$1, 0))"
      )

      // 難易度: Difficulty Rules シートの各レンジと 3×3 マトリクスを厳密に固定
      const difficulty = formulaCell(sheet.getCell('F2').value).formula
      expect(difficulty).toContain("MATCH(fnType, 'Difficulty Rules'!$A$2:$A$6, 0)")
      expect(difficulty).toContain("det<INDEX('Difficulty Rules'!$B$2:$B$6, rowIndex)")
      expect(difficulty).toContain("det<INDEX('Difficulty Rules'!$C$2:$C$6, rowIndex)")
      expect(difficulty).toContain("ref<=INDEX('Difficulty Rules'!$D$2:$D$6, rowIndex)")
      expect(difficulty).toContain("ref<=INDEX('Difficulty Rules'!$E$2:$E$6, rowIndex)")
      expect(difficulty).toContain(
        '{"Low","Low","Average";"Low","Average","High";"Average","High","High"}'
      )
      expect(difficulty).toContain('INDEX(matrix, refBucket+1, detBucket+1)')

      // FP・生産性・工数のセル参照
      expect(formulaCell(sheet.getCell('H2').value).formula).toBe('G2')
      expect(formulaCell(sheet.getCell('I2').value).formula).toBe("'Summary'!$B$3")
      expect(formulaCell(sheet.getCell('J2').value).formula).toBe("H2 * 'Summary'!$B$3")
    })

    it('WeightsシートにWEIGHT_TABLEの重みを機能種別ごとに書き出す', () => {
      const sheet = buildProjectWorkbook(makeProject([makeEntry('1', 'EI', 5, 2)])).getWorksheet(
        'Weights'
      )!

      FUNCTION_TYPES.forEach((functionType, index) => {
        const row = sheet.getRow(index + 2)
        expect(row.getCell(1).value).toBe(functionType)
        expect(row.getCell(2).value).toBe(WEIGHT_TABLE[functionType].Low)
        expect(row.getCell(3).value).toBe(WEIGHT_TABLE[functionType].Average)
        expect(row.getCell(4).value).toBe(WEIGHT_TABLE[functionType].High)
      })
    })

    it('Difficulty RulesシートにDIFFICULTY_RULESの閾値を書き出す', () => {
      const sheet = buildProjectWorkbook(makeProject([makeEntry('1', 'EI', 5, 2)])).getWorksheet(
        'Difficulty Rules'
      )!

      DIFFICULTY_RULES.forEach((rule, index) => {
        const row = sheet.getRow(index + 2)
        expect(row.getCell(1).value).toBe(rule.functionType)
        expect(row.getCell(2).value).toBe(rule.det[0])
        expect(row.getCell(3).value).toBe(rule.det[1])
        expect(row.getCell(4).value).toBe(rule.reference[0])
        expect(row.getCell(5).value).toBe(rule.reference[1])
      })
    })

    // specification.md「Excel 出力」: 同梱する値はアプリが算出に使う値と同じもの
    describe('設定に保持された難易度ルールと重みを同梱する', () => {
      const customSettings = {
        difficultyRules: [
          { functionType: 'EI', det: [3, 9], reference: [0, 1] },
          { functionType: 'EO', det: [7, 21], reference: [2, 4] }
        ] as const,
        weightTable: {
          ...WEIGHT_TABLE,
          EI: { Low: 30, Average: 40, High: 60 }
        }
      }

      it('Weights シートに設定の重みを書き出す', () => {
        const sheet = buildProjectWorkbook(makeProject([]), customSettings).getWorksheet('Weights')!

        expect(sheet.getRow(2).values).toEqual([undefined, 'EI', 30, 40, 60])
        expect(sheet.getRow(3).values).toEqual([undefined, 'EO', 4, 5, 7])
      })

      it('Difficulty Rules シートに設定の難易度ルールを書き出し、欠けた Function Type は標準値で補う', () => {
        const sheet = buildProjectWorkbook(makeProject([]), customSettings).getWorksheet(
          'Difficulty Rules'
        )!

        expect(sheet.getRow(2).values).toEqual([undefined, 'EI', 3, 9, 0, 1])
        expect(sheet.getRow(3).values).toEqual([undefined, 'EO', 7, 21, 2, 4])
        expect(sheet.getRow(4).values).toEqual([undefined, 'EQ', 6, 20, 1, 3])
        expect(sheet.getRow(5).values).toEqual([undefined, 'ILF', 20, 51, 1, 5])
        expect(sheet.getRow(6).values).toEqual([undefined, 'EIF', 20, 51, 1, 5])
      })

      it('重みの欠けた項目は標準値で補い、空のセルを作らない', () => {
        const sheet = buildProjectWorkbook(makeProject([]), {
          weightTable: { EI: { Low: 30 } } as never
        }).getWorksheet('Weights')!

        expect(sheet.getRow(2).values).toEqual([undefined, 'EI', 30, 4, 6])
        expect(sheet.getRow(6).values).toEqual([undefined, 'EIF', 5, 7, 10])
      })

      it('重みセルの結果値は設定の重みになる', () => {
        const entry = makeEntry('1', 'EI', 5, 2, { difficulty: 'High', functionPoints: 60 })
        const sheet = buildProjectWorkbook(makeProject([entry]), customSettings).getWorksheet(
          'Function Entries'
        )!

        expect(formulaCell(sheet.getCell('G2').value).result).toBe(60)
      })
    })

    describe('備考', () => {
      it('Function Entries の K 列に見出し「備考」と機能の備考を書き出す', () => {
        const sheet = buildProjectWorkbook(
          makeProject([
            makeEntry('1', 'EI', 5, 2, { note: '画面A-01 の登録処理' }),
            makeEntry('2', 'EO', 5, 2)
          ])
        ).getWorksheet('Function Entries')!

        expect(sheet.getCell('K1').value).toBe('備考')
        expect(sheet.getCell('K2').value).toBe('画面A-01 の登録処理')
        expect(sheet.getCell('K3').value).toBe('')
      })

      it('備考を足しても A〜J 列の見出しは変わらない', () => {
        const sheet = buildProjectWorkbook(makeProject([])).getWorksheet('Function Entries')!

        expect(sheet.getRow(1).values).toEqual([
          undefined,
          'No.',
          '機能名',
          '機能種別',
          'DET',
          'FTR/RET',
          '難易度',
          '重み',
          'FP',
          '生産性（人日/FP）',
          '工数（人日）',
          '備考'
        ])
      })
    })

    it('機能が0件でもシート構成と合計数式を維持する', () => {
      const workbook = buildProjectWorkbook(makeProject([]))
      const summary = workbook.getWorksheet('Summary')!
      expect(formulaCell(summary.getCell('B4').value).formula).toBe(
        "SUM('Function Entries'!H2:H1048576)"
      )
      // ヘッダー行のみ（データ行なし）
      expect(workbook.getWorksheet('Function Entries')!.rowCount).toBe(1)
    })
  })
})
