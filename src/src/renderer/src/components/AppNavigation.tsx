import {
  Body1Strong,
  Button,
  Card,
  mergeClasses,
  makeStyles,
  tokens
} from '@fluentui/react-components'

type AppView = 'projects' | 'settings'

export const NAV_PANEL_OPEN_WIDTH = 220
export const NAV_PANEL_COLLAPSED_WIDTH = 48

interface AppNavigationProps {
  selectedView: AppView
  onChange: (view: AppView) => void
  isOpen: boolean
  onToggle: () => void
}

const useStyles = makeStyles({
  root: {
    position: 'absolute',
    top: tokens.spacingVerticalL,
    left: tokens.spacingHorizontalL,
    bottom: tokens.spacingVerticalL,
    zIndex: 5,
    pointerEvents: 'none'
  },
  panel: {
    pointerEvents: 'auto',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    boxShadow: tokens.shadow4,
    transition: 'width 0.3s ease',
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium,
    boxSizing: 'border-box'
  },
  panelOpen: {
    width: `${NAV_PANEL_OPEN_WIDTH}px`
  },
  panelClosed: {
    width: `${NAV_PANEL_COLLAPSED_WIDTH}px`
  },
  toggle: {
    minWidth: 0,
    padding: 0
  },
  menu: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalS
  },
  navButton: {
    justifyContent: 'flex-start',
    textAlign: 'left',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium
  },
  navButtonActive: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke2}`
  }
})

const MENU_ITEMS: { id: AppView; label: string }[] = [
  {
    id: 'projects',
    label: 'プロジェクト'
  },
  {
    id: 'settings',
    label: '設定'
  }
]
const HamburgerIcon = (): React.JSX.Element => (
  <svg width="24" height="24" viewBox="0 0 24 24" role="presentation" focusable="false">
    <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
    <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
    <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
  </svg>
)
export function AppNavigation({
  selectedView,
  onChange,
  isOpen,
  onToggle
}: AppNavigationProps): React.JSX.Element {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Card
        appearance="filled-alternative"
        className={mergeClasses(styles.panel, isOpen ? styles.panelOpen : styles.panelClosed)}
      >
        <Button
          icon={<HamburgerIcon />}
          appearance="subtle"
          onClick={onToggle}
          className={styles.toggle}
          aria-label={isOpen ? 'サイドメニューを折りたたむ' : 'サイドメニューを展開する'}
          data-testid="side-menu-toggle"
        />
        {isOpen && (
          <div className={styles.menu}>
            {MENU_ITEMS.map((item) => (
              <Button
                key={item.id}
                appearance={selectedView === item.id ? 'primary' : 'subtle'}
                onClick={() => onChange(item.id)}
                className={mergeClasses(
                  styles.navButton,
                  selectedView === item.id && styles.navButtonActive
                )}
                data-testid={`side-menu-${item.id}`}
              >
                <Body1Strong>{item.label}</Body1Strong>
              </Button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
