import type { ToolResultFormatter } from './types.js'

/**
 * Format contact tool results for LLM consumption
 */
export class ContactFormatter implements ToolResultFormatter {
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

  format(result: any, toolCall: any): string {
    switch (toolCall.function.name) {
      case 'list_contacts':
        return this.formatContactList(result)

      case 'get_contact':
        return this.formatContactDetail(result)

      case 'search_contacts':
        return this.formatSearchResults(result)

      case 'create_contact':
        return this.formatContactCreated(result)

      case 'update_contact':
        return this.formatContactUpdated(result)

      case 'delete_contact':
        return this.formatContactDeleted(result)

      case 'get_project_contacts':
        return this.formatProjectContacts(result)

      case 'get_contact_projects':
        return this.formatContactProjects(result)

      case 'add_contact_to_project':
        return this.formatContactProjectAdded(result)

      case 'remove_contact_from_project':
        return this.formatContactProjectRemoved(result)

      case 'get_project_email_list':
        return this.formatProjectEmailList(result)

      case 'find_contacts_by_email':
        return this.formatEmailMatching(result)

      case 'get_project_contact_emails':
        return this.formatProjectEmailList(result) // Same format as get_project_email_list

      case 'validate_email_list':
        return this.formatEmailValidation(result)

      case 'suggest_contacts_from_emails':
        return this.formatContactSuggestions(result)

      default:
        return this.formatGeneric(result)
    }
  }

  private formatContactList(result: any): string {
    if (!result.success) {
      return `❌ Failed to retrieve contacts: ${result.error || 'Unknown error'}`
    }

    const contacts = result.contacts || []
    if (contacts.length === 0) {
      return '📝 No contacts found. You can create contacts using the create_contact tool.'
    }

    const contactLines = contacts.map(
      (contact: any, index: number) =>
        `${index + 1}. **${contact.name}** (${contact.email}) - ID: ${contact.id}`
    )

    return `📋 **Found ${contacts.length} contact${contacts.length === 1 ? '' : 's'}:**\n\n${contactLines.join('\n')}`
  }

  private formatContactDetail(result: any): string {
    if (!result.success) {
      return `❌ Failed to retrieve contact: ${result.error || 'Unknown error'}`
    }

    const contact = result.contact
    if (!contact) {
      return '❌ Contact not found'
    }

    const projectsList =
      contact.projects?.length > 0
        ? contact.projects.map((p: any) => `• ${p.name} (${p.id})`).join('\n')
        : '• No projects associated'

    return `👤 **Contact Details:**
**Name:** ${contact.name}
**Email:** ${contact.email}
**ID:** ${contact.id}
**Created:** ${new Date(contact.createdAt).toLocaleDateString()}
**Updated:** ${new Date(contact.updatedAt).toLocaleDateString()}

**Associated Projects:**
${projectsList}`
  }

  private formatSearchResults(result: any): string {
    if (!result.success) {
      return `❌ Search failed: ${result.error || 'Unknown error'}`
    }

    const contacts = result.contacts || []
    if (contacts.length === 0) {
      return `🔍 No contacts found matching "${result.query}". You can create a new contact with this information using the create_contact tool.`
    }

    const contactLines = contacts.map(
      (contact: any, index: number) =>
        `${index + 1}. **${contact.name}** (${contact.email}) - ID: ${contact.id}`
    )

    return `🔍 **Found ${contacts.length} contact${contacts.length === 1 ? '' : 's'} matching "${result.query}":**\n\n${contactLines.join('\n')}`
  }

  private formatContactCreated(result: any): string {
    if (!result.success) {
      return `❌ Failed to create contact: ${result.error || 'Unknown error'}`
    }

    const contact = result.contact
    return `✅ **Contact created successfully:**
**Name:** ${contact.name}
**Email:** ${contact.email}
**ID:** ${contact.id}`
  }

  private formatContactUpdated(result: any): string {
    if (!result.success) {
      return `❌ Failed to update contact: ${result.error || 'Unknown error'}`
    }

    const contact = result.contact
    return `✅ **Contact updated successfully:**
**Name:** ${contact.name}
**Email:** ${contact.email}
**ID:** ${contact.id}`
  }

  private formatContactDeleted(result: any): string {
    if (!result.success) {
      return `❌ Failed to delete contact: ${result.error || 'Unknown error'}`
    }

    return `✅ ${result.message || 'Contact deleted successfully'}`
  }

  private formatProjectContacts(result: any): string {
    if (!result.success) {
      return `❌ Failed to retrieve project contacts: ${result.error || 'Unknown error'}`
    }

    const contacts = result.contacts || []
    if (contacts.length === 0) {
      return `📝 No contacts associated with project ${result.projectId}. You can add contacts using the add_contact_to_project tool.`
    }

    const contactLines = contacts.map(
      (contact: any, index: number) =>
        `${index + 1}. **${contact.name}** (${contact.email}) - ID: ${contact.id}`
    )

    return `📋 **Found ${contacts.length} contact${contacts.length === 1 ? '' : 's'} for project ${result.projectId}:**\n\n${contactLines.join('\n')}`
  }

