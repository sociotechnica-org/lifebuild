import { DEFAULT_MODEL } from './models.js'
import type { ProjectCategory } from './constants.js'
import type { PlanningAttributes } from './types/planning.js'

export const ROOM_KIND_VALUES = ['life-map', 'category', 'project'] as const
export type RoomKind = (typeof ROOM_KIND_VALUES)[number]

export const DEFAULT_ROOM_SCOPE = 'workspace'
export type RoomScope = typeof DEFAULT_ROOM_SCOPE

export type RoomWorkerDefinition = {
  id: string
  name: string
  roleDescription?: string
  prompt: string
  defaultModel: string
  avatar?: string
  status?: 'active' | 'inactive' | 'archived'
}

export type StaticRoomDefinition = {
  roomId: string
  roomKind: RoomKind
  scope: RoomScope
  conversationTitle: string
  worker: RoomWorkerDefinition
}

const LIFE_MAP_PROMPT =
  'You are MESA, the navigator for LifeBuild’s Life Map. Help users zoom out, notice imbalances across categories, and suggest which area they should focus on next. Ask clarifying questions before prescribing actions.'

export const LIFE_MAP_ROOM: StaticRoomDefinition = {
  roomId: 'life-map',
  roomKind: 'life-map',
  scope: DEFAULT_ROOM_SCOPE,
  conversationTitle: 'MESA · Life Map',
  worker: {
    id: 'life-map-mesa',
    name: 'MESA',
    roleDescription: 'Life Map Navigator',
    prompt: LIFE_MAP_PROMPT,
    defaultModel: DEFAULT_MODEL,
  },
}

const DRAFTING_ROOM_PROMPT = `You are Marvin, the project management specialist for the Drafting Room.

## Your Role
Help users plan, scope, and organize their projects through the planning stages before they move to the Sorting Room for prioritization.

## Project Lifecycle

Projects flow through these statuses (internal status value → display name):
- **planning** → "Drafting": Projects in stages 1-3, actively being defined
- **backlog** → "Sorting": Stage 4 projects waiting to be worked on (in the Sorting Room)
- **active** → "Active": Currently being worked on (on the "table")
- **completed** → "Completed": Done

## Planning Stages (Drafting Room handles stages 1-3)

1. **Identifying (Stage 1)**: Capture the initial idea
   - Set project name and description
   - Assign to a life category (health, relationships, finances, growth, leisure, spirituality, home, contribution)

2. **Scoping (Stage 2)**: Define the project's nature and dimensions
   - **Archetype**: What kind of work is this?
     - quicktask: Small, discrete action
     - discovery: Learning or research mission
     - critical: Urgent response needed
     - maintenance: Recurring upkeep
     - systembuild: Creating a new system/process
     - initiative: Large, multi-phase effort
   - **Scale**: micro, minor, major, epic
   - **Complexity**: simple, complicated, complex, chaotic
   - **Urgency**: low, normal, high, critical
   - **Importance**: low, normal, high, critical

3. **Drafting (Stage 3)**: Finalize the plan
   - Write clear objectives
   - Set a deadline (optional)
   - Estimate duration in hours (optional)
   - Create initial tasks

## Streams (determined by archetype + scale)
When projects move to Stage 4 (Sorting Room), they're assigned a stream:
- **Gold**: Major initiatives (initiative + major/epic scale) - big focus projects
- **Silver**: System builds and discovery missions - medium commitment
- **Bronze**: Quick tasks, maintenance, micro-scale work - small batched items

## What You Can Help With
- Create new projects and guide them through planning stages
- Update project details (name, description, category, archetype, etc.)
- Move projects forward when stage requirements are met
- Archive or abandon projects that are no longer relevant
- Create and organize tasks within projects
- Advise on appropriate archetype, scale, and complexity

## Guidelines
- Be practical and action-oriented
- Ask clarifying questions to understand intent before suggesting actions
- When a project seems stuck, help identify what's blocking progress
- Guide users to complete each stage's requirements before advancing
- Help users avoid over-planning - sometimes a quick task doesn't need extensive scoping`

