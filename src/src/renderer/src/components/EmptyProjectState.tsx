import { Card, makeStyles, Title2, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    minHeight: '420px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalXXL
  }
})

export function EmptyProjectState(): React.JSX.Element {
  const styles = useStyles()

  return (
    <Card appearance="filled-alternative" className={styles.root}>
      <Title2 as="h2">最初のプロジェクトを作成してください</Title2>
    </Card>
  )
}
