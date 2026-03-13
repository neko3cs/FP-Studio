import { useState, type ReactNode } from 'react'

import '../setup/node-filter'

import {
  Badge,
  Body2,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  makeStyles,
  Select,
  Text,
  Textarea,
  Title3,
  tokens
} from '@fluentui/react-components'

import type { FunctionPointAnalysis, FunctionType } from '@shared/fp'
import { FUNCTION_TYPES } from '@shared/fp'

type HelpTopic = 'functionType' | 'det' | 'reference'

const HELP_CONTENT: Record<
  Exclude<HelpTopic, 'reference'>,
  { title: string; description: ReactNode }
> = {
  functionType: {
    title: 'Function Type とは？',
    description: (
      <div style={{ lineHeight: 1.5 }}>
        <p>
          Function Type
          は、機能を入力処理/出力処理/参照処理/内部データ/外部データのどこに当てはまるかで分類するものです。
        </p>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
            minWidth: '280px'
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '4px'
                }}
              >
                種類
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '4px'
                }}
              >
                内容
              </th>
              <th
                style={{
                  textAlign: 'left',
                  borderBottom: '1px solid #ccc',
                  paddingBottom: '4px'
                }}
              >
                例
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>EI（External Input）</strong>
              </td>
              <td>ユーザーや外部バッチからシステムが受け取る入力処理</td>
              <td>設定・登録フォーム、受注データ取り込み</td>
            </tr>
            <tr>
              <td>
                <strong>EO（External Output）</strong>
              </td>
              <td>処理結果を画面や帳票として出力する処理</td>
              <td>期間別集計帳票、発送完了画面</td>
            </tr>
            <tr>
              <td>
                <strong>EQ（External Inquiry）</strong>
              </td>
              <td>画面で既存データを検索・参照するだけの機能</td>
              <td>データベース検索画面、取引履歴照会</td>
            </tr>
            <tr>
              <td>
                <strong>ILF（Internal Logical File）</strong>
              </td>
              <td>アプリ内で保持し管理するマスタやトランザクションデータ</td>
              <td>顧客マスタ、受注・請求の内部ファイル</td>
            </tr>
            <tr>
              <td>
                <strong>EIF（External Interface File）</strong>
              </td>
              <td>他システムや部署に提供する読み取り専用のデータ</td>
              <td>他システム連携用の仕入先参照、外部レポート</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
  det: {
    title: 'DET とは？',
    description: (
      <div style={{ lineHeight: 1.4 }}>
        <p>
          <strong>内容:</strong> Data Element
          Type。1つの機能の中で識別できる固有のデータ項目の数で、数字が大きいほど処理が複雑になります。
        </p>
        <p>
          <strong>例:</strong>{' '}
          顧客登録処理なら「氏名」「住所」「連絡先」など複数の入力項目が判別されると DET
          は増えます。
        </p>
      </div>
    )
  }
}

