import { toolDef, requiredString, optionalString, optionalNumber, stringArray } from './base.js'

/**
 * Centralized OpenAI function schemas for all LLM tools
 * This eliminates duplication and provides a single source of truth
 */
export const llmToolSchemas = [
  // Task Management Tools
  toolDef('create_task', 'Create a new task in a specific project with a status', {
    type: 'object',
    properties: {
      title: requiredString('The title/name of the task'),
      description: optionalString('Optional detailed description of the task'),
      projectId: requiredString('ID of the project to create the task in'),
      status: optionalString(
        "Status of the task: 'todo', 'doing', 'in_review', or 'done' (defaults to 'todo')"
      ),
      assigneeIds: stringArray('Array of user IDs to assign to the task'),
    },
    required: ['title', 'projectId'],
  }),

  toolDef('update_task', 'Update an existing task with new information', {
    type: 'object',
    properties: {
      taskId: requiredString('The ID of the task to update'),
      title: optionalString('New title for the task'),
      description: optionalString('New description for the task'),
      assigneeIds: stringArray('Array of user IDs to assign to the task'),
    },
    required: ['taskId'],
  }),

  toolDef(
    'move_task_within_project',
    'Move a task to a different status within the same project (task must have a projectId)',
    {
      type: 'object',
      properties: {
        taskId: requiredString('The ID of the task to move'),
        toStatus: requiredString(
          "The status to move the task to: 'todo', 'doing', 'in_review', or 'done'"
        ),
        position: optionalNumber('Position within the status (defaults to end)'),
      },
      required: ['taskId', 'toStatus'],
    }
  ),

  toolDef('move_task_to_project', 'Move a task to a different project (keeps current status)', {
    type: 'object',
    properties: {
      taskId: requiredString('The ID of the task to move'),
      toProjectId: requiredString('The ID of the project to move the task to'),
      status: optionalString(
        "Optional: change task status when moving ('todo', 'doing', 'in_review', 'done')"
      ),
      position: optionalNumber('Position within the status (defaults to end)'),
    },
    required: ['taskId', 'toProjectId'],
  }),

  toolDef('orphan_task', 'Move a task to orphaned state (remove from its current project)', {
    type: 'object',
    properties: {
      taskId: requiredString('The ID of the task to orphan'),
      status: optionalString(
        "Optional: task status (defaults to keeping current status): 'todo', 'doing', 'in_review', 'done'"
      ),
      position: optionalNumber('Position (defaults to end)'),
    },
    required: ['taskId'],
  }),

  toolDef('archive_task', 'Archive a task to remove it from active view', {
    type: 'object',
    properties: {
      taskId: requiredString('The ID of the task to archive'),
    },
    required: ['taskId'],
  }),

  toolDef('unarchive_task', 'Unarchive a task to restore it to active view', {
    type: 'object',
    properties: {
      taskId: requiredString('The ID of the task to unarchive'),
    },
    required: ['taskId'],
  }),

  toolDef('get_task_by_id', 'Get detailed information about a specific task', {
    type: 'object',
    properties: {
      taskId: requiredString('The ID of the task to retrieve'),
    },
    required: ['taskId'],
  }),

  toolDef('get_project_tasks', 'Get all tasks for a specific project', {
    type: 'object',
    properties: {
      projectId: requiredString('The ID of the project to get tasks for'),
    },
    required: ['projectId'],
  }),

  toolDef('get_orphaned_tasks', 'Get all tasks that are not assigned to any project', {
    type: 'object',
    properties: {},
    required: [],
  }),

  // Project Management Tools
  toolDef(
    'create_project',
    'Create a new project with name and optional description (automatically creates default Kanban columns: To Do, In Progress, Done)',
    {
      type: 'object',
      properties: {
        name: requiredString('The name of the project'),
        description: optionalString('Optional description of the project'),
      },
      required: ['name'],
    }
  ),

  toolDef(
    'list_projects',
    'Get a list of all available projects with their IDs, names, and descriptions',
    {
      type: 'object',
      properties: {},
      required: [],
    }
  ),

  toolDef(
    'get_project_details',
    'Get detailed information about a specific project including document count and task count',
    {
      type: 'object',
      properties: {
        projectId: requiredString('The ID of the project to get details for'),
      },
      required: ['projectId'],
    }
  ),

  toolDef(
    'update_project',
    'Update an existing project with new name, description, category, or attributes',
    {
      type: 'object',
      properties: {
        projectId: requiredString('The ID of the project to update'),
        name: optionalString('New name for the project'),
        description: optionalString('New description for the project'),
        category: {
          type: 'string',
          enum: [
            'health',
            'relationships',
            'finances',
            'growth',
            'leisure',
            'spirituality',
            'home',
            'contribution',
          ],
          description:
            'Project category. Use only these values: "health", "relationships", "finances", "growth", "leisure", "spirituality", "home", or "contribution".',
        },
        attributes: {
          type: 'object',
          description:
            'Custom attributes as key-value string pairs (e.g., {"scale": "medium", "complexity": "high"})',
          additionalProperties: {
            type: 'string',
          },
        },
      },
      required: ['projectId'],
    }
  ),

  toolDef('archive_project', 'Archive a project to remove it from active view', {
    type: 'object',
    properties: {
      projectId: requiredString('The ID of the project to archive'),
    },
    required: ['projectId'],
  }),

  toolDef('unarchive_project', 'Unarchive a project to restore it to active view', {
    type: 'object',
    properties: {
      projectId: requiredString('The ID of the project to unarchive'),
    },
    required: ['projectId'],
  }),

  toolDef(
    'update_project_lifecycle',
    "Update a project's planning stage, status, or planning attributes. Use this to advance projects through planning stages (1=Identifying, 2=Scoping, 3=Drafting, 4=Prioritizing) or update archetype, scale, complexity, etc. Stage 3+ requires objectives and a project type/stream. Stage 4 or status backlog requires at least one task.",
    {
      type: 'object',
      properties: {
        projectId: requiredString('The ID of the project to update'),
        stage: optionalNumber(
          'Planning stage: 1 (Identifying), 2 (Scoping), 3 (Drafting), or 4 (Prioritizing)'
        ),
        status: optionalString('Project status: "planning", "backlog", "active", or "completed"'),
        archetype: optionalString(
          'Project archetype: "quicktask", "discovery", "critical", "maintenance", "systembuild", or "initiative"'
        ),
        scale: optionalString('Project scale: "micro", "minor", "major", or "epic"'),
        complexity: optionalString(
          'Project complexity: "simple", "complicated", "complex", or "chaotic"'
        ),
        urgency: optionalString('Urgency level: "low", "normal", "high", or "critical"'),
        importance: optionalString('Importance level: "low", "normal", "high", or "critical"'),
        objectives: optionalString('Project objectives/goals'),
        deadline: optionalNumber('Deadline as Unix timestamp in milliseconds'),
        estimatedDuration: optionalNumber('Estimated duration in hours'),
        projectType: {
          type: 'string',
          enum: ['initiative', 'optimization', 'to-do'],
          description:
            'Project type required for stage 3+. Maps to streams: initiative -> gold, optimization -> silver, to-do -> bronze.',
        },
        stream: {
          type: 'string',
          enum: ['gold', 'silver', 'bronze'],
          description:
            'Stream assignment. Equivalent project types are: gold=initiative, silver=optimization, bronze=to-do.',
        },
        priority: optionalNumber('Priority number (lower = higher priority)'),
      },
      required: ['projectId'],
    }
  ),

  // Contact Management Tools
  toolDef('list_contacts', 'Get a list of all contacts with their names, emails, and IDs', {
    type: 'object',
    properties: {},
    required: [],
  }),

  toolDef('get_contact', 'Get detailed information about a specific contact', {
    type: 'object',
    properties: {
      contactId: requiredString('The ID of the contact to retrieve'),
    },
    required: ['contactId'],
  }),

  toolDef('search_contacts', 'Search contacts by name or email address', {
    type: 'object',
    properties: {
      query: requiredString('Search query to find contacts by name or email'),
    },
    required: ['query'],
  }),

  toolDef('create_contact', 'Create a new contact with name and email', {
    type: 'object',
    properties: {
      name: optionalString('The name of the contact'),
      email: requiredString('The email address of the contact'),
    },
    required: ['email'],
  }),

  toolDef('update_contact', "Update an existing contact's details", {
    type: 'object',
    properties: {
      contactId: requiredString('The ID of the contact to update'),
      name: optionalString('New name for the contact'),
      email: optionalString('New email address for the contact'),
    },
    required: ['contactId'],
  }),

  toolDef('delete_contact', 'Delete a contact and remove all project associations', {
    type: 'object',
    properties: {
      contactId: requiredString('The ID of the contact to delete'),
    },
    required: ['contactId'],
  }),

  // Project-Contact Association Tools
  toolDef('get_project_contacts', 'Get all contacts associated with a specific project', {
    type: 'object',
    properties: {
      projectId: requiredString('The ID of the project to get contacts for'),
    },
    required: ['projectId'],
  }),

  toolDef('get_contact_projects', 'Get all projects associated with a specific contact', {
    type: 'object',
    properties: {
      contactId: requiredString('The ID of the contact to get projects for'),
    },
    required: ['contactId'],
  }),

  toolDef('add_contact_to_project', 'Associate a contact with a project', {
    type: 'object',
    properties: {
      contactId: requiredString('The ID of the contact to add to the project'),
      projectId: requiredString('The ID of the project to add the contact to'),
    },
    required: ['contactId', 'projectId'],
  }),

  toolDef('remove_contact_from_project', 'Remove a contact association from a project', {
    type: 'object',
    properties: {
      contactId: requiredString('The ID of the contact to remove from the project'),
      projectId: requiredString('The ID of the project to remove the contact from'),
    },
    required: ['contactId', 'projectId'],
  }),

  toolDef('get_project_email_list', 'Get formatted email list for a project (for email drafting)', {
    type: 'object',
    properties: {
      projectId: requiredString('The ID of the project to get email list for'),
    },
    required: ['projectId'],
  }),

  // Email Utility Tools
  toolDef('find_contacts_by_email', 'Match email addresses to existing contacts', {
    type: 'object',
    properties: {
      emails: stringArray('Array of email addresses to match against contacts'),
    },
    required: ['emails'],
  }),

  toolDef(
    'get_project_contact_emails',
    'Get contact email addresses for a project (for filtering)',
    {
      type: 'object',
      properties: {
        projectId: requiredString('The ID of the project to get contact emails for'),
      },
      required: ['projectId'],
    }
  ),

  toolDef('validate_email_list', 'Validate and normalize email addresses', {
    type: 'object',
    properties: {
      emails: stringArray('Array of email addresses to validate'),
    },
    required: ['emails'],
  }),

  toolDef('suggest_contacts_from_emails', 'Suggest creating contacts for unknown email addresses', {
    type: 'object',
    properties: {
      emails: stringArray('Array of email addresses to analyze for contact creation'),
    },
    required: ['emails'],
  }),

  // Worker Management Tools
  toolDef('create_worker', 'Create a new AI worker with specified capabilities', {
    type: 'object',
    properties: {
      name: requiredString('The name of the worker'),
      roleDescription: optionalString("Description of the worker's role and responsibilities"),
      systemPrompt: requiredString("System prompt that defines the worker's behavior"),
      avatar: optionalString("URL to the worker's avatar image"),
      defaultModel: requiredString('Default AI model to use (e.g., gpt-4o-mini)'),
    },
    required: ['name', 'systemPrompt', 'defaultModel'],
  }),

  toolDef('update_worker', "Update an existing worker's configuration", {
    type: 'object',
    properties: {
      workerId: requiredString('The ID of the worker to update'),
      name: optionalString('New name for the worker'),
      roleDescription: optionalString("New description of the worker's role"),
      systemPrompt: optionalString('New system prompt for the worker'),
      avatar: optionalString('New avatar URL for the worker'),
      defaultModel: optionalString('New default AI model for the worker'),
    },
    required: ['workerId'],
  }),

  toolDef('list_workers', 'Get all active workers', {
    type: 'object',
    properties: {},
    required: [],
  }),

  toolDef('get_worker', 'Get details of a specific worker', {
    type: 'object',
    properties: {
      workerId: requiredString('The ID of the worker to retrieve'),
    },
    required: ['workerId'],
  }),

  toolDef('deactivate_worker', 'Deactivate a worker (soft delete)', {
    type: 'object',
    properties: {
      workerId: requiredString('The ID of the worker to deactivate'),
    },
    required: ['workerId'],
  }),

  // Worker-Project Assignment Tools
  toolDef('assign_worker_to_project', 'Assign a worker to a project', {
    type: 'object',
    properties: {
      workerId: requiredString('The ID of the worker to assign'),
      projectId: requiredString('The ID of the project to assign the worker to'),
    },
    required: ['workerId', 'projectId'],
  }),

  toolDef('unassign_worker_from_project', 'Remove a worker from a project', {
    type: 'object',
    properties: {
      workerId: requiredString('The ID of the worker to unassign'),
      projectId: requiredString('The ID of the project to unassign the worker from'),
    },
    required: ['workerId', 'projectId'],
  }),

  toolDef('get_project_workers', 'Get all workers assigned to a project', {
    type: 'object',
    properties: {
      projectId: requiredString('The ID of the project to get workers for'),
    },
    required: ['projectId'],
  }),

  toolDef('get_worker_projects', 'Get all projects a worker is assigned to', {
    type: 'object',
    properties: {
      workerId: requiredString('The ID of the worker to get projects for'),
    },
    required: ['workerId'],
  }),
]
