import { getSql, type Env } from './db'

export type NotificationTone = 'sky' | 'amber' | 'red' | 'emerald'
export type NotificationAudience = 'superadmin' | 'admin' | 'all'

export type NotificationInput = {
  audience?: NotificationAudience
  type: string
  title: string
  detail: string
  tone?: NotificationTone
  targetType?: string
  targetId?: string | number | null
  fingerprint?: string
}

export async function writeNotification(env: Env, input: NotificationInput) {
  const sql = getSql(env)
  const audience = input.audience ?? 'superadmin'
  const targetId = input.targetId == null ? null : String(input.targetId)
  const fingerprint =
    input.fingerprint ?? `${audience}:${input.type}:${input.targetType ?? 'system'}:${targetId ?? input.title}`

  await sql`
    insert into notifications (
      audience, type, title, detail, tone, target_type, target_id, fingerprint, created_at
    )
    values (
      ${audience},
      ${input.type},
      ${input.title},
      ${input.detail},
      ${input.tone ?? 'sky'},
      ${input.targetType ?? null},
      ${targetId},
      ${fingerprint},
      now()
    )
    on conflict (fingerprint) do update set
      title = excluded.title,
      detail = excluded.detail,
      tone = excluded.tone,
      target_type = excluded.target_type,
      target_id = excluded.target_id
  `
}
