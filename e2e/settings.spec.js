import { test, expect } from '@playwright/test'

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Navigate to Settings
    await page.click('button:has-text("Settings")')
    // Settings heading is "$ CONFIGURATION" not "Settings"
    await expect(page.locator('h2:has-text("CONFIGURATION")')).toBeVisible()
  })

  test('displays settings form with default values', async ({ page }) => {
    // Check that Loki URL input exists with default value
    const lokiInput = page.locator('input[placeholder*="request_id"]').first()
    await expect(lokiInput).toBeVisible()

    const lokiValue = await lokiInput.inputValue()
    expect(lokiValue).toContain('{request_id}')
    expect(lokiValue).toContain('{from}')
    expect(lokiValue).toContain('{to}')
  })

  test('can modify and save configuration', async ({ page }) => {
    // Find Coroot URL input by placeholder or label (3rd text input)
    const corootInput = page.locator('input[type="text"]').nth(2)

    // Enter custom Coroot URL
    await corootInput.fill('https://custom-coroot.example.com')

    // Click Save button
    await page.click('button:has-text("Save")')

    // Wait for success message (use exact match to avoid strict mode)
    await expect(page.getByText('Configuration saved successfully')).toBeVisible({ timeout: 3000 })

    // Reload page
    await page.reload()

    // Navigate back to Settings
    await page.click('button:has-text("Settings")')

    // Verify the value persisted
    const corootInputAfterReload = page.locator('input[type="text"]').nth(2)
    await expect(corootInputAfterReload).toHaveValue('https://custom-coroot.example.com')
  })

  test('can reset to default values', async ({ page }) => {
    // Modify Loki escape checkbox
    const escapeCheckbox = page.locator('input[type="checkbox"]').first()
    const initialState = await escapeCheckbox.isChecked()

    // Toggle it
    await escapeCheckbox.click()

    // Verify it changed
    expect(await escapeCheckbox.isChecked()).not.toBe(initialState)

    // Click Reset button
    await page.click('button:has-text("Reset")')

    // Wait for modal to appear and confirm reset
    const modal = page.locator('.fixed.inset-0.z-\\[100\\]')
    await expect(modal).toBeVisible()

    // Click the Reset button inside the modal (bg-cyber-magenta button)
    await modal.locator('button', { hasText: 'Reset' }).click()

    // Wait for success message (reset uses the same success message as save)
    await expect(page.getByText('Configuration saved successfully')).toBeVisible({ timeout: 3000 })

    // Verify checkbox returned to default (true)
    await expect(escapeCheckbox).toBeChecked()
  })

  test('displays all URL input fields', async ({ page }) => {
    // Check all 4 main URL inputs are present
    const inputs = page.locator('input[type="text"]')
    await expect(inputs).toHaveCount(4)

    // Verify labels/headers for each section using exact i18n texts
    await expect(page.getByText('Grafana Request ID Dashboard URL')).toBeVisible()
    await expect(page.getByText('Grafana Path Dashboard URL')).toBeVisible()
    await expect(page.getByText('Coroot Base URL')).toBeVisible()
    await expect(page.getByText('Sentry Trace URL')).toBeVisible()
  })

  test('can navigate back to analyzer', async ({ page }) => {
    // Click Back button
    await page.click('button:has-text("Back")')

    // Should be back on home view - check for upload icon
    await expect(page.locator('.pi-cloud-upload')).toBeVisible()
  })
})
