import { writeErrorLog } from './admin'
import type { Env } from './db'

export function getTelegramStatus(env: Env) {
  const botTokenConfigured = Boolean(env.TELEGRAM_BOT_TOKEN?.trim())
  const chatIdConfigured = Boolean(env.TELEGRAM_CHAT_ID?.trim())
  return {
    botTokenConfigured,
    chatIdConfigured,
    ready: botTokenConfigured && chatIdConfigured,
  }
}

export async function sendTelegramMessage(env: Env, message: string) {
  const status = getTelegramStatus(env)
  if (!status.ready) {
    return {
      ok: false,
      status,
      error: 'TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID ยังไม่ได้ตั้งค่า',
    }
  }

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
      const detail = await response.text().catch(() => '')
      throw new Error(`Telegram responded with ${response.status}${detail ? `: ${detail}` : ''}`)
    }

    return { ok: true, status }
  } catch (error) {
    await writeErrorLog(env, 'telegram.send', error)
    return {
      ok: false,
      status,
      error: error instanceof Error ? error.message : 'ส่ง Telegram ไม่สำเร็จ',
    }
  }
}

export async function notifyTelegram(env: Env, message: string) {
  await sendTelegramMessage(env, message)
}
