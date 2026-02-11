import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testFiltersHar = path.join(__dirname, '../test-filters.har')
const testComparisonHar = path.join(__dirname, '../test-comparison.har')

test.describe('Comparison Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('navigates to comparison mode', async ({ page }) => {
    // Click the Compare nav button
    const compareButton = page.getByRole('button', { name: /Compare/i })
    await compareButton.click()

    // The comparison view should show the title
    await expect(page.getByText('$ HAR COMPARISON')).toBeVisible()

    // The empty state should prompt to upload two files
    await expect(page.getByText('Upload two HAR files to compare')).toBeVisible()
  })

  test('uploads both HAR files to session 1 and session 2', async ({ page }) => {
    // Navigate to comparison mode
    const compareButton = page.getByRole('button', { name: /Compare/i })
    await compareButton.click()

    await expect(page.getByText('$ HAR COMPARISON')).toBeVisible()

    // The ComparisonFileUpload component has two file inputs initially
    // Find them separately since they disappear after upload
    const fileInput1 = page.locator('input[type="file"][accept=".har"]').first()
    const fileInput2 = page.locator('input[type="file"][accept=".har"]').last()

    // Upload first file to session 1
    await fileInput1.setInputFiles(testFiltersHar)

    // Wait for session 1 to be loaded - should show filename
    await expect(page.getByText('test-filters.har')).toBeVisible({ timeout: 10000 })

    // Now find the second input (first one is gone due to v-if="!session1")
    // There should only be one input visible now
    const fileInput2Visible = page.locator('input[type="file"][accept=".har"]')
    await fileInput2Visible.setInputFiles(testComparisonHar)

    // Wait for session 2 to be loaded - should show filename
    await expect(page.getByText('test-comparison.har')).toBeVisible({ timeout: 10000 })
  })

  test('shows matched requests table after both files uploaded', async ({ page }) => {
    // Navigate to comparison mode
    await page.getByRole('button', { name: /Compare/i }).click()
    await expect(page.getByText('$ HAR COMPARISON')).toBeVisible()

    // Upload first file
    const fileInput1 = page.locator('input[type="file"][accept=".har"]').first()
    await fileInput1.setInputFiles(testFiltersHar)
    await expect(page.getByText('test-filters.har')).toBeVisible({ timeout: 10000 })

    // Upload second file (first input is now hidden)
    const fileInput2 = page.locator('input[type="file"][accept=".har"]')
    await fileInput2.setInputFiles(testComparisonHar)
    await expect(page.getByText('test-comparison.har')).toBeVisible({ timeout: 10000 })

    // The comparison stats section should appear with HAR 1 and HAR 2 stats
    await expect(page.getByText('HAR 1 Statistics')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('HAR 2 Statistics')).toBeVisible()
    await expect(page.getByText('Match Statistics')).toBeVisible()

    // The matched requests header should be visible (or the no-matches message)
    const matchedHeader = page.getByText('Matched Requests')
    const noMatches = page.getByText('No matching requests found')
    await expect(matchedHeader.or(noMatches)).toBeVisible({ timeout: 10000 })
  })

  test('toggles differences only filter', async ({ page }) => {
    // Navigate to comparison mode
    await page.getByRole('button', { name: /Compare/i }).click()
    await expect(page.getByText('$ HAR COMPARISON')).toBeVisible()

    // Upload first file
    const fileInput1 = page.locator('input[type="file"][accept=".har"]').first()
    await fileInput1.setInputFiles(testFiltersHar)
    await expect(page.getByText('test-filters.har')).toBeVisible({ timeout: 10000 })

    // Upload second file (first input is now hidden)
    const fileInput2 = page.locator('input[type="file"][accept=".har"]')
    await fileInput2.setInputFiles(testComparisonHar)
    await expect(page.getByText('test-comparison.har')).toBeVisible({ timeout: 10000 })

    // Wait for comparison results
    await page.waitForTimeout(1000)

    // Look for the "Show Differences Only" toggle button
    const diffButton = page.getByRole('button', { name: /Show Differences Only|Show All/i })

    // Only test toggle if the button exists (it only appears when there are matches)
    if (await diffButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      const initialText = await diffButton.textContent()

      await diffButton.click()

      // Button text should toggle
      const newText = await diffButton.textContent()
      expect(newText).not.toBe(initialText)
    }
  })
})
