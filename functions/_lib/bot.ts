export type BotCheckPayload = {
  botVerified?: boolean
  botStartedAt?: number
  website?: string
}

export function validateBotCheck(body: BotCheckPayload) {
  if (String(body.website ?? '').trim()) {
    return 'ระบบตรวจพบพฤติกรรมอัตโนมัติ'
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
