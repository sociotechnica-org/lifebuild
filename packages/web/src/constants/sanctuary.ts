import { JOURNEY_SETTINGS_KEYS } from '@lifebuild/shared/settings'

export const SANCTUARY_FIRST_VISIT_SETTING_KEY =
  JOURNEY_SETTINGS_KEYS.SANCTUARY_FIRST_VISIT_COMPLETED_AT

export const SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX = '[INTERNAL_SANCTUARY_FIRST_VISIT]'

export const SANCTUARY_FIRST_VISIT_BOOTSTRAP_MESSAGE = `${SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX} This is the builder's first Sanctuary visit after onboarding. Start with a warm greeting, then guide a short visioning conversation about what matters most right now. Keep it conversational and coaching-oriented.`

export const isSanctuaryFirstVisitBootstrapMessage = (message: string): boolean =>
  message.startsWith(SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX)
