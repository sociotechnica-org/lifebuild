import type { ToolResultFormatter } from './types.js'
import { ChorusFormatter } from './chorus-formatter.js'

export class ContactToolFormatter implements ToolResultFormatter {
  private readonly contactTools = [
    'list_contacts',
    'get_contact',
    'search_contacts',
    'create_contact',
    'update_contact',
    'delete_contact',
    'get_project_contacts',
    'get_contact_projects',
    'add_contact_to_project',
    'remove_contact_from_project',
    'get_project_email_list',
    'find_contacts_by_email',
    'get_project_contact_emails',
    'validate_email_list',
    'suggest_contacts_from_emails',
  ]

  canFormat(toolName: string): boolean {
    return this.contactTools.includes(toolName)
  }

  format(toolResult: any, toolCall: any): string {
    const toolName = toolCall.function.name

    switch (toolName) {
      case 'list_contacts':
        return this.formatListContacts(toolResult)
      case 'get_contact':
        return this.formatGetContact(toolResult)
      case 'search_contacts':
        return this.formatSearchContacts(toolResult)
      case 'create_contact':
        return this.formatCreateContact(toolResult)
      case 'update_contact':
        return this.formatUpdateContact(toolResult)
      case 'delete_contact':
        return this.formatDeleteContact(toolResult)
      case 'get_project_contacts':
        return this.formatGetProjectContacts(toolResult)
      case 'get_contact_projects':
        return this.formatGetContactProjects(toolResult)
      case 'add_contact_to_project':
        return this.formatAddContactToProject(toolResult)
      case 'remove_contact_from_project':
        return this.formatRemoveContactFromProject(toolResult)
      case 'get_project_email_list':
        return this.formatGetProjectEmailList(toolResult)
      case 'find_contacts_by_email':
        return this.formatFindContactsByEmail(toolResult)
      case 'get_project_contact_emails':
        return this.formatGetProjectContactEmails(toolResult)
      case 'validate_email_list':
        return this.formatValidateEmailList(toolResult)
      case 'suggest_contacts_from_emails':
        return this.formatSuggestContactsFromEmails(toolResult)
      default:
        return `Contact operation completed: ${JSON.stringify(toolResult, null, 2)}`
    }
  }

  private formatListContacts(result: any): string {
    if (!result.contacts?.length) {
      return 'No contacts found'
    }
    const contactList = result.contacts
      .map((c: any) => `${c.name} (${c.email}) - ID: ${ChorusFormatter.contact(c.id)}`)
      .join('\n• ')
    return `Contacts:\n• ${contactList}`
  }

  private formatGetContact(result: any): string {
    if (!result.contact) {
      return 'Contact not found'
    }
    const c = result.contact
    let message = `Contact details:\n• ID: ${ChorusFormatter.contact(c.id)}\n• Name: ${c.name}\n• Email: ${c.email}`
    if (c.company) message += `\n• Company: ${c.company}`
    if (c.role) message += `\n• Role: ${c.role}`
    if (c.phone) message += `\n• Phone: ${c.phone}`
    if (c.notes) message += `\n• Notes: ${c.notes}`
    return message
  }

  private formatSearchContacts(result: any): string {
    if (!result.results?.length) {
      return 'No matching contacts found'
    }
    const searchResults = result.results
      .map((c: any) => `${c.name} (${c.email}) - ID: ${ChorusFormatter.contact(c.id)}`)
      .join('\n• ')
    return `Search results:\n• ${searchResults}`
  }

  private formatCreateContact(result: any): string {
    if (result?.success === false) {
      return `Contact creation failed: ${result?.error ?? 'Unknown error'}`
    }
    return `Contact created successfully:\n• ID: ${ChorusFormatter.contact(result.contact.id)}\n• Name: ${result.contact.name}\n• Email: ${result.contact.email}`
  }

  private formatUpdateContact(result: any): string {
    if (result?.success === false) {
      return `Contact update failed: ${result?.error ?? 'Unknown error'}`
    }
    return `Contact updated successfully:\n• ID: ${ChorusFormatter.contact(result.contact.id)}\n• Name: ${result.contact.name}`
  }

  private formatDeleteContact(result: any): string {
    if (result?.success === false) {
      return `Contact deletion failed: ${result?.error ?? 'Unknown error'}`
    }
    return `Contact deleted successfully: ${result.contactId}`
  }

  private formatGetProjectContacts(result: any): string {
    if (!result.contacts?.length) {
      return 'No contacts found for this project'
    }
    const contactList = result.contacts
      .map((c: any) => `${c.name} (${c.email}) - ID: ${ChorusFormatter.contact(c.id)}`)
      .join('\n• ')
    return `Project contacts:\n• ${contactList}`
  }

  private formatGetContactProjects(result: any): string {
    if (!result.projects?.length) {
      return 'Contact is not associated with any projects'
    }
    const projectList = result.projects
      .map((p: any) => `${p.name} - ID: ${ChorusFormatter.project(p.id)}`)
      .join('\n• ')
    return `Contact's projects:\n• ${projectList}`
  }

  private formatAddContactToProject(result: any): string {
    if (result?.success === false) {
      return `Failed to add contact to project: ${result?.error ?? 'Unknown error'}`
    }
    return `Contact successfully added to project`
  }

  private formatRemoveContactFromProject(result: any): string {
    if (result?.success === false) {
      return `Failed to remove contact from project: ${result?.error ?? 'Unknown error'}`
    }
    return `Contact successfully removed from project`
  }

  private formatGetProjectEmailList(result: any): string {
    if (!result.emails?.length) {
      return 'No email addresses found for this project'
    }
    const emailList = result.emails.map((email: string) => `• ${email}`).join('\n')
    return `Project email list:\n${emailList}`
  }

  private formatFindContactsByEmail(result: any): string {
    if (!result.contacts?.length) {
      return 'No contacts found with the specified email addresses'
    }
    const contactList = result.contacts
      .map((c: any) => `${c.name} (${c.email}) - ID: ${ChorusFormatter.contact(c.id)}`)
      .join('\n• ')
    return `Found contacts:\n• ${contactList}`
  }

  private formatGetProjectContactEmails(result: any): string {
    if (!result.emails?.length) {
      return 'No contact emails found for this project'
    }
    return `Project contact emails:\n• ${result.emails.join('\n• ')}`
  }

  private formatValidateEmailList(result: any): string {
    let message = 'Email validation results:\n'

    if (result.valid?.length) {
      message += `\nValid emails (${result.valid.length}):\n• ${result.valid.join('\n• ')}`
    }

    if (result.invalid?.length) {
      message += `\n\nInvalid emails (${result.invalid.length}):\n• ${result.invalid.join('\n• ')}`
    }

    if (result.duplicates?.length) {
      message += `\n\nDuplicate emails (${result.duplicates.length}):\n• ${result.duplicates.join('\n• ')}`
    }

    return message
  }

  private formatSuggestContactsFromEmails(result: any): string {
    if (!result.suggestions?.length) {
      return 'No contact suggestions generated'
    }

    const suggestionList = result.suggestions
      .map((s: any) => {
        let item = `Email: ${s.email}`
        if (s.suggestedName) item += ` → Suggested name: ${s.suggestedName}`
        if (s.suggestedCompany) item += ` (${s.suggestedCompany})`
        return item
      })
      .join('\n• ')

    return `Contact suggestions:\n• ${suggestionList}`
  }
}
