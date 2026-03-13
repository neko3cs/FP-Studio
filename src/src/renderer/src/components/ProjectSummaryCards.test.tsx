import '../../../test/setup'
import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ProjectDetail } from '@shared/fp'

import { ProjectSummaryCards } from './ProjectSummaryCards'

const project: ProjectDetail = {
  id: 'project-1',
  name: '販売管理システム刷新',
  description: '受注から請求までの見積',
  productivity: 1,
  createdAt: '2026-03-13T00:00:00.000Z',
  updatedAt: '2026-03-13T00:00:00.000Z',
  functionCount: 2,
  totalFunctionPoints: 14,
  estimatedEffortDays: 14,
  entries: []
}

describe('ProjectSummaryCards', () => {
  it('shows the project name in the summary area', () => {
    render(
      <FluentProvider theme={webLightTheme}>
        <ProjectSummaryCards project={project} />
      </FluentProvider>
    )

    expect(screen.getByTestId('summary-project-name').textContent).toBe(project.name)
    expect(screen.getByTestId('summary-total-ufp').textContent).toBe('14')
    expect(screen.getByTestId('summary-estimated-effort').textContent).toBe('14 人日')
    expect(screen.getByTestId('summary-function-count').textContent).toBe('2')
  })
})
