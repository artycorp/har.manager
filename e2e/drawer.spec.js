import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testFiltersHar = path.join(__dirname, '../test-filters.har')

test.describe('Request Details Drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Upload the test HAR file
    const fileInput = page.locator('input[type="file"][accept=".har"]')
    await fileInput.setInputFiles(testFiltersHar)

    // Wait for rows to appear
    await expect(page.locator('.p-datatable-tbody > tr').first()).toBeVisible({ timeout: 10000 })
  })

  test('clicking a table row opens the drawer', async ({ page }) => {
    // Wait for table to be fully interactive
    const firstRow = page.locator('.p-datatable-tbody > tr').first()
    await expect(firstRow).toBeVisible()

    // Click the first row in the table
    await firstRow.click()

    // The drawer is a PrimeVue Sidebar that appears on the right
    // It should become visible with the request-details-drawer class
    const drawer = page.locator('.p-sidebar')
    await expect(drawer).toBeVisible({ timeout: 10000 })
  })

  test('drawer shows request details (URL, method, status)', async ({ page }) => {
    // Click the first row
    const firstRow = page.locator('.p-datatable-tbody > tr').first()
    await firstRow.click()

    // Wait for the drawer to appear
    const drawer = page.locator('.p-sidebar')
    await expect(drawer).toBeVisible({ timeout: 10000 })

    // The DrawerHeader shows method badge, status badge, and URL
    // Check that the drawer contains a method badge (GET, POST, etc.)
    const methodBadge = drawer.locator('.method-badge')
    await expect(methodBadge).toBeVisible()
    const methodText = await methodBadge.textContent()
    expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']).toContain(methodText.trim())

    // Check that status badge is visible
    const statusBadge = drawer.locator('.status-badge')
    await expect(statusBadge).toBeVisible()

    // Check that URL is displayed
    const urlDisplay = drawer.locator('.url-display')
    await expect(urlDisplay).toBeVisible()
    const urlText = await urlDisplay.textContent()
    expect(urlText.trim()).toContain('http')
  })

  test('drawer has tabs (Headers, Payload, Response, Timing)', async ({ page }) => {
    // Click the first row
    const firstRow = page.locator('.p-datatable-tbody > tr').first()
    await firstRow.click()

    // Wait for the drawer
    const drawer = page.locator('.p-sidebar')
    await expect(drawer).toBeVisible({ timeout: 10000 })

    // The TabView renders tabs with role="tab"
    // Check for each tab by role
    await expect(drawer.getByRole('tab', { name: /Headers/i })).toBeVisible()
    await expect(drawer.getByRole('tab', { name: /Payload/i })).toBeVisible()
    await expect(drawer.getByRole('tab', { name: /Response/i })).toBeVisible()
    await expect(drawer.getByRole('tab', { name: /Timing/i })).toBeVisible()
  })

  test('closing drawer hides it', async ({ page }) => {
    // Click the first row to open drawer
    const firstRow = page.locator('.p-datatable-tbody > tr').first()
    await firstRow.click()

    const drawer = page.locator('.p-sidebar')
    await expect(drawer).toBeVisible({ timeout: 10000 })

    // Close the drawer using the close button (PrimeVue Sidebar close icon)
    const closeButton = drawer.locator('.p-sidebar-close')
    await closeButton.click()

    // Drawer should be hidden
    await expect(drawer).not.toBeVisible({ timeout: 5000 })
  })
})