interface FunctionEntryFormProps {
  projectName: string
  values: {
    name: string
    functionType: FunctionType
    det: string
    referenceCount: string
    note: string
  }
  preview: FunctionPointAnalysis | null
  canSubmit: boolean
  isEditing: boolean
  isBusy: boolean
  onFieldChange: (
    field: 'name' | 'functionType' | 'det' | 'referenceCount' | 'note',
    value: string
  ) => void
  onCancel: () => void
  onSubmit: () => void
}

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    overflow: 'hidden'
  },
  cardCollapsed: {
    height: '72px'
  },
  cardOpen: {
    height: '396px'
  },
  headerButton: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: '40px',
    paddingTop: '0',
    paddingRight: '0',
    paddingBottom: '0',
    paddingLeft: '0',
    backgroundColor: 'transparent'
  },
  headerContent: {
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  sectionTitle: {
    fontSize: '1rem',
    lineHeight: 1.3
  },
  previewBadge: {
    maxWidth: '100%'
  },
  chevron: {
    transitionDuration: '200ms',
    transitionProperty: 'transform'
  },
  chevronOpen: {
    transform: 'rotate(180deg)'
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    gap: tokens.spacingVerticalM,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`
  },
  grid: {
    display: 'grid',
    gap: tokens.spacingVerticalM,
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
    },
    '@media (min-width: 1280px)': {
      gridTemplateColumns: 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))'
    }
  },
  fieldLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  helpButton: {
    minWidth: '28px',
    padding: 0,
    height: '28px',
    borderRadius: tokens.borderRadiusCircular
  },
  noteField: {
    marginTop: tokens.spacingVerticalXS
  },
  noteInput: {
    minHeight: '72px'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    }
  },
  saveButton: {
    '@media (min-width: 768px)': {
      marginLeft: 'auto'
    }
  }
})

export function FunctionEntryForm({
  projectName,
  values,
  preview,
  canSubmit,
  isEditing,
  isBusy,
  onFieldChange,
  onCancel,
  onSubmit
}: FunctionEntryFormProps): React.JSX.Element {
  const styles = useStyles()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeHelp, setActiveHelp] = useState<HelpTopic | null>(null)
  const isOpen = isEditing || !isCollapsed
  const headingLabel = `${projectName} の機能を${isEditing ? '編集' : '追加'}`
  const referenceHelp = {
    title: 'FTR/RET とは？',
    description: (
      <div style={{ lineHeight: 1.6 }}>
        <p>
          FP法では、データファンクション（ILF・EIF）の内部構造を見る指標として FTR と RET
          を使い、それぞれトランザクション視点とデータ視点の両方から難易度を評価します。
        </p>
        <p>
          <strong>FTR（File Type Referenced）</strong>：トランザクション（EI/EO/EQ）が読み書きする
          ILF または EIF
          の数を数えます。処理がどれだけ多くのデータを参照するかを示すため、扱うデータ種類の多さが分かります。
        </p>
        <p>
          <strong>RET（Record Element Type）</strong>：ILF・EIF
          の中にある論理的なレコードのまとまり（サブグループ）の数を数えます。ファイル内の構造が複雑なほど
          RET が増え、必要な情報がどれだけ細かく分かれているかが分かります。
        </p>
        <p>
          <strong>例：</strong>注文情報を扱う処理が「顧客ファイル」と「注文ファイル」を参照すれば
          FTR=2、注文ファイルが「ヘッダ」と「明細」の 2種類のレコードを持つなら RET=2 になります。
        </p>
      </div>
    )
  }
  let helpContent: { title: string; description: ReactNode } | null = null
  if (activeHelp === 'reference') {
    helpContent = referenceHelp
  } else if (activeHelp) {
    helpContent = HELP_CONTENT[activeHelp]
  }

  return (
    <Card
      appearance="filled-alternative"
      className={`${styles.card} ${isOpen ? styles.cardOpen : styles.cardCollapsed}`}
    >
      <Button
        aria-controls="function-entry-form-content"
        aria-expanded={isOpen}
        aria-label={headingLabel}
        appearance="subtle"
        className={styles.headerButton}
        data-testid="function-form-accordion-button"
        onClick={() => setIsCollapsed((current) => !current)}
      >
        <div className={styles.headerContent}>
          <Title3 as="h3" className={styles.sectionTitle} aria-label={headingLabel}>
            {isEditing ? '機能を編集' : '機能を追加'}
          </Title3>
          <Badge
            appearance="outline"
            className={styles.previewBadge}
            data-testid="function-preview"
            shape="rounded"
            size="large"
          >
            {preview ? `${preview.difficulty} / ${preview.functionPoints} FP` : '入力待ち'}
          </Badge>
        </div>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>▾</span>
      </Button>

      {isOpen ? (
        <div className={styles.panel} id="function-entry-form-content">
          <div className={styles.grid}>
            <Field label="機能名">
              <Input
                data-testid="function-name-input"
                disabled={isBusy}
                placeholder="例: 顧客登録、売上照会"
                value={values.name}
                onChange={(_, data) => onFieldChange('name', data.value)}
              />
            </Field>

            <Field
              label={
                <div className={styles.fieldLabel}>
                  <Text>Function Type</Text>
                  <Button
                    appearance="subtle"
                    className={styles.helpButton}
                    data-testid="function-help-button-functionType"
                    aria-label="Function Type の説明"
                    disabled={isBusy}
                    onClick={() => setActiveHelp('functionType')}
                  >
                    ?
                  </Button>
                </div>
              }
            >
              <Select
                data-testid="function-type-select"
                disabled={isBusy}
                value={values.functionType}
                onChange={(_, data) => onFieldChange('functionType', data.value)}
              >
                {FUNCTION_TYPES.map((functionType) => (
                  <option key={functionType} value={functionType}>
                    {functionType}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label={
                <div className={styles.fieldLabel}>
                  <Text>DET</Text>
                  <Button
                    appearance="subtle"
                    className={styles.helpButton}
                    data-testid="function-help-button-det"
                    aria-label="DET の説明"
                    disabled={isBusy}
                    onClick={() => setActiveHelp('det')}
                  >
                    ?
                  </Button>
                </div>
              }
            >
              <Input
                data-testid="det-input"
                disabled={isBusy}
                inputMode="numeric"
                value={values.det}
                onChange={(_, data) => onFieldChange('det', data.value)}
              />
            </Field>

            <Field
              label={
                <div className={styles.fieldLabel}>
                  <Text>FTR/RET</Text>
                  <Button
                    appearance="subtle"
                    className={styles.helpButton}
                    data-testid="function-help-button-reference"
                    aria-label="FTR/RET の説明"
                    disabled={isBusy}
                    onClick={() => setActiveHelp('reference')}
                  >
                    ?
                  </Button>
                </div>
              }
            >
              <Input
                data-testid="reference-count-input"
                disabled={isBusy}
                inputMode="numeric"
                value={values.referenceCount}
                onChange={(_, data) => onFieldChange('referenceCount', data.value)}
              />
            </Field>
          </div>

          <Field className={styles.noteField} label="備考">
            <Textarea
              className={styles.noteInput}
              data-testid="function-note-input"
              disabled={isBusy}
              placeholder="判断根拠や対象画面などをメモ"
              resize="none"
              rows={2}
              value={values.note}
              onChange={(_, data) => onFieldChange('note', data.value)}
            />
          </Field>

          <div className={styles.actions}>
            {isEditing ? (
              <Button
                appearance="secondary"
                data-testid="cancel-edit-button"
                disabled={isBusy}
                onClick={onCancel}
              >
                編集をキャンセル
              </Button>
            ) : (
              <Body2 />
            )}
            <Button
              appearance="primary"
              className={styles.saveButton}
              data-testid="add-function-button"
              disabled={isBusy || !canSubmit}
              onClick={onSubmit}
            >
              <Text>{isEditing ? '変更を保存' : '機能を追加'}</Text>
            </Button>
          </div>
          <Dialog
            open={Boolean(helpContent)}
            onOpenChange={(_, data) => {
              if (!data.open) {
                setActiveHelp(null)
              }
            }}
            data-testid="function-help-dialog"
          >
            <DialogSurface>
              <DialogBody>
                <DialogTitle data-testid="function-help-dialog-title">
                  {helpContent?.title}
                </DialogTitle>
                <DialogContent data-testid="function-help-dialog-description">
                  {helpContent?.description}
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="primary"
                    data-testid="function-help-dialog-close"
                    onClick={() => setActiveHelp(null)}
                  >
                    閉じる
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </div>
      ) : null}
    </Card>
  )
}
