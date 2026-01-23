import { reportConfigurationError } from './sentry.js'

// Track if we've already reported the missing webhook configuration
let missingWebhookReported = false

/**
 * Utility to send notifications to Discord via webhook
 */
export async function sendDiscordNotification(message: string, webhookUrl?: string): Promise<void> {
  console.log('Discord notification attempt:', { message, hasWebhookUrl: !!webhookUrl })

  if (!webhookUrl) {
    // Only report this configuration error once per worker instance to avoid spam
    if (!missingWebhookReported) {
      missingWebhookReported = true
      reportConfigurationError('DISCORD_WEBHOOK_URL is not configured')
    }
    return
  }

  try {
    console.log('Sending to Discord webhook:', webhookUrl.substring(0, 50) + '...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discord webhook failed:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
    } else {
      console.log('Discord notification sent successfully')
    }
  } catch (error) {
    console.error('Failed to send Discord notification:', error)
  }
}
