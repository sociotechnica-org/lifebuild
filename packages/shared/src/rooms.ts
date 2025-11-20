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
  attributes?: Partial<PlanningAttributes> | null
}

const sanitize = (value?: string | null, fallback = 'Not provided.') =>
  value && value.trim().length > 0 ? value.trim() : fallback

const formatDate = (value?: number | null, fallback = 'Not provided.') =>
  value ? new Date(value).toISOString() : fallback

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
  attributes,
}: ProjectRoomParameters): StaticRoomDefinition => {
  const workerId = `project-${projectId}-guide`
  const resolvedObjectives = attributes?.objectives ?? objectives
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
    },
  }
}

export const getCategoryRoomDefinition = (category: ProjectCategory): StaticRoomDefinition => {
  return CATEGORY_ROOMS[category]
}
