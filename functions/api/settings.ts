import { getCurrentUser } from '../_lib/auth'
import { ensureSchema, getSql, type Env } from '../_lib/db'

type SiteSettings = {
  vipRegistrationEnabled: boolean
  vipPrice: number
  vipQrUrl: string
  vipBankName: string
  vipAccountNumber: string
  vipAccountName: string
}

const defaultSettings: SiteSettings = {
  vipRegistrationEnabled: true,
  vipPrice: 499,
  vipQrUrl: '',
  vipBankName: 'พร้อมเพย์ (PromptPay)',
  vipAccountNumber: '',
  vipAccountName: 'MIKPURINUT',
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const [row] = (await sql`
    select value
    from app_settings
    where key = 'site'
    limit 1
  `) as Array<{ value: SiteSettings }>

  return Response.json({ ok: true, settings: row?.value ?? defaultSettings })
}

export const onRequestPut = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await getCurrentUser(env, request)
  if (currentUser?.role !== 'superadmin') {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<SiteSettings>
  const settings: SiteSettings = {
    vipRegistrationEnabled: Boolean(body.vipRegistrationEnabled),
    vipPrice: Number(body.vipPrice ?? defaultSettings.vipPrice),
    vipQrUrl: String(body.vipQrUrl ?? ''),
    vipBankName: String(body.vipBankName ?? defaultSettings.vipBankName),
    vipAccountNumber: String(body.vipAccountNumber ?? ''),
    vipAccountName: String(body.vipAccountName ?? defaultSettings.vipAccountName),
  }

  const sql = getSql(env)
  await sql`
    insert into app_settings (key, value, updated_at)
    values ('site', ${JSON.stringify(settings)}::jsonb, now())
    on conflict (key) do update set
      value = excluded.value,
      updated_at = now()
  `

  return Response.json({ ok: true, settings })
}