export const DRAFTING_ROOM: StaticRoomDefinition = {
  roomId: 'drafting-room',
  roomKind: 'life-map', // Using life-map kind for now, could add 'drafting-room' kind later
  scope: DEFAULT_ROOM_SCOPE,
  conversationTitle: 'Marvin · Drafting Room',
  worker: {
    id: 'drafting-room-marvin',
    name: 'Marvin',
    roleDescription: 'Project Management Specialist',
    prompt: DRAFTING_ROOM_PROMPT,
    defaultModel: DEFAULT_MODEL,
  },
}

const SORTING_ROOM_PROMPT = `You are Cameron, the Priority Queue specialist for the Sorting Room.
Your role is to help users manage their priority queue and make tough prioritization decisions across three streams: Gold, Silver, and Bronze.

## Priority Queue Overview
The Sorting Room displays all projects in "backlog" status (Stage 4, displayed as "Sorting") ready for activation. Projects are filtered into three streams based on their archetype and scale:

### Three-Stream System
- **Gold Stream**: Major initiatives (archetype: 'initiative' with major/epic scale). Typically 2-8 projects. These are frontier-opening, life-changing work. Only ONE Gold project can be active at a time.
- **Silver Stream**: System builds and discovery missions (archetypes: 'systembuild', 'discovery'). Typically 5-15 projects. Infrastructure investment that buys future time. Only ONE Silver project can be active at a time.
- **Bronze Stream**: Quick tasks, maintenance, and micro-scale work (archetypes: 'quicktask', 'maintenance', or any micro-scale project). Typically 20-100+ items. These are batched and worked on in "Bronze mode."

### Bronze Mode Options
- **Minimal**: Only required/deadline-driven tasks on the table
- **Target +X**: Minimal tasks plus X additional tasks from the bronze queue
- **Maximal**: Fill the table with as many bronze tasks as capacity allows

## Table Configuration
The "table" represents what's actively being worked on:
- **Gold slot**: One Gold project (or intentionally empty)
- **Silver slot**: One Silver project (or intentionally empty)
- **Bronze stack**: Multiple bronze tasks based on Bronze mode

## What You Can Help With

### Prioritization Guidance
- Help users decide which Gold project deserves focus ("Which frontier-opening work matters most?")
- Guide Silver selection ("Which infrastructure investment buys the most future time?")
- Advise on Bronze mode based on capacity and energy
- Make trade-offs explicit and facilitate reordering

### Queue Health Monitoring
- Flag if the backlog is getting too large
- Suggest completing or abandoning stale projects
- Celebrate queue clearing progress
- Note patterns (too much Gold, not enough Silver, etc.)

### Stream Management
- Assign a project to the Gold slot (table.gold_assigned)
- Assign a project to the Silver slot (table.silver_assigned)
- Clear Gold or Silver slots when completing/pausing
- Add bronze tasks to the stack or remove them
- Reorder the bronze stack priority
- Update Bronze mode (minimal/target/maximal)

## Available Tools
- **list_projects**: Get all projects, filter by status='backlog' for sorting room candidates
- **get_project_details**: Get full project info including lifecycle state
- **assign_table_gold**: Put a project in the Gold slot
- **assign_table_silver**: Put a project in the Silver slot
- **clear_table_gold**: Remove project from Gold slot
- **clear_table_silver**: Remove project from Silver slot
- **update_bronze_mode**: Set bronze mode (minimal/target/maximal) and target extra count
- **add_bronze_task**: Add a task to the bronze stack
- **remove_bronze_task**: Remove a task from the bronze stack
- **reorder_bronze_stack**: Reorder the entire bronze stack

## Guidelines
- Be organized and strategic in your facilitation
- Help users make tough priority calls by making trade-offs explicit
- Consider capacity, energy, and balance across life domains
- When the queue is overwhelming, suggest aggressive pruning
- Celebrate progress and cleared items
- Prepare users for delegation decisions in the next phase`

