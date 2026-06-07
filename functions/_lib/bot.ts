export type BotCheckPayload = {
  botVerified?: boolean
  botStartedAt?: number
  website?: string
  turnstileToken?: string
}

export async function validateBotCheck(
  body: BotCheckPayload,
  secret?: string,
  remoteIp?: string | null,
) {
  if (String(body.website ?? '').trim()) {
    return 'ระบบตรวจพบพฤติกรรมอัตโนมัติ'
  }

  if (secret) {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: String(body.turnstileToken ?? ''),
        remoteip: remoteIp || undefined,
      }),
    })
    const result = (await response.json().catch(() => ({}))) as { success?: boolean }
    return result.success ? '' : 'การตรวจสอบความปลอดภัยไม่สำเร็จ กรุณาลองใหม่'
  }

  if (!body.botVerified) {
    return 'กรุณายืนยันว่าคุณไม่ใช่โปรแกรมอัตโนมัติ'
  }

  const startedAt = Number(body.botStartedAt ?? 0)
  const elapsed = Date.now() - startedAt
  if (!startedAt || elapsed < 1200) {
    return 'กรุณารอสักครู่แล้วลองยืนยันอีกครั้ง'
  }

  return ''
}
