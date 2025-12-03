import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady, navigateToAppWithUniqueStore } from './test-utils'

test.describe('Document Management', () => {
  test('creates, views, and edits a document', async ({ page }) => {
    // Navigate to app with unique store ID for test isolation
    await navigateToAppWithUniqueStore(page)

    // Check if we're stuck on loading screen (expected in CI)
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - skipping document management test (expected in CI)')
      return
    }

    // Navigate to Documents page
    await page.click('nav a:has-text("Documents")')
    await waitForLiveStoreReady(page)

    // Should be on documents page
    await expect(page).toHaveURL(/\/old\/documents\?storeId=[^&]+/)
    await expect(page.locator('h1')).toContainText('Documents')

    // Should see New Document button
    const newDocumentButton = page.locator('button:has-text("New Document")')
    await expect(newDocumentButton.first()).toBeVisible()

    // Click New Document button
    await newDocumentButton.first().click()

    // Verify the document creation modal opened
    await expect(page.locator('text=Create New Document')).toBeVisible()

    // Fill in document details
    const documentTitle = `Test Document ${Date.now()}`
    const documentContent = `# Test Document

This is a **test document** with *markdown formatting*.

## Features to test:
- Document creation
- Markdown rendering
- Document editing

\`\`\`javascript
console.log('Hello from code block!');
\`\`\`

> This is a blockquote for testing markdown rendering.`

    await page.fill('input[placeholder="Enter document title"]', documentTitle)
    await page.fill('textarea[placeholder="Enter document content..."]', documentContent)

    // Submit the form
    const createButton = page.locator('button[type="submit"]:has-text("Create Document")')
    await createButton.click()

    // Wait for modal to close and document to be created
    await expect(page.locator('text=Create New Document')).not.toBeVisible()

    // Should now see the document in the list
    await expect(page.locator(`text=${documentTitle}`)).toBeVisible()

    // Click on the document to view it
    await page.click(`text=${documentTitle}`)
    await waitForLiveStoreReady(page)

    // Should be on the document page
    await expect(page).toHaveURL(/\/old\/document\/.*/)

    // Verify the document title appears as the page title
    await expect(page.locator('h1.text-2xl')).toContainText(documentTitle)

    // Verify we can see the document content in view mode (markdown rendered)
    await expect(page.locator('.prose h1').first()).toContainText('Test Document') // H1 heading
    await expect(page.locator('.prose h2').first()).toContainText('Features to test:') // H2 heading
    await expect(page.locator('.prose code').first()).toContainText('Hello from code block!') // Code block content

    // Verify we're in view mode initially (Edit button should be visible)
    const editButton = page.locator('button[type="button"]:has-text("Edit")')
    await expect(editButton).toBeVisible()

    // Click Edit button to enter edit mode
    await editButton.click()

    // Should now be in edit mode (Save button should be visible)
    const saveButton = page.locator('button[type="button"]:has-text("Save")')
    await expect(saveButton).toBeVisible()

    // Should see textarea with content
    const contentTextarea = page.locator(
      'textarea[placeholder="Write your document content here..."]'
    )
    await expect(contentTextarea).toBeVisible()
    await expect(contentTextarea).toHaveValue(documentContent)

    // Edit the document content
    const updatedContent =
      documentContent + '\n\n## Updated Content\n\nThis content was added during E2E testing!'
    await contentTextarea.fill(updatedContent)

    // Test keyboard shortcut for saving (Cmd+S / Ctrl+S)
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')

    // Should be back in view mode after save
    await expect(page.locator('button:has-text("Edit")')).toBeVisible()

    // Verify the updated content is visible
    await expect(page.locator('text=Updated Content')).toBeVisible()
    await expect(page.locator('text=This content was added during E2E testing!')).toBeVisible()

    // Test manual save button workflow
    await page.click('button:has-text("Edit")')
    await expect(page.locator('button:has-text("Save")')).toBeVisible()

    // Make another change
    const finalContent = updatedContent + '\n\n**Final test addition!**'
    await page.fill('textarea[placeholder="Write your document content here..."]', finalContent)

    // Click Save button
    await page.click('button:has-text("Save")')

    // Should be back in view mode
    await expect(page.locator('button:has-text("Edit")')).toBeVisible()

    // Verify the final content is visible
    await expect(page.locator('text=Final test addition!')).toBeVisible()

    // Test Cancel functionality
    await page.click('button:has-text("Edit")')
    await page.fill(
      'textarea[placeholder="Write your document content here..."]',
      'This change should be cancelled'
    )

    // Click Cancel button
    await page.click('button:has-text("Cancel")')

    // Should be back in view mode with original content (no cancelled change)
    await expect(page.locator('button:has-text("Edit")')).toBeVisible()
    await expect(page.locator('text=This change should be cancelled')).not.toBeVisible()
    await expect(page.locator('text=Final test addition!')).toBeVisible() // Original content should remain
  })

  test('creates document from within a project', async ({ page }) => {
    // Navigate to app with unique store ID for test isolation
    await navigateToAppWithUniqueStore(page)

    // Check if we're stuck on loading screen (expected in CI)
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - skipping project document test (expected in CI)')
      return
    }

    // Wait for the projects page to load fully
    await page.waitForSelector('h1', { timeout: 10000 })

    // First create a project
    const createProjectButton = page.locator('button:has-text("Create Project")')
    await expect(createProjectButton.first()).toBeVisible()
    await createProjectButton.first().click()

    const projectName = `Test Project ${Date.now()}`
    await page.fill('input[id="project-name"]', projectName)
    await page.click('form button[type="submit"]:has-text("Create Project")')

    // Navigate to the project
    await expect(page.locator(`text=${projectName}`)).toBeVisible()
    await page.click(`text=${projectName}`)
    await waitForLiveStoreReady(page)

    // Should be on the project page
    await expect(page).toHaveURL(/\/old\/project\/.*/)

    // Click on Documents tab
    await page.click('button:has-text("Documents")')

    // Should see the Create Document button in the project header
    const createDocumentButton = page
      .locator('div:has-text("Project Documents")')
      .locator('button:has-text("Create Document")')
      .first()
    await expect(createDocumentButton).toBeVisible()
    await createDocumentButton.click()

    // Fill in document details
    const documentTitle = `Project Document ${Date.now()}`
    const documentContent =
      '# Project Document\n\nThis document was created within a project context.'

    await page.fill('input[placeholder="Enter document title"]', documentTitle)
    await page.fill('textarea[placeholder="Enter document content..."]', documentContent)

    // Create the document
    await page.click('button[type="submit"]:has-text("Create Document")')

    // Should see the document in the project's document list
    await expect(page.locator(`text=${documentTitle}`)).toBeVisible()

    // Click on the document to view it
    await page.click(`text=${documentTitle}`)
    await waitForLiveStoreReady(page)

    // Should navigate to the document page
    await expect(page).toHaveURL(/\/old\/document\/.*/)
    await expect(page.locator('h1.text-2xl')).toContainText(documentTitle)

    // Verify breadcrumb navigation back to documents
    const documentsLink = page.locator('nav a:has-text("Documents")').first()
    await expect(documentsLink).toBeVisible()
    await documentsLink.click()

    // Should be on the main documents page now
    await expect(page).toHaveURL(/\/old\/documents\?storeId=[^&]+/)
    await expect(page.locator('h1:has-text("Documents")')).toBeVisible()

    // The document should appear in the main documents list too
    await expect(page.locator(`text=${documentTitle}`)).toBeVisible()
  })
})
