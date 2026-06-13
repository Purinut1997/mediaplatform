import { requireSuperAdmin, writeAuditLog, writeErrorLog } from '../../_lib/admin'
import { ensureSchema, type Env } from '../../_lib/db'
import { emailHtmlText, emailStatus, sendEmail } from '../../_lib/email'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({ ok: true, email: emailStatus(env) })
}

export const onRequestPost = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const status = emailStatus(env)
  if (!status.configured) {
    return Response.json(
      { ok: false, email: status, error: 'RESEND_API_KEY, EMAIL_FROM หรือ APP_URL ยังไม่ได้ตั้งค่าครบ' },
      { status: 400 },
    )
  }

  await ensureSchema(env)
  const sentAt = new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Bangkok',
  }).format(new Date())
  let sent: boolean
  try {
    sent = await sendEmail(
      env,
      currentUser.email,
      'ทดสอบอีเมล - MIKPURINUT Nexus',
      `<h2>MIKPURINUT Nexus</h2><p>ระบบส่งอีเมลพร้อมใช้งานแล้ว</p><p>ผู้ทดสอบ: ${emailHtmlText(currentUser.name)}</p><p>เวลา: ${emailHtmlText(sentAt)}</p>`,
    )
  } catch (error) {
    await writeErrorLog(env, 'email.test', error, { email: currentUser.email })
    return Response.json({ ok: false, email: status, error: 'เชื่อมต่อ Resend ไม่สำเร็จ กรุณาลองใหม่' }, { status: 502 })
  }

  if (!sent) {
    await writeErrorLog(env, 'email.test', 'Resend rejected test email', { email: currentUser.email })
    return Response.json({ ok: false, email: status, error: 'Resend ปฏิเสธอีเมลทดสอบ กรุณาตรวจโดเมนผู้ส่ง' }, { status: 502 })
  }

  await writeAuditLog(env, currentUser, 'email_test', 'integration', 'resend', {
    recipient: currentUser.email,
    sentAt: new Date().toISOString(),
  })
  return Response.json({ ok: true, email: status, recipient: currentUser.email })
}
