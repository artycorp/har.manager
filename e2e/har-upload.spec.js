import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testFiltersHar = path.join(__dirname, '../test-filters.har')

test.describe('HAR Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows upload area on initial load', async ({ page }) => {
    // The FileUpload component shows a drop zone with "upload.har" header
    await expect(page.locator('text=upload.har')).toBeVisible()

    // The drop zone text should be visible
    await expect(page.getByText('Drop HAR file here')).toBeVisible()
  })

  test('uploads test-filters.har and shows 9 rows in table', async ({ page }) => {
    // Find the hidden file input and upload the HAR file
    const fileInput = page.locator('input[type="file"][accept=".har"]')
    await fileInput.setInputFiles(testFiltersHar)

    // Wait for the DataTable rows to appear in the tbody
    const rows = page.locator('.p-datatable-tbody > tr')
    await expect(rows).toHaveCount(9, { timeout: 10000 })
  })

  test('displays statistics after upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept=".har"]')
    await fileInput.setInputFiles(testFiltersHar)

    // Wait for table to load
    await expect(page.locator('.p-datatable-tbody > tr').first()).toBeVisible({ timeout: 10000 })

    // SessionStats component shows "Total Requests" label
    await expect(page.getByText('Total Requests')).toBeVisible()

    // The total request count should be 9
    // The stats card with "Total Requests" should contain the number 9
    const statsSection = page.locator('text=Total Requests').locator('..')
    await expect(statsSection).toContainText('9')
  })

  test('renders waterfall bars for each row', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept=".har"]')
    await fileInput.setInputFiles(testFiltersHar)

    // Wait for rows to appear
    const rows = page.locator('.p-datatable-tbody > tr')
    await expect(rows).toHaveCount(9, { timeout: 10000 })

    // WaterfallBar renders inside each row - check that waterfall containers exist
    // WaterfallBar uses inline styles with background colors for timing segments
    const waterfallCells = page.locator('.p-datatable-tbody > tr > td:nth-child(2)')
    await expect(waterfallCells).toHaveCount(9)

    // Each waterfall cell should contain content (the bar visualization)
    for (let i = 0; i < 9; i++) {
      await expect(waterfallCells.nth(i)).not.toBeEmpty()
    }
  })
})
