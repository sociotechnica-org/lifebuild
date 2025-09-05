/**
 * Utility to send notifications to Discord via webhook
 */
export async function sendDiscordNotification(message: string, webhookUrl?: string): Promise<void> {
  console.log('Discord notification attempt:', { message, hasWebhookUrl: !!webhookUrl })
  
  if (!webhookUrl) {
    console.log('No Discord webhook URL configured, skipping notification')
    return
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    })
    
    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, response.statusText)
    } else {
      console.log('Discord notification sent successfully')
    }
  } catch (error) {
    console.error('Failed to send Discord notification:', error)
  }
}
