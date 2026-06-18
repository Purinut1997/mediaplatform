import { requireSuperAdmin } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { decodePaymentProof } from '../../_lib/payment-proof'

function proofId(request: Request) {
  const id = Number(new URL(request.url).searchParams.get('id'))
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}

function safeFilename(value: unknown, mimeType: string) {
  const extension = mimeType === 'application/pdf'
    ? 'pdf'
    : mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
        ? 'webp'
        : 'jpg'
  const name = String(value ?? '')
    .replace(/[\r\n"\\/]+/g, '-')
    .trim()
    .slice(0, 160)
  return name || `vip-payment-proof.${extension}`
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireSuperAdmin(env, request))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const id = proofId(request)
  if (!id) return Response.json({ ok: false, error: 'รหัสคำขอไม่ถูกต้อง' }, { status: 400 })

  await ensureSchema(env)
  const sql = getSql(env)
  const [proof] = await sql`
    select slip_name, slip_data_url
    from vip_requests
    where id = ${id}
    limit 1
  `
  if (!proof?.slip_data_url) {
    return Response.json({ ok: false, error: 'คำขอนี้ไม่มีไฟล์หลักฐานการโอน' }, { status: 404 })
  }

  try {
    const { bytes, mimeType } = decodePaymentProof(String(proof.slip_data_url))
    const filename = safeFilename(proof.slip_name, mimeType)
    return new Response(bytes, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Type': mimeType,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return Response.json({ ok: false, error: 'ไฟล์หลักฐานเสียหายหรือไม่รองรับ' }, { status: 422 })
  }
}
