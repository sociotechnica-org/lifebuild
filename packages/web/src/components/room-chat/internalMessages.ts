export const WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX = '[internal:workshop-first-visit-bootstrap]'
export const CAMPFIRE_BOOTSTRAP_PREFIX = '[internal:campfire-bootstrap]'

export const WORKSHOP_FIRST_VISIT_BOOTSTRAP_MESSAGE = `${WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX}
You are meeting this builder in the Workshop for their first visit after onboarding.
Start with a brief warm greeting, then guide an Unburdening pass using a generic project-helper approach.
Ask for project sketches and use create_project for each one with a clear name, brief description, and category.
Keep this focused on Stage 1 capture only.`

export const CAMPFIRE_BOOTSTRAP_MESSAGE = `${CAMPFIRE_BOOTSTRAP_PREFIX}
This is Beat 1 onboarding at the Campfire.
Start with a warm greeting, then coach the builder to create one first project with 3-5 starter tasks.
Use a generic coaching approach and keep the tone calm, practical, and concise.`

export const isInternalRoomChatMessage = (message: string): boolean => {
  const trimmed = message.trimStart()
  return (
    trimmed.startsWith(WORKSHOP_FIRST_VISIT_BOOTSTRAP_PREFIX) ||
    trimmed.startsWith(CAMPFIRE_BOOTSTRAP_PREFIX)
  )
}
