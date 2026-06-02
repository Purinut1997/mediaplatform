import { requireSuperAdmin, writeAuditLog } from '../../_lib/admin'
import { ensureSchema, type Env } from '../../_lib/db'
import { getTelegramStatus, sendTelegramMessage } from '../../_lib/notify'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({ ok: true, telegram: getTelegramStatus(env) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sentAt = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date())
  const result = await sendTelegramMessage(
    env,
    `MIKPURINUT Media Platform\nทดสอบ Telegram notification สำเร็จ\nเวลา: ${sentAt}`,
  )

  if (!result.ok) {
    return Response.json(
      { ok: false, telegram: result.status, error: result.error ?? 'ส่ง Telegram ไม่สำเร็จ' },
      { status: result.status.ready ? 502 : 400 },
    )
  }

  await writeAuditLog(env, currentUser, 'telegram_test', 'integration', 'telegram', {
    sentAt: new Date().toISOString(),
  })
  return Response.json({ ok: true, telegram: result.status })
}
