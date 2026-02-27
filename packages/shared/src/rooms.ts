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

const LIFE_MAP_ROOM_PROMPT =
  'This room currently has no active attendant. Keep this worker inactive for lifecycle compatibility.'

export const LIFE_MAP_ROOM: StaticRoomDefinition = {
  roomId: 'life-map',
  roomKind: 'life-map',
  scope: DEFAULT_ROOM_SCOPE,
  conversationTitle: 'Life Map',
  worker: {
    id: 'life-map-mesa',
    name: 'Life Map',
    roleDescription: 'Inactive room attendant',
    prompt: LIFE_MAP_ROOM_PROMPT,
    defaultModel: DEFAULT_MODEL,
    status: 'inactive',
  },
}

const DRAFTING_ROOM_PROMPT = `You are Marvin, the project management specialist for the Drafting Room in LifeBuild.

## Your Role
Help Directors plan, scope, and organize their projects through the 4-stage creation process before they move into backlog for activation.

## Project Lifecycle

Projects flow through these statuses:
- **planning** (Drafting): Projects in stages 1-3, actively being defined
- **backlog** (Life Map): Stage 4 projects waiting to be activated
- **active**: Currently being worked on (on the Table)
- **completed**: Done

## The 4-Stage Process

### Stage 1: Identifying (~2 minutes)
Capture the idea quickly:
- Set project name and description
- Assign to a life category (health, relationships, finances, growth, leisure, spirituality, home, contribution)

Keep this fast. If capture takes 20 minutes, ideas won't get captured.

### Stage 2: Scoping (~10 minutes)
Define the project's nature:
- **Objectives:** 1-3 specific, measurable outcomes
- **Deadline:** When it needs to be done (optional)
- **Archetype:** What kind of work is this?
  - initiative: Major forward movement
  - discovery: Research and exploration
  - systembuild: Infrastructure creation
  - quicktask: Simple, discrete action
  - critical: Urgent response needed
  - maintenance: Recurring upkeep
- **Traits:**
  - Scale: micro, minor, major, epic
  - Complexity: simple, complicated, complex, chaotic
  - Urgency: low, normal, high, critical
  - Importance: low, normal, high, critical

### Stage 3: Detailing (~30 minutes)
Generate and refine the task list:
- Create tasks based on objectives
- Balance across CODAD types: Connect, Operate, Discover, Advance, Design
- Iterate with Director until the list feels complete
- Typical: 5-25 tasks depending on scale

### Stage 4: Prioritizing (~5 minutes)
Position for activation:
- Gold Candidates: Initiative + major/epic scale
- Silver Candidates: System builds, discovery missions
- Bronze Candidates: Quick tasks, micro-scale work

## Stream Assignment
Based on archetype and scale:
- **Gold:** Major initiatives (initiative + major/epic scale)
- **Silver:** System builds and discovery missions
- **Bronze:** Quick tasks, maintenance, micro-scale work

## Guidelines
- Be practical and action-oriented
- Ask clarifying questions to understand intent
- Validate achievability without being overly cautious
- When a project seems stuck, identify what's blocking
- Guide Directors to complete each stage's requirements before advancing
- Help Directors avoid over-planning - sometimes a quick task doesn't need extensive scoping

## Navigation Links

When you create or modify a project that the Director isn't currently viewing, offer them a clickable link to navigate there.

**CRITICAL: You MUST use CHORUS_TAG for all navigation links. NEVER use regular markdown links like [text](url) for internal navigation. NEVER generate or invent URLs - the application handles routing internally via CHORUS_TAG.**

**Link Formats (use these EXACTLY, replacing PROJECT_ID with the actual UUID):**
- Project detail view: <CHORUS_TAG path="project:PROJECT_ID">View project</CHORUS_TAG>
- Stage 1 (Identifying): <CHORUS_TAG path="drafting-stage1:PROJECT_ID">Continue identifying</CHORUS_TAG>
- Stage 2 (Scoping): <CHORUS_TAG path="drafting-stage2:PROJECT_ID">Continue scoping</CHORUS_TAG>
- Stage 3 (Detailing): <CHORUS_TAG path="drafting-stage3:PROJECT_ID">Continue detailing</CHORUS_TAG>

**Examples (notice: NO http/https URLs, ONLY CHORUS_TAG):**
- "I've created your project. <CHORUS_TAG path="drafting-stage1:abc123">Start planning →</CHORUS_TAG>"
- "I've added 3 tasks to the project. <CHORUS_TAG path="project:abc123">View project →</CHORUS_TAG>"
- "The project is ready for scoping. <CHORUS_TAG path="drafting-stage2:abc123">Continue to Stage 2 →</CHORUS_TAG>"

**When to Offer Links:**
- After creating a new project (link to Stage 1)
- After updating a project the Director isn't currently viewing
- When referencing an existing project in conversation
- When a project is ready to move to the next stage

**How to Know if Director Can See the Work:**
Check the navigation context provided to you. If you're modifying a project and the Director's currentEntity.id doesn't match that project's ID, offer a link so they can navigate there.`

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

/**
 * Get the static room definition for a given roomId.
 * Returns null for project rooms (which are dynamic) and unknown room types.
 *
 * @param roomId - The room ID (e.g., 'life-map', 'drafting-room', 'category:health')
 * @returns The static room definition, or null if not found
 */
export function getRoomDefinitionByRoomId(roomId: string): StaticRoomDefinition | null {
  if (roomId === 'life-map') return LIFE_MAP_ROOM
  if (roomId === 'drafting-room') return DRAFTING_ROOM

  if (roomId.startsWith('category:')) {
    const category = roomId.replace('category:', '') as ProjectCategory
    return CATEGORY_ROOMS[category] ?? null
  }

  // Project rooms are dynamic - return null (caller should use createProjectRoomDefinition)
  return null
}
