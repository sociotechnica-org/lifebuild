/**
 * Utility for formatting CHORUS_TAG elements in tool outputs
 * These tags make tool outputs clickable and navigable on the client
 */

export interface ChorusTag {
  type: 'document' | 'project' | 'task' | 'file'
  id?: string
  path?: string
}

export class ChorusFormatter {
  /**
   * Wraps a document ID in a CHORUS_TAG for navigation to document editor
   */
  static document(documentId: string, displayText?: string): string {
    const text = displayText || documentId
    return `<CHORUS_TAG>document:${documentId}</CHORUS_TAG>`
  }

  /**
   * Wraps a project ID in a CHORUS_TAG for navigation to project page
   */
  static project(projectId: string, displayText?: string): string {
    const text = displayText || projectId
    return `<CHORUS_TAG>project:${projectId}</CHORUS_TAG>`
  }

  /**
   * Wraps a task ID in a CHORUS_TAG for navigation to task details
   */
  static task(taskId: string, displayText?: string): string {
    const text = displayText || taskId
    return `<CHORUS_TAG>task:${taskId}</CHORUS_TAG>`
  }

  /**
   * Wraps a file path in a CHORUS_TAG for file system navigation
   */
  static file(filePath: string, displayText?: string): string {
    const text = displayText || filePath
    return `<CHORUS_TAG>${filePath}</CHORUS_TAG>`
  }

  /**
   * Creates a formatted reference with both readable text and clickable ID
   * Example: "Document: My Document (ID: <CHORUS_TAG>document:123</CHORUS_TAG>)"
   */
  static reference(type: 'document' | 'project' | 'task', id: string, title?: string): string {
    const chorusTag = this[type](id)
    if (title) {
      return `${title} (ID: ${chorusTag})`
    }
    return `ID: ${chorusTag}`
  }
}
