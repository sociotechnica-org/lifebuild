import type { ToolResultFormatter } from './types.js'
import { ChorusFormatter } from './chorus-formatter.js'

export class DocumentToolFormatter implements ToolResultFormatter {
  private readonly documentTools = [
    'list_documents',
    'read_document',
    'search_documents',
    'get_project_documents',
    'search_project_documents',
    'create_document',
    'update_document',
    'archive_document',
    'add_document_to_project',
    'remove_document_from_project',
  ]

  canFormat(toolName: string): boolean {
    return this.documentTools.includes(toolName)
  }

  format(toolResult: any, toolCall: any): string {
    const toolName = toolCall.function.name

    switch (toolName) {
      case 'list_documents':
        return this.formatListDocuments(toolResult)
      case 'read_document':
        return this.formatReadDocument(toolResult)
      case 'search_documents':
        return this.formatSearchDocuments(toolResult)
      case 'get_project_documents':
        return this.formatGetProjectDocuments(toolResult)
      case 'search_project_documents':
        return this.formatSearchProjectDocuments(toolResult)
      case 'create_document':
        return this.formatCreateDocument(toolResult)
      case 'update_document':
        return this.formatUpdateDocument(toolResult)
      case 'archive_document':
        return this.formatArchiveDocument(toolResult)
      case 'add_document_to_project':
        return this.formatAddDocumentToProject(toolResult)
      case 'remove_document_from_project':
        return this.formatRemoveDocumentFromProject(toolResult)
      default:
        return `Document operation completed: ${JSON.stringify(toolResult, null, 2)}`
    }
  }

  private formatListDocuments(result: any): string {
    const documentList =
      result.documents
        ?.map(
          (d: any) =>
            `${d.title} (ID: ${ChorusFormatter.document(d.id)}) - Updated: ${new Date(d.updatedAt).toLocaleDateString()}`
        )
        .join('\n• ') || 'No documents found'
    return `Available documents:\n• ${documentList}`
  }

  private formatReadDocument(result: any): string {
    if (!result.document) {
      return 'Document not found'
    }
    const doc = result.document
    return `Document: ${doc.title}\n\nContent:\n${doc.content}`
  }

  private formatSearchDocuments(result: any): string {
    const searchResults =
      result.results
        ?.map(
          (r: any) => `${r.title} (ID: ${ChorusFormatter.document(r.id)})\n  Snippet: ${r.snippet}`
        )
        .join('\n\n• ') || 'No matching documents found'
    return `Search results:\n• ${searchResults}`
  }

  private formatGetProjectDocuments(result: any): string {
    const documentList =
      result.documents
        ?.map(
          (d: any) =>
            `${d.title} (ID: ${ChorusFormatter.document(d.id)}) - Created: ${new Date(d.createdAt).toLocaleDateString()}`
        )
        .join('\n• ') || 'No documents found in project'
    return `Project documents:\n• ${documentList}`
  }

  private formatSearchProjectDocuments(result: any): string {
    const searchResults =
      result.results
        ?.map(
          (r: any) => `${r.title} (ID: ${ChorusFormatter.document(r.id)})\n  Snippet: ${r.snippet}`
        )
        .join('\n\n• ') || 'No matching documents found in project'
    return `Project search results:\n• ${searchResults}`
  }

  private formatCreateDocument(result: any): string {
    return `Document created successfully:\n• Title: ${result.title}\n• Document ID: ${ChorusFormatter.document(
      result.documentId
    )}\n• Content length: ${result.content?.length || 0} characters`
  }

  private formatUpdateDocument(result: any): string {
    if (!result.document?.id) {
      return 'Document update failed: Document ID not found'
    }
    let message = `Document updated successfully:\n• Document ID: ${ChorusFormatter.document(result.document.id)}`
    if (result.document?.title) {
      message += `\n• New title: ${result.document.title}`
    }
    if (result.document?.content !== undefined) {
      message += `\n• Content updated (${result.document.content.length} characters)`
    }
    return message
  }

  private formatArchiveDocument(result: any): string {
    if (!result.document?.id) {
      return 'Document archive failed: Document ID not found'
    }
    return `Document archived successfully:\n• Document ID: ${ChorusFormatter.document(result.document.id)}`
  }

  private formatAddDocumentToProject(result: any): string {
    if (!result.association?.documentId || !result.association?.projectId) {
      return 'Document add to project failed: Missing document or project ID'
    }
    return `Document successfully added to project:\n• Document ID: ${ChorusFormatter.document(result.association.documentId)}\n• Project ID: ${ChorusFormatter.project(result.association.projectId)}`
  }

  private formatRemoveDocumentFromProject(result: any): string {
    if (!result.association?.documentId || !result.association?.projectId) {
      return 'Document remove from project failed: Missing document or project ID'
    }
    return `Document successfully removed from project:\n• Document ID: ${ChorusFormatter.document(result.association.documentId)}\n• Project ID: ${ChorusFormatter.project(result.association.projectId)}`
  }
}
