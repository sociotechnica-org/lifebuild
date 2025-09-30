/**
 * Utility for formatting CHORUS_TAG elements in tool outputs
 * These tags make tool outputs clickable and navigable on the client
 */

export interface ChorusTag {
  type: 'document' | 'project' | 'task' | 'file' | 'contact'
  id?: string
  path?: string
}

interface ChorusFormatterOptions {
  label?: string
}

export class ChorusFormatter {
  /**
   * Wraps a document ID in a CHORUS_TAG for navigation to document editor
   */
  static document(documentId: string, options?: ChorusFormatterOptions): string {
    return this.wrap('document', documentId, options)
  }

  /**
   * Wraps a project ID in a CHORUS_TAG for navigation to project page
   */
  static project(projectId: string, options?: ChorusFormatterOptions): string {
    return this.wrap('project', projectId, options)
  }

  /**
   * Wraps a task ID in a CHORUS_TAG for navigation to task details
   */
  static task(taskId: string, options?: ChorusFormatterOptions): string {
    return this.wrap('task', taskId, options)
  }

  /**
   * Wraps a contact ID in a CHORUS_TAG for navigation to contact details
   */
  static contact(contactId: string, options?: ChorusFormatterOptions): string {
    return this.wrap('contact', contactId, options)
  }

  /**
   * Wraps a file path in a CHORUS_TAG for file system navigation
   */
  static file(filePath: string, options?: ChorusFormatterOptions): string {
    return this.wrap('file', filePath, options)
  }

  /**
   * Creates a formatted reference with both readable text and clickable ID
   * Example: "Document: My Document (ID: <CHORUS_TAG path=\"document:123\">123</CHORUS_TAG>)"
   */
  static reference(
    type: 'document' | 'project' | 'task' | 'contact',
    id: string,
    title?: string
  ): string {
    const chorusTag = this[type](id)
    if (title) {
      return `${title} (ID: ${chorusTag})`
    }
    return `ID: ${chorusTag}`
  }

  private static wrap(
    type: ChorusTag['type'],
    rawValue: string,
    options?: ChorusFormatterOptions
  ): string {
    const value = rawValue ?? ''
    const label = options?.label ?? value

    const path = type === 'file' ? value : `${type}:${value}`
    const escapedPath = this.escapeHtml(path)
    const escapedLabel = this.escapeHtml(label)

    return `<CHORUS_TAG path="${escapedPath}">${escapedLabel}</CHORUS_TAG>`
  }

  private static escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/'/g, '&#39;')
  }
}
