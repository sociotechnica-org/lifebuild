export const WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX = '[internal:workshop-first-visit-bootstrap]'

export const WORKSHOP_FIRST_VISIT_BOOTSTRAP_MESSAGE = `${WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX}
You are meeting this builder in the Workshop for their first visit after onboarding.
Start with a brief warm greeting, then guide an Unburdening pass using a generic project-helper approach.
Ask for project sketches and use create_project for each one with a clear name, brief description, and category.
Keep this focused on Stage 1 capture only.`

export const isInternalRoomChatMessage = (message: string): boolean => {
  return message.trimStart().startsWith(WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX)
}
