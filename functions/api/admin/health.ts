import { requireAdminPermission } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'
import { emailStatus } from '../../_lib/email'

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  if (!(await requireAdminPermission(env, request, 'system:read'))) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  await ensureSchema(env)
  const sql = getSql(env)
  const [dbNow] = await sql`select now() as now`
  const [counts] = await sql`
    select
      (select count(*)::int from media) as media_count,
      (select count(*)::int from users) as user_count,
      (select count(*)::int from vip_requests where status = 'pending') as pending_vip_count,
      (select count(*)::int from media_links) as link_count,
      (select count(*)::int from error_logs where created_at > now() - interval '24 hours') as error_24h_count,
      (select count(*)::int from notifications where read_at is null) as unread_notification_count,
      (select count(*)::int from request_limits where blocked_until > now()) as active_rate_limit_count
  `
  const [lastBackup] = await sql`
    select created_at
    from audit_logs
    where action = 'backup_export'
    order by created_at desc
    limit 1
  `
  const [lastError] = await sql`
    select source, message, created_at
    from error_logs
    order by created_at desc
    limit 1
  `
  const [lastLinkCheck] = await sql`
    select created_at
    from audit_logs
    where action in ('link_check', 'cron_link_check')
    order by created_at desc
    limit 1
  `

  return Response.json({
    ok: true,
    health: {
      cloudflare: 'Online',
      neon: 'Connected',
      api: 'OK',
      storage: 'External links',
      databaseTime: dbNow?.now,
      responseTimeMs: Date.now() - startedAt,
      lastBackupAt: lastBackup?.created_at ?? null,
      lastLinkCheckAt: lastLinkCheck?.created_at ?? null,
      lastError: lastError
        ? {
            source: lastError.source,
            message: lastError.message,
            createdAt: lastError.created_at,
          }
        : null,
      integrations: {
        passwordResetEmail: emailStatus(env).configured,
        turnstile: Boolean(env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY),
        cron: Boolean(env.CRON_SECRET),
        telegram: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
      },
      counts: {
        media: counts?.media_count ?? 0,
        users: counts?.user_count ?? 0,
        pendingVip: counts?.pending_vip_count ?? 0,
        links: counts?.link_count ?? 0,
        errors24h: counts?.error_24h_count ?? 0,
        unreadNotifications: counts?.unread_notification_count ?? 0,
        activeRateLimits: counts?.active_rate_limit_count ?? 0,
      },
    },
  })
}
