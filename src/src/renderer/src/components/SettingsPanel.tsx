import {
  Body1Strong,
  Body2,
  Card,
  Caption1,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  tokens
} from '@fluentui/react-components'

import {
  COMPLEXITY_LEVELS,
  FUNCTION_TYPES,
  getReferenceLabel,
  type StudioSettings
} from '@shared/fp'

interface SettingsPanelProps {
  settings: StudioSettings
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
  tableWrapper: {
    overflowX: 'auto'
  },
  tableCell: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`
  }
})

export function SettingsPanel({ settings }: SettingsPanelProps): React.JSX.Element {
  const styles = useStyles()

  return (
    <Card appearance="filled-alternative" className={styles.panel}>
      <div className={styles.header}>
        <Body1Strong>設定</Body1Strong>
        <Body2>IFPUG の難易度ルールと重みの参照値です。</Body2>
      </div>

      <section className={styles.section}>
        <div>
          <Body1Strong>難易度ルール</Body1Strong>
          <Caption1>IFPUG 標準ルール（読み取り専用）</Caption1>
        </div>
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
              {settings.difficultyRules.map((rule) => (
                <TableRow key={rule.functionType}>
                  <TableCell className={styles.tableCell}>
                    <Body1Strong>
                      {rule.functionType}（{getReferenceLabel(rule.functionType)}）
                    </Body1Strong>
                  </TableCell>
                  <TableCell className={styles.tableCell}>{rule.det[0]}</TableCell>
                  <TableCell className={styles.tableCell}>{rule.det[1]}</TableCell>
                  <TableCell className={styles.tableCell}>{rule.reference[0]}</TableCell>
                  <TableCell className={styles.tableCell}>{rule.reference[1]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className={styles.section}>
        <div>
          <Body1Strong>重み</Body1Strong>
          <Caption1>IFPUG デフォルト重み（読み取り専用）</Caption1>
        </div>
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
                      {settings.weightTable[type][level]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </Card>
  )
}