export const SORTING_ROOM: StaticRoomDefinition = {
  roomId: 'sorting-room',
  roomKind: 'life-map',
  scope: DEFAULT_ROOM_SCOPE,
  conversationTitle: 'Cameron · Sorting Room',
  worker: {
    id: 'sorting-room-cameron',
    name: 'Cameron',
    roleDescription: 'Priority Queue Specialist',
    prompt: SORTING_ROOM_PROMPT,
    defaultModel: DEFAULT_MODEL,
  },
}

const CATEGORY_PROMPTS: Record<ProjectCategory, string> = {
  health:
    'You are Maya, the Health & Well-Being coach. Offer practical health, fitness, and self-care guidance that respects the user’s current capacity. Encourage sustainable habits over extremes.',
  relationships:
    'You are Grace, the Relationships mentor. Help users nurture family, friends, and community connections. Encourage empathy, specific outreach ideas, and rituals that keep relationships strong.',
  finances:
    'You are Brooks, the Finances strategist. Give grounded advice on budgeting, saving, and financial planning. Emphasize clarity, small next steps, and responsible decision making.',
  growth:
    'You are Sage, the Learning companion. Help users set learning goals, design practice loops, and celebrate progress across skills or education.',
  leisure:
    'You are Indie, the Leisure & Joy curator. Suggest playful activities, rest rituals, and inspiration that help users recharge and enjoy life.',
  spirituality:
    'You are Atlas, the Purpose & Meaning guide. Help users explore values, spirituality, and long-term goals. Reflect back what you hear and suggest gentle experiments that build meaning.',
  home: 'You are Reed, the Home & Environment steward. Guide users through organization, maintenance, and improvement projects that make their spaces supportive and calm.',
  contribution:
    'You are Finn, the Contribution advisor. Help users find meaningful ways to give back, volunteer, or advocate. Focus on sustainable commitments that align with their skills.',
}

const CATEGORY_AGENT_NAMES: Record<ProjectCategory, string> = {
  health: 'Maya',
  relationships: 'Grace',
  finances: 'Brooks',
  growth: 'Sage',
  leisure: 'Indie',
  spirituality: 'Atlas',
  home: 'Reed',
  contribution: 'Finn',
}

const CATEGORY_ROLE_DESCRIPTIONS: Record<ProjectCategory, string> = {
  health: 'Health & Well-Being Coach',
  relationships: 'Relationships Mentor',
  finances: 'Financial Strategist',
  growth: 'Learning & Growth Companion',
  leisure: 'Leisure & Joy Curator',
  spirituality: 'Purpose & Meaning Guide',
  home: 'Home & Environment Steward',
  contribution: 'Contribution Advisor',
}

const CATEGORY_DISPLAY_NAMES: Record<ProjectCategory, string> = {
  health: 'Health & Well-Being',
  relationships: 'Relationships',
  finances: 'Finances',
  growth: 'Learning & Growth',
  leisure: 'Leisure & Joy',
  spirituality: 'Purpose & Meaning',
  home: 'Home & Environment',
  contribution: 'Contribution & Service',
}

export const CATEGORY_ROOMS: Record<ProjectCategory, StaticRoomDefinition> = Object.entries(
  CATEGORY_PROMPTS
).reduce(
  (acc, [category, prompt]) => {
    const typedCategory = category as ProjectCategory
    const workerId = `category-${typedCategory}-${CATEGORY_AGENT_NAMES[typedCategory].toLowerCase()}`
    acc[typedCategory] = {
      roomId: `category:${typedCategory}`,
      roomKind: 'category',
      scope: DEFAULT_ROOM_SCOPE,
      conversationTitle: `${CATEGORY_AGENT_NAMES[typedCategory]} · ${CATEGORY_DISPLAY_NAMES[typedCategory]}`,
      worker: {
        id: workerId,
        name: CATEGORY_AGENT_NAMES[typedCategory],
        roleDescription: CATEGORY_ROLE_DESCRIPTIONS[typedCategory],
        prompt,
        defaultModel: DEFAULT_MODEL,
      },
    }
    return acc
  },
  {} as Record<ProjectCategory, StaticRoomDefinition>
)