  private formatContactProjects(result: any): string {
    if (!result.success) {
      return `❌ Failed to retrieve contact projects: ${result.error || 'Unknown error'}`
    }

    const projects = result.projects || []
    const contact = result.contact

    if (projects.length === 0) {
      return `📝 Contact **${contact?.name || 'Unknown'}** (${contact?.email || 'N/A'}) is not associated with any projects. You can add them to projects using the add_contact_to_project tool.`
    }

    const projectLines = projects.map(
      (project: any, index: number) =>
        `${index + 1}. **${project.name}** - ${project.description || 'No description'} (ID: ${project.id})`
    )

    return `📋 **Contact ${contact?.name || 'Unknown'} (${contact?.email || 'N/A'}) is associated with ${projects.length} project${projects.length === 1 ? '' : 's'}:**\n\n${projectLines.join('\n')}`
  }

  private formatContactProjectAdded(result: any): string {
    if (!result.success) {
      return `❌ Failed to add contact to project: ${result.error || 'Unknown error'}`
    }

    return `✅ ${result.message || 'Contact added to project successfully'}`
  }

  private formatContactProjectRemoved(result: any): string {
    if (!result.success) {
      return `❌ Failed to remove contact from project: ${result.error || 'Unknown error'}`
    }

    return `✅ ${result.message || 'Contact removed from project successfully'}`
  }

  private formatProjectEmailList(result: any): string {
    if (!result.success) {
      return `❌ Failed to retrieve project emails: ${result.error || 'Unknown error'}`
    }

    const emails = result.emails || []
    if (emails.length === 0) {
      return `📧 No email addresses found for project ${result.projectId}. Add contacts to this project first.`
    }

    return `📧 **Email list for project ${result.projectId} (${result.count} contact${result.count === 1 ? '' : 's'}):**

${result.formattedList}

**Individual emails:**
${emails.map((email: string, index: number) => `${index + 1}. ${email}`).join('\n')}`
  }

  private formatEmailMatching(result: any): string {
    if (!result.success) {
      return `❌ Email matching failed: ${result.error || 'Unknown error'}`
    }

    const summary = result.summary
    const results = result.results || []

    let output = `🔍 **Email matching results:**
**Total emails:** ${summary.total}
**Matched:** ${summary.matched}
**Unmatched:** ${summary.unmatched}

`

    if (summary.matched > 0) {
      const matchedResults = results.filter((r: any) => r.matched)
      output += `**✅ Matched contacts:**
${matchedResults.map((r: any, i: number) => `${i + 1}. ${r.email} → **${r.contact.name}** (ID: ${r.contact.id})`).join('\n')}

`
    }

    if (summary.unmatched > 0) {
      output += `**❌ Unmatched emails:**
${summary.unmatchedEmails.map((email: string, i: number) => `${i + 1}. ${email}`).join('\n')}

*These emails could be added as new contacts using the create_contact tool.*`
    }

    return output
  }

  private formatEmailValidation(result: any): string {
    if (!result.success) {
      return `❌ Email validation failed: ${result.error || 'Unknown error'}`
    }

    const summary = result.summary
    const results = result.results || []

    let output = `✉️ **Email validation results:**
**Total emails:** ${summary.total}
**Valid:** ${summary.valid}
**Invalid:** ${summary.invalid}

`

    if (summary.valid > 0) {
      output += `**✅ Valid emails:**
${summary.validEmails.map((email: string, i: number) => `${i + 1}. ${email}`).join('\n')}

`
    }

    if (summary.invalid > 0) {
      const invalidResults = results.filter((r: any) => !r.valid)
      output += `**❌ Invalid emails:**
${invalidResults.map((r: any, i: number) => `${i + 1}. ${r.original} - ${r.error}`).join('\n')}`
    }

    return output
  }

  private formatContactSuggestions(result: any): string {
    if (!result.success) {
      return `❌ Failed to generate contact suggestions: ${result.error || 'Unknown error'}`
    }

    const summary = result.summary
    const suggestions = result.suggestions || []

    if (suggestions.length === 0) {
      return `✅ All provided email addresses already have corresponding contacts in the system.`
    }

    let output = `💡 **Contact creation suggestions:**
**Total emails processed:** ${summary.totalEmails}
**Valid emails:** ${summary.validEmails}
**Existing contacts:** ${summary.existingContacts}
**New suggestions:** ${summary.newSuggestions}

**Suggested new contacts:**
`

    suggestions.forEach((suggestion: any, index: number) => {
      output += `${index + 1}. **${suggestion.suggestedName}** (${suggestion.email})\n`
    })

    output += `\n*Use the create_contact tool to add these contacts to the system.*`

    return output
  }

  private formatGeneric(result: any): string {
    if (!result.success) {
      return `❌ Operation failed: ${result.error || 'Unknown error'}`
    }

    return `✅ Operation completed successfully${result.message ? ': ' + result.message : ''}`
  }
}
