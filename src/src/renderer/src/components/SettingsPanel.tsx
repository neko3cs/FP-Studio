import {
  Body1Strong,
  Body2,
  Button,
  Card,
  Caption1,
  Input,
  makeStyles,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  tokens
} from '@fluentui/react-components'
import { useEffect, useState } from 'react'

import {
  COMPLEXITY_LEVELS,
  DEFAULT_DIFFICULTY_RULES,
  DEFAULT_WEIGHT_TABLE,
  DifficultyRule,
  FUNCTION_TYPES,
  FunctionType,
  getReferenceLabel,
  ComplexityLevel,
  StudioSettings,
  UpdateSettingsInput,
  WeightTable
} from '@shared/fp'

interface SettingsPanelProps {
  settings: StudioSettings
  isBusy: boolean
  onSave: (input: UpdateSettingsInput) => void
}

const useStyles = makeStyles({
  panel: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    overflowY: 'auto',
    padding: tokens.spacingHorizontalL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  tableCell: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`
  },
  input: {
    width: '90px'
  },
  sectionActions: {
    marginTop: tokens.spacingVerticalM,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS
  }
})

function areDifficultyRulesEqual(
  left: readonly DifficultyRule[],
  right: readonly DifficultyRule[]
): boolean {
  if (left.length !== right.length) {
    return false
  }

  return left.every((rule, index) => {
    const other = right[index]
    return (
      rule.functionType === other.functionType &&
      rule.det[0] === other.det[0] &&
      rule.det[1] === other.det[1] &&
      rule.reference[0] === other.reference[0] &&
      rule.reference[1] === other.reference[1]
    )
  })
}

function areWeightTablesEqual(left: WeightTable, right: WeightTable): boolean {
  return FUNCTION_TYPES.every((type) =>
    COMPLEXITY_LEVELS.every((level) => left[type][level] === right[type][level])
  )
}

function cloneDifficultyRules(rules: readonly DifficultyRule[]): DifficultyRule[] {
  return rules.map((rule) => ({
    functionType: rule.functionType,
    det: [rule.det[0], rule.det[1]],
    reference: [rule.reference[0], rule.reference[1]]
  }))
}

function cloneWeightTable(table: WeightTable): WeightTable {
  const next: WeightTable = {} as WeightTable

  for (const type of FUNCTION_TYPES) {
    next[type] = {
      Low: table[type].Low,
      Average: table[type].Average,
      High: table[type].High
    }
  }

  return next
}

export function SettingsPanel({ settings, isBusy, onSave }: SettingsPanelProps): React.JSX.Element {
  const styles = useStyles()
  const [difficultyRules, setDifficultyRules] = useState<DifficultyRule[]>(
    cloneDifficultyRules(settings.difficultyRules)
  )
  const [weightTable, setWeightTable] = useState<WeightTable>(
    cloneWeightTable(settings.weightTable)
  )
  const [difficultyEnabled, setDifficultyEnabled] = useState(
    !areDifficultyRulesEqual(settings.difficultyRules, DEFAULT_DIFFICULTY_RULES)
  )
  const [weightEnabled, setWeightEnabled] = useState(
    !areWeightTablesEqual(settings.weightTable, DEFAULT_WEIGHT_TABLE)
  )

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDifficultyRules(cloneDifficultyRules(settings.difficultyRules))
    setWeightTable(cloneWeightTable(settings.weightTable))
    setDifficultyEnabled(
      !areDifficultyRulesEqual(settings.difficultyRules, DEFAULT_DIFFICULTY_RULES)
    )
    setWeightEnabled(!areWeightTablesEqual(settings.weightTable, DEFAULT_WEIGHT_TABLE))
  }, [settings])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleDetChange = (type: FunctionType, index: 0 | 1, value: string): void => {
    const normalized = value === '' ? 0 : Number(value)
    if (!Number.isFinite(normalized)) {
      return
    }

    setDifficultyRules((current) =>
      current.map((rule) => {
        if (rule.functionType !== type) {
          return rule
        }

        const nextDet: [number, number] = [rule.det[0], rule.det[1]]
        nextDet[index] = normalized

        return {
          ...rule,
          det: nextDet
        }
      })
    )
  }

  const handleReferenceChange = (type: FunctionType, index: 0 | 1, value: string): void => {
    const normalized = value === '' ? 0 : Number(value)
    if (!Number.isFinite(normalized)) {
      return
    }

    setDifficultyRules((current) =>
      current.map((rule) => {
        if (rule.functionType !== type) {
          return rule
        }

        const nextReference: [number, number] = [rule.reference[0], rule.reference[1]]
        nextReference[index] = normalized

        return {
          ...rule,
          reference: nextReference
        }
      })
    )
  }

  const handleWeightChange = (type: FunctionType, level: ComplexityLevel, value: string): void => {
    const normalized = value === '' ? 0 : Number(value)
    if (!Number.isFinite(normalized)) {
      return
    }

    setWeightTable((current) => ({
      ...current,
      [type]: {
        ...current[type],
        [level]: normalized
      }
    }))
  }

  const buildDifficultyPayload = (): UpdateSettingsInput | null => {
    if (difficultyEnabled) {
      return { difficultyRules }
    }

    if (!areDifficultyRulesEqual(settings.difficultyRules, DEFAULT_DIFFICULTY_RULES)) {
      return { difficultyRules: cloneDifficultyRules(DEFAULT_DIFFICULTY_RULES) }
    }

    return null
  }

  const buildWeightPayload = (): UpdateSettingsInput | null => {
    if (weightEnabled) {
      return { weightTable }
    }

    if (!areWeightTablesEqual(settings.weightTable, DEFAULT_WEIGHT_TABLE)) {
      return { weightTable: cloneWeightTable(DEFAULT_WEIGHT_TABLE) }
    }

    return null
  }

  const handleSaveDifficultyRules = (): void => {
    const payload = buildDifficultyPayload()
    if (payload) {
      onSave(payload)
      if (
        payload.difficultyRules &&
        areDifficultyRulesEqual(payload.difficultyRules, DEFAULT_DIFFICULTY_RULES)
      ) {
        setDifficultyEnabled(false)
      }
    }
  }

  const handleResetDifficultyRules = (): void => {
    setDifficultyRules(cloneDifficultyRules(DEFAULT_DIFFICULTY_RULES))
  }

  const handleSaveWeightTable = (): void => {
    const payload = buildWeightPayload()
    if (payload) {
      onSave(payload)
      if (payload.weightTable && areWeightTablesEqual(payload.weightTable, DEFAULT_WEIGHT_TABLE)) {
        setWeightEnabled(false)
      }
    }
  }

  const handleResetWeightTable = (): void => {
    setWeightTable(cloneWeightTable(DEFAULT_WEIGHT_TABLE))
  }

  const canSaveDifficulty = Boolean(buildDifficultyPayload())
  const canSaveWeight = Boolean(buildWeightPayload())

  return (
    <Card appearance="filled-alternative" className={styles.panel}>
      <div className={styles.header}>
        <Body1Strong>設定</Body1Strong>
        <Body2>IFPUG の難易度ルールと重みをカスタマイズします。</Body2>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Body1Strong>難易度ルール</Body1Strong>
            <Caption1>
              {difficultyEnabled ? 'カスタム値を追加' : 'デフォルトの IFPUG 定義'}
            </Caption1>
          </div>
          <Switch
            checked={difficultyEnabled}
            onChange={(_event, data) => setDifficultyEnabled(data.checked)}
            aria-label="難易度ルールの編集を切り替え"
          />
        </div>
        {difficultyEnabled ? (
          <div className={styles.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className={styles.tableCell}>機能種別</TableCell>
                  <TableCell className={styles.tableCell}>DET 最小</TableCell>
                  <TableCell className={styles.tableCell}>DET 最大</TableCell>
                  <TableCell className={styles.tableCell}>参照数 最小</TableCell>
                  <TableCell className={styles.tableCell}>参照数 最大</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {difficultyRules.map((rule) => (
                  <TableRow key={rule.functionType}>
                    <TableCell className={styles.tableCell}>
                      <Body1Strong>{rule.functionType}</Body1Strong>
                      <Caption1>{getReferenceLabel(rule.functionType)}</Caption1>
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Input
                        type="number"
                        value={String(rule.det[0])}
                        onChange={(_event, data) =>
                          handleDetChange(rule.functionType, 0, data.value)
                        }
                        className={styles.input}
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Input
                        type="number"
                        value={String(rule.det[1])}
                        onChange={(_event, data) =>
                          handleDetChange(rule.functionType, 1, data.value)
                        }
                        className={styles.input}
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Input
                        type="number"
                        value={String(rule.reference[0])}
                        onChange={(_event, data) =>
                          handleReferenceChange(rule.functionType, 0, data.value)
                        }
                        className={styles.input}
                      />
                    </TableCell>
                    <TableCell className={styles.tableCell}>
                      <Input
                        type="number"
                        value={String(rule.reference[1])}
                        onChange={(_event, data) =>
                          handleReferenceChange(rule.functionType, 1, data.value)
                        }
                        className={styles.input}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Body2>IFPUG 標準ルールをそのまま使います。</Body2>
        )}
        {difficultyEnabled && (
          <div className={styles.sectionActions}>
            <Button appearance="secondary" onClick={handleResetDifficultyRules} disabled={isBusy}>
              リセット
            </Button>
            <Button
              appearance="primary"
              onClick={handleSaveDifficultyRules}
              disabled={isBusy || !canSaveDifficulty}
            >
              保存
            </Button>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Body1Strong>重み</Body1Strong>
            <Caption1>{weightEnabled ? '現在の重みを編集' : 'IFPUG デフォルト重み'}</Caption1>
          </div>
          <Switch
            checked={weightEnabled}
            onChange={(_event, data) => setWeightEnabled(data.checked)}
            aria-label="重みの編集を切り替え"
          />
        </div>
        {weightEnabled ? (
          <div className={styles.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className={styles.tableCell}>機能種別</TableCell>
                  {COMPLEXITY_LEVELS.map((level) => (
                    <TableCell key={level} className={styles.tableCell}>
                      {level}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {FUNCTION_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell className={styles.tableCell}>
                      <Body1Strong>{type}</Body1Strong>
                    </TableCell>
                    {COMPLEXITY_LEVELS.map((level) => (
                      <TableCell key={`${type}-${level}`} className={styles.tableCell}>
                        <Input
                          type="number"
                          value={String(weightTable[type][level])}
                          onChange={(_event, data) => handleWeightChange(type, level, data.value)}
                          className={styles.input}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Body2>デフォルトの IFPUG 重みを使用します。</Body2>
        )}
        {weightEnabled && (
          <div className={styles.sectionActions}>
            <Button appearance="secondary" onClick={handleResetWeightTable} disabled={isBusy}>
              リセット
            </Button>
            <Button
              appearance="primary"
              onClick={handleSaveWeightTable}
              disabled={isBusy || !canSaveWeight}
            >
              保存
            </Button>
          </div>
        )}
      </section>
    </Card>
  )
}
