import { test, expect } from '@playwright/test'

test.describe('Project-Contact Association', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')

    // Wait for the app to load
    await page.waitForSelector('[data-testid="app-loaded"]', { timeout: 10000 })
  })

  test('should add contact to project from project view', async ({ page }) => {
    // Create a project first
    await page.click('text=Projects')
    await page.click('button:has-text("New Project")')
    await page.fill('input[placeholder*="project name"]', 'Test Project')
    await page.fill('textarea[placeholder*="description"]', 'Test Description')
    await page.click('button:has-text("Create")')

    // Navigate to the project
    await page.click('text=Test Project')

    // Go to contacts tab
    await page.click('button:has-text("Contacts")')

    // Should show no contacts initially
    await expect(page.locator('text=No contacts associated with this project')).toBeVisible()

    // Create a contact first
    await page.click('text=Contacts', { exact: true })
    await page.fill('input[placeholder*="name"]', 'John Doe')
    await page.fill('input[type="email"]', 'john@example.com')
    await page.click('button:has-text("Create Contact")')

    // Go back to project
    await page.click('text=Projects')
    await page.click('text=Test Project')
    await page.click('button:has-text("Contacts")')

    // Add contact to project
    await page.click('button:has-text("Add Contact")')
    await page.click('text=John Doe')
    await page.click('button:has-text("Add 1 Contact")')

    // Verify contact appears in project
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=john@example.com')).toBeVisible()
  })

  test('should add project to contact from contact detail view', async ({ page }) => {
    // Create a contact first
    await page.click('text=Contacts')
    await page.fill('input[placeholder*="name"]', 'Jane Smith')
    await page.fill('input[type="email"]', 'jane@example.com')
    await page.click('button:has-text("Create Contact")')

    // Create a project
    await page.click('text=Projects')
    await page.click('button:has-text("New Project")')
    await page.fill('input[placeholder*="project name"]', 'Another Project')
    await page.click('button:has-text("Create")')

    // Navigate to contact detail
    await page.click('text=Contacts')
    await page.click('text=Jane Smith')

    // Should show no projects initially
    await expect(page.locator('text=Not associated with any projects')).toBeVisible()

    // Add contact to project
    await page.click('button:has-text("Add to Project")')
    await page.click('text=Another Project')
    await page.click('button:has-text("Add to 1 Project")')

    // Verify project appears in contact detail
    await expect(page.locator('text=Another Project')).toBeVisible()
  })

  test('should remove contact from project', async ({ page }) => {
    // Create contact and project
    await page.click('text=Contacts')
    await page.fill('input[placeholder*="name"]', 'Bob Wilson')
    await page.fill('input[type="email"]', 'bob@example.com')
    await page.click('button:has-text("Create Contact")')

    await page.click('text=Projects')
    await page.click('button:has-text("New Project")')
    await page.fill('input[placeholder*="project name"]', 'Remove Test Project')
    await page.click('button:has-text("Create")')

    // Add contact to project
    await page.click('text=Remove Test Project')
    await page.click('button:has-text("Contacts")')
    await page.click('button:has-text("Add Contact")')
    await page.click('text=Bob Wilson')
    await page.click('button:has-text("Add 1 Contact")')

    // Verify contact is added
    await expect(page.locator('text=Bob Wilson')).toBeVisible()

    // Remove contact
    await page.click('button:has-text("Remove")')

    // Verify contact is removed
    await expect(page.locator('text=No contacts associated with this project')).toBeVisible()
  })

  test('should show project count in contact list', async ({ page }) => {
    // Create multiple contacts and projects
    await page.click('text=Contacts')
    await page.fill('input[placeholder*="name"]', 'Alice Brown')
    await page.fill('input[type="email"]', 'alice@example.com')
    await page.click('button:has-text("Create Contact")')

    // Create two projects
    await page.click('text=Projects')
    await page.click('button:has-text("New Project")')
    await page.fill('input[placeholder*="project name"]', 'Project A')
    await page.click('button:has-text("Create")')

    await page.click('button:has-text("New Project")')
    await page.fill('input[placeholder*="project name"]', 'Project B')
    await page.click('button:has-text("Create")')

    // Add contact to both projects
    await page.click('text=Project A')
    await page.click('button:has-text("Contacts")')
    await page.click('button:has-text("Add Contact")')
    await page.click('text=Alice Brown')
    await page.click('button:has-text("Add 1 Contact")')

    await page.click('text=Projects')
    await page.click('text=Project B')
    await page.click('button:has-text("Contacts")')
    await page.click('button:has-text("Add Contact")')
    await page.click('text=Alice Brown')
    await page.click('button:has-text("Add 1 Contact")')

    // Go to contacts list and verify project count
    await page.click('text=Contacts', { exact: true })
    await expect(page.locator('text=2 projects')).toBeVisible()
  })

  test('should prevent adding same contact twice to project', async ({ page }) => {
    // Create contact and project
    await page.click('text=Contacts')
    await page.fill('input[placeholder*="name"]', 'Duplicate Test')
    await page.fill('input[type="email"]', 'duplicate@example.com')
    await page.click('button:has-text("Create Contact")')

    await page.click('text=Projects')
    await page.click('button:has-text("New Project")')
    await page.fill('input[placeholder*="project name"]', 'Duplicate Project')
    await page.click('button:has-text("Create")')

    // Add contact to project
    await page.click('text=Duplicate Project')
    await page.click('button:has-text("Contacts")')
    await page.click('button:has-text("Add Contact")')
    await page.click('text=Duplicate Test')
    await page.click('button:has-text("Add 1 Contact")')

    // Try to add again - contact should not appear in picker
    await page.click('button:has-text("Add Contact")')
    await expect(page.locator('text=All contacts are already associated')).toBeVisible()
  })
})
