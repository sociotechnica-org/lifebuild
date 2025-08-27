/**
 * Utility to send notifications to Discord via webhook
 */
export async function sendDiscordNotification(message: string, webhookUrl?: string): Promise<void> {
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    })
  } catch (error) {
    console.error('Failed to send Discord notification:', error)
  }
}
