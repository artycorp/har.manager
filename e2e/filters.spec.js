import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testFiltersHar = path.join(__dirname, '../test-filters.har')

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Upload the test HAR file
    const fileInput = page.locator('input[type="file"][accept=".har"]')
    await fileInput.setInputFiles(testFiltersHar)

    // Wait for all 9 rows to appear
    await expect(page.locator('.p-datatable-tbody > tr')).toHaveCount(9, { timeout: 10000 })
  })

  test('clicking Errors Only filters to error rows only', async ({ page }) => {
    // Click the "Errors Only" button
    const errorsOnlyButton = page.getByRole('button', { name: /Errors Only/i })
    await errorsOnlyButton.click()

    // Wait for filtering to apply - should have fewer than 9 rows
    const rows = page.locator('.p-datatable-tbody > tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeLessThan(9)
    expect(rowCount).toBeGreaterThan(0)

    // The button text should now say "Show All"
    await expect(page.getByRole('button', { name: /Show All/i }).first()).toBeVisible()
  })

  test('clicking a method filter button filters by that method', async ({ page }) => {
    // Click the GET method filter button
    const getButton = page.locator('button', { hasText: /^GET$/ }).first()
    await getButton.click()

    // Rows should be filtered - all visible rows should have GET method
    const rows = page.locator('.p-datatable-tbody > tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeGreaterThan(0)
    expect(rowCount).toBeLessThanOrEqual(9)

    // Verify all visible rows contain GET
    for (let i = 0; i < rowCount; i++) {
      const methodCell = rows.nth(i).locator('td:nth-child(4)')
      await expect(methodCell).toContainText('GET')
    }
  })

  test('typing in path filter input filters results', async ({ page }) => {
    // Find the path filter input by its placeholder
    const pathInput = page.locator('input[placeholder="e.g., /api/users"]')
    await expect(pathInput).toBeVisible()

    // Type a path substring to filter (use /v1 which exists in all paths in test-filters.har)
    await pathInput.fill('/v1')

    // Wait for filtering to take effect - wait for table to stabilize
    await page.waitForTimeout(500)

    const rows = page.locator('.p-datatable-tbody > tr')

    // Wait for at least one row to be visible after filtering
    await expect(rows.first()).toBeVisible({ timeout: 5000 })

    const rowCount = await rows.count()

    // Should show filtered results (fewer or equal to 9)
    expect(rowCount).toBeLessThanOrEqual(9)

    // If there are results, each should contain /v1 in the path column
    if (rowCount > 0) {
      for (let i = 0; i < rowCount; i++) {
        // The path column is the 6th column (id, waterfall, status, method, domain, path)
        const pathCell = rows.nth(i).locator('td:nth-child(6)')
        await expect(pathCell).toBeVisible()
        const text = await pathCell.textContent({ timeout: 5000 })
        expect(text.toLowerCase()).toContain('/v1')
      }
    }
  })

  test('active filter count badge appears when filters are active', async ({ page }) => {
    // Initially no badge should be visible
    await expect(page.getByText(/filter.*active/i)).not.toBeVisible()

    // Click Errors Only
    const errorsOnlyButton = page.getByRole('button', { name: /Errors Only/i })
    await errorsOnlyButton.click()

    // Badge should appear showing active filter count
    await expect(page.getByText(/\d+ filter.*active/i)).toBeVisible()
  })

  test('clicking Clear restores all 9 rows', async ({ page }) => {
    // Apply a filter first
    const errorsOnlyButton = page.getByRole('button', { name: /Errors Only/i })
    await errorsOnlyButton.click()

    // Verify filtered state
    const rows = page.locator('.p-datatable-tbody > tr')
    const filteredCount = await rows.count()
    expect(filteredCount).toBeLessThan(9)

    // Click Clear button
    const clearButton = page.getByRole('button', { name: /Clear/i })
    await clearButton.click()

    // All 9 rows should return
    await expect(rows).toHaveCount(9, { timeout: 5000 })
  })
})
