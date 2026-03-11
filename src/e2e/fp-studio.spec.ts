import { test, expect, type Page } from '@playwright/test'

import {
  closeStudioApp,
  createAppDataRoot,
  launchStudioApp,
  removeAppDataRoot
} from './helpers/electron-app'

async function createProject(page: Page, name: string, description: string): Promise<void> {
  await page.getByTestId('project-name-input').fill(name)
  await page.getByTestId('project-description-input').fill(description)
  await page.getByTestId('create-project-button').click()

  await expect(page.getByTestId('project-list').getByText(name)).toBeVisible()
  await expect(page.getByRole('heading', { name: `${name} に機能を追加` })).toBeVisible()
}

async function addFunctionEntry(
  page: Page,
  input: {
    name: string
    functionType: 'EI' | 'EO' | 'EQ' | 'ILF' | 'EIF'
    det: string
    referenceCount: string
    note: string
    expectedPreview?: string
  }
): Promise<void> {
  await page.getByTestId('function-name-input').fill(input.name)
  await page.getByTestId('function-type-select').selectOption(input.functionType)
  await page.getByTestId('det-input').fill(input.det)
  await page.getByTestId('reference-count-input').fill(input.referenceCount)
  await page.getByTestId('function-note-input').fill(input.note)

  if (input.expectedPreview) {
    await expect(page.getByTestId('function-preview')).toContainText(input.expectedPreview)
  }

  await page.getByTestId('add-function-button').click()

  await expect(page.getByTestId('function-entry-table-body').getByText(input.name)).toBeVisible()
}

test.describe('FP Studio business scenarios', () => {
  test('プロジェクト作成から FP 集計まで完了できる', async () => {
    const appDataRoot = await createAppDataRoot()
    const app = await launchStudioApp(appDataRoot)

    try {
      await createProject(app.page, '販売管理システム刷新', '受注から請求までの見積')

      await addFunctionEntry(app.page, {
        name: '受注登録',
        functionType: 'EI',
        det: '12',
        referenceCount: '2',
        note: '受注入力画面',
        expectedPreview: 'Average / 4 FP'
      })

      await addFunctionEntry(app.page, {
        name: '顧客マスタ',
        functionType: 'ILF',
        det: '30',
        referenceCount: '3',
        note: '顧客属性管理',
        expectedPreview: 'Average / 10 FP'
      })

      await expect(app.page.getByTestId('summary-total-ufp')).toHaveText('14')
      await expect(app.page.getByTestId('summary-estimated-effort')).toHaveText('14 人日')
      await expect(app.page.getByTestId('summary-function-count')).toHaveText('2')
    } finally {
      await closeStudioApp(app)
      await removeAppDataRoot(appDataRoot)
    }
  })

  test('生産性設定の変更と再起動後の永続化を確認できる', async () => {
    const appDataRoot = await createAppDataRoot()
    const app = await launchStudioApp(appDataRoot)

    try {
      await createProject(app.page, '在庫管理クラウド', '在庫照会と入出庫管理')
      await addFunctionEntry(app.page, {
        name: '在庫照会',
        functionType: 'EQ',
        det: '8',
        referenceCount: '2',
        note: '検索条件あり'
      })

      await expect(app.page.getByTestId('summary-total-ufp')).toHaveText('4')
      await expect(app.page.getByTestId('summary-estimated-effort')).toHaveText('4 人日')

      await app.page.getByTestId('settings-accordion-button').click()
      await app.page.getByTestId('settings-productivity-input').fill('1.5')
      await app.page.getByTestId('settings-save-button').click()

      await expect(app.page.getByTestId('summary-estimated-effort')).toHaveText('6 人日')
      await closeStudioApp(app)

      const relaunched = await launchStudioApp(appDataRoot)
      try {
        await expect(
          relaunched.page.getByTestId('project-list').getByText('在庫管理クラウド')
        ).toBeVisible()
        await expect(
          relaunched.page.getByTestId('function-entry-table-body').getByText('在庫照会')
        ).toBeVisible()
        await expect(relaunched.page.getByTestId('summary-total-ufp')).toHaveText('4')
        await expect(relaunched.page.getByTestId('summary-estimated-effort')).toHaveText('6 人日')
      } finally {
        await closeStudioApp(relaunched)
      }
    } finally {
      await removeAppDataRoot(appDataRoot)
    }
  })

  test('機能とプロジェクトを削除できる', async () => {
    const appDataRoot = await createAppDataRoot()
    const app = await launchStudioApp(appDataRoot)

    try {
      await createProject(app.page, '会計基盤更新', '伝票登録と照会')
      await addFunctionEntry(app.page, {
        name: '伝票登録',
        functionType: 'EI',
        det: '20',
        referenceCount: '4',
        note: '仕訳入力'
      })

      await expect(app.page.getByTestId('summary-total-ufp')).toHaveText('6')
      await app.page.getByRole('button', { name: '伝票登録 を削除' }).click()
      await expect(app.page.getByTestId('summary-total-ufp')).toHaveText('0')
      await expect(
        app.page.getByText(
          'まだ機能が登録されていません。上のフォームから最初の FP エントリを追加してください。'
        )
      ).toBeVisible()

      await app.page.getByRole('button', { name: '会計基盤更新 プロジェクトを削除' }).click()
      await expect(app.page.getByText('最初のプロジェクトを作成してください')).toBeVisible()
      await expect(app.page.getByTestId('project-list').getByText('会計基盤更新')).toHaveCount(0)
    } finally {
      await closeStudioApp(app)
      await removeAppDataRoot(appDataRoot)
    }
  })
})
