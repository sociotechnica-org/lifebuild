import { test, expect } from '@playwright/test'

test.describe('Recurring Tasks', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project page where recurring tasks should be visible
    await page.goto('/projects')

    // Create a test project if needed (assuming we need one)
    const createProjectButton = page.getByText('Create Project')
    if (await createProjectButton.isVisible()) {
      await createProjectButton.click()
      await page.fill('input[placeholder*="project name"]', 'Test Project for Recurring Tasks')
      await page.fill(
        'textarea[placeholder*="description"]',
        'Test project for recurring tasks functionality'
      )
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/projects\/.*/)
    } else {
      // Click on first project if one exists
      const firstProject = page.locator('[data-testid="project-card"]').first()
      if (await firstProject.isVisible()) {
        await firstProject.click()
      }
    }
  })

  test('should show recurring tasks column in project workspace', async ({ page }) => {
    // Wait for page to load and look for recurring tasks column
    await page.waitForSelector('text=Recurring Tasks', { timeout: 10000 })

    // Verify the column exists and has the right elements
    await expect(page.getByText('Recurring Tasks')).toBeVisible()
    await expect(page.getByText('Automated tasks that run on schedule')).toBeVisible()
    await expect(page.getByText('No recurring tasks yet')).toBeVisible()
    await expect(page.getByText('Create Recurring Task')).toBeVisible()
  })

  test('should open and close recurring task form', async ({ page }) => {
    // Click the create button
    await page.getByText('Create Recurring Task').click()

    // Verify modal opened
    await expect(page.getByText('Create Recurring Task')).toBeVisible()
    await expect(page.getByLabelText('Name *')).toBeVisible()
    await expect(page.getByLabelText('Prompt *')).toBeVisible()

    // Close modal with X button
    await page.click('button[aria-label="Close modal"]')

    // Verify modal closed
    await expect(page.getByText('Create Recurring Task')).not.toBeVisible()
  })

  test('should create a recurring task successfully', async ({ page }) => {
    // Click create button
    await page.getByText('Create Recurring Task').click()

    // Fill out the form
    await page.fill('input[placeholder*="Daily standup"]', 'Daily Status Update')
    await page.fill('textarea[placeholder*="description"]', 'Creates daily status update tasks')
    await page.fill(
      'textarea[placeholder*="Create a task"]',
      "Create a task to summarize yesterday's progress and plan today's work"
    )

    // Select 4 hours interval
    await page.selectOption('select#recurring-task-interval', '4')

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for modal to close and task to appear
    await expect(page.getByText('Create Recurring Task')).not.toBeVisible()
    await expect(page.getByText('Daily Status Update')).toBeVisible()
    await expect(page.getByText('Every 4 hours')).toBeVisible()
    await expect(page.getByText('in')).toBeVisible() // Should show "Next: in X hours"
  })

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Click create button
    await page.getByText('Create Recurring Task').click()

    // Try to submit without filling required fields
    await page.click('button[type="submit"]')

    // Verify validation errors
    await expect(page.getByText('Name is required')).toBeVisible()
    await expect(page.getByText('Prompt is required')).toBeVisible()

    // Verify submit button is disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
  })

  test('should enable submit button when required fields are filled', async ({ page }) => {
    // Click create button
    await page.getByText('Create Recurring Task').click()

    // Submit button should be disabled initially
    await expect(page.locator('button[type="submit"]')).toBeDisabled()

    // Fill name field
    await page.fill('input[placeholder*="Daily standup"]', 'Test Task')

    // Submit button should still be disabled
    await expect(page.locator('button[type="submit"]')).toBeDisabled()

    // Fill prompt field
    await page.fill('textarea[placeholder*="Create a task"]', 'Test prompt')

    // Submit button should now be enabled
    await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
  })
})