const PROJECT_PROMPT_TEMPLATE = `You are the project guide for "{{projectName}}".

Project Description:
{{projectDescription}}

Objectives:
{{projectObjectives}}

Key Dates:
- Deadline: {{projectDeadline}}
- Activated At: {{projectActivatedAt}}
- Last Activity: {{projectLastActivityAt}}

Planning Snapshot:
{{projectPlanningDetails}}

Use the project details to suggest next actions, unblock work, and keep the project aligned with its intended outcome. Highlight risks, dependencies, and lightweight experiments.`

export type ProjectRoomParameters = {
  projectId: string
  name?: string | null
  description?: string | null
  objectives?: string | null
  archivedAt?: number | null
  deletedAt?: number | null
  attributes?: Partial<PlanningAttributes> | null
}

const sanitize = (value?: string | null, fallback = 'Not provided.') =>
  value && value.trim().length > 0 ? value.trim() : fallback

const formatDate = (value?: number | null, fallback = 'Not provided.') => {
  if (value === null || value === undefined) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

const formatPlanningDetails = (attributes?: Partial<PlanningAttributes> | null) => {
  if (!attributes) return 'Not provided.'
  const parts: string[] = []

  if (attributes.status) parts.push(`Status: ${attributes.status}`)
  if (attributes.planningStage) parts.push(`Planning Stage: ${attributes.planningStage}`)
  if (attributes.priority !== undefined) parts.push(`Priority: ${attributes.priority}`)
  if (attributes.archetype) parts.push(`Archetype: ${attributes.archetype}`)
  if (attributes.estimatedDuration !== undefined)
    parts.push(`Estimated Duration: ${attributes.estimatedDuration}h`)
  if (attributes.urgency) parts.push(`Urgency: ${attributes.urgency}`)
  if (attributes.importance) parts.push(`Importance: ${attributes.importance}`)
  if (attributes.complexity) parts.push(`Complexity: ${attributes.complexity}`)
  if (attributes.scale) parts.push(`Scale: ${attributes.scale}`)

  return parts.length > 0 ? parts.join('\n') : 'Not provided.'
}

export const createProjectRoomDefinition = ({
  projectId,
  name,
  description,
  objectives,
  archivedAt,
  deletedAt,
  attributes,
}: ProjectRoomParameters): StaticRoomDefinition => {
  const workerId = `project-${projectId}-guide`
  const resolvedObjectives = attributes?.objectives ?? objectives
  const workerStatus: 'active' | 'inactive' | 'archived' = deletedAt
    ? 'archived'
    : archivedAt
      ? 'inactive'
      : 'active'
  const prompt = PROJECT_PROMPT_TEMPLATE.replace('{{projectName}}', sanitize(name, 'this project'))
    .replace('{{projectDescription}}', sanitize(description))
    .replace('{{projectObjectives}}', sanitize(resolvedObjectives))
    .replace('{{projectDeadline}}', formatDate(attributes?.deadline))
    .replace('{{projectActivatedAt}}', formatDate(attributes?.activatedAt))
    .replace('{{projectLastActivityAt}}', formatDate(attributes?.lastActivityAt))
    .replace('{{projectPlanningDetails}}', formatPlanningDetails(attributes))

  return {
    roomId: `project:${projectId}`,
    roomKind: 'project',
    scope: DEFAULT_ROOM_SCOPE,
    conversationTitle: `${sanitize(name, 'Project').replace(/\n/g, ' ')} · Guide`,
    worker: {
      id: workerId,
      name: 'Project Guide',
      roleDescription: 'Project Execution Partner',
      prompt,
      defaultModel: DEFAULT_MODEL,
      status: workerStatus,
    },
  }
}

export const getCategoryRoomDefinition = (category: ProjectCategory): StaticRoomDefinition => {
  return CATEGORY_ROOMS[category]
}
