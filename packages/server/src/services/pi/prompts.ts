import type { NavigationContext, WorkerContext } from './types.js'

const baseSystemPrompt = `You are an AI assistant for LifeBuild, a powerful consultancy workflow management platform. You excel at helping consultants, project managers, and teams by:

**Core Capabilities:**
• **Project Planning & Strategy**: Breaking down complex client requirements into actionable roadmaps
• **Task & Workflow Management**: Creating, organizing, and tracking work using Kanban methodology
• **Process Optimization**: Streamlining consultancy workflows from contract to delivery

**Your Approach:**
• Be proactive in suggesting project structure and task breakdown
• Focus on deliverable-oriented thinking
• Emphasize clear communication and practical next steps
• Support iterative planning and agile methodologies
• Consider both client-facing and internal work streams

**Available Tools:**
You have access to comprehensive project management tools for creating tasks, managing projects, and organizing workflows. Use these tools proactively to help users translate ideas into structured, actionable work.

Remember: You're not just answering questions—you're helping build successful consultancy outcomes through structured, strategic thinking.`

const sharedToolList = `You have access to tools for:
- Creating and managing tasks (create_task, update_task, move_task_within_project, move_task_to_project, orphan_task, archive_task, unarchive_task)
- Viewing tasks (get_task_by_id, get_project_tasks, get_orphaned_tasks)
- Managing projects (create_project, list_projects, get_project_details, update_project, update_project_lifecycle, archive_project, unarchive_project)
- Managing contacts and relationships (list_contacts, get_contact, search_contacts, create_contact, update_contact, delete_contact, get_project_contacts, get_contact_projects, add_contact_to_project, remove_contact_from_project, get_project_email_list, find_contacts_by_email, get_project_contact_emails, validate_email_list, suggest_contacts_from_emails)
- Managing workers and assignments (create_worker, update_worker, list_workers, get_worker, deactivate_worker, assign_worker_to_project, unassign_worker_from_project, get_project_workers, get_worker_projects)
- Managing table planning state (get_table_configuration, assign_table_gold, clear_table_gold, assign_table_silver, clear_table_silver, update_bronze_mode, add_bronze_task, remove_bronze_task, reorder_bronze_stack)
- Managing systems and task templates (create_system, update_system, get_system_details, list_systems, update_system_lifecycle, add_system_task_template, update_system_task_template, remove_system_task_template, get_system_task_templates)
- Document tools are currently disabled in this workspace. Do not reference or call document APIs.`

const sharedTaskGuidance =
  'When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed.'

const workerToolGuidance = `${sharedToolList}

${sharedTaskGuidance}`

const toolGuidance = `${sharedToolList}

${sharedTaskGuidance} If you need to know what projects are available, use the list_projects tool first.`

const buildNavigationContextPrompt = (navContext?: NavigationContext): string => {
  if (!navContext) {
    return '\n\nCURRENT CONTEXT:\nNo specific project is currently selected. Use the list_projects tool to see available projects, or tasks will be created on the default project.'
  }

  const hasNavigationContext =
    navContext.currentEntity ||
    (navContext.relatedEntities && navContext.relatedEntities.length > 0)

  if (!hasNavigationContext) {
    return '\n\nCURRENT CONTEXT:\nNo specific project is currently selected. Use the list_projects tool to see available projects, or tasks will be created on the default project.'
  }

  const parts: string[] = ['\n\nCURRENT CONTEXT:']

  if (navContext.currentEntity) {
    const entity = navContext.currentEntity
    const entityType = entity.type.charAt(0).toUpperCase() + entity.type.slice(1)

    parts.push(`User is viewing: "${entity.attributes.name || entity.id}" (ID: ${entity.id})`)
    parts.push(`- Type: ${entityType}`)

    for (const [key, value] of Object.entries(entity.attributes)) {
      if (key !== 'name') {
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1)
        parts.push(`- ${displayKey}: ${value}`)
      }
    }

    if (navContext.subtab) {
      parts.push(`- Subtab: ${navContext.subtab}`)
      parts.push(
        `\nThe user is looking at the "${navContext.subtab}" subtab within this ${entity.type}.`
      )
    }
  }

  if (navContext.relatedEntities && navContext.relatedEntities.length > 0) {
    parts.push('\n')
    for (const related of navContext.relatedEntities) {
      parts.push(
        `This ${navContext.currentEntity?.type || 'item'} belongs to ${related.relationship}: "${related.attributes.name || related.id}" (ID: ${related.id})`
      )

      for (const [key, value] of Object.entries(related.attributes)) {
        if (key !== 'name') {
          const displayKey = key.charAt(0).toUpperCase() + key.slice(1)
          parts.push(`  - ${displayKey}: ${value}`)
        }
      }
    }
  }

  return parts.join('\n')
}

export const buildSystemPrompt = (
  workerContext?: WorkerContext,
  navigationContext?: NavigationContext
): string => {
  const currentContextPrompt = buildNavigationContextPrompt(navigationContext)

  if (workerContext) {
    return `${workerContext.systemPrompt}

WORKER PROFILE:
- Name: ${workerContext.name}
${workerContext.roleDescription ? `- Role: ${workerContext.roleDescription}` : ''}

${workerToolGuidance}${currentContextPrompt}`
  }

  return `${baseSystemPrompt}

${toolGuidance}${currentContextPrompt}`
}
