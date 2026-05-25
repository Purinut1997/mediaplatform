import { writeErrorLog } from './admin'
import type { Env } from './db'

export async function notifyTelegram(env: Env, message: string) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return

  try {
    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Telegram responded with ${response.status}`)
    }
  } catch (error) {
    await writeErrorLog(env, 'telegram.send', error)
  }
}
