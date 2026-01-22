import { reportConfigurationError } from './sentry.js'

/**
 * Utility to send notifications to Discord via webhook
 */
export async function sendDiscordNotification(message: string, webhookUrl?: string): Promise<void> {
  console.log('Discord notification attempt:', { message, hasWebhookUrl: !!webhookUrl })

  if (!webhookUrl) {
    reportConfigurationError('DISCORD_WEBHOOK_URL is not configured', { message })
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
