import { requireSuperAdmin, writeAuditLog } from '../../_lib/admin'
import { ensureSchema, getSql, type Env } from '../../_lib/db'

const allowedTables = ['media', 'media_links', 'media_events', 'media_reviews', 'user_favorites', 'tags', 'media_tags', 'categories', 'users', 'vip_requests', 'purchase_requests', 'media_purchases', 'notifications', 'app_settings'] as const
type BackupTable = (typeof allowedTables)[number]

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const columns = Object.keys(rows[0])
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [columns.map(escape).join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n')
}

async function readTable(sql: ReturnType<typeof getSql>, table: BackupTable) {
  switch (table) {
    case 'media':
      return sql`select * from media order by id desc`
    case 'media_links':
      return sql`select * from media_links order by id desc`
    case 'media_events':
      return sql`select * from media_events order by id desc`
    case 'media_reviews':
      return sql`select * from media_reviews order by updated_at desc`
    case 'user_favorites':
      return sql`select * from user_favorites order by created_at desc`
    case 'tags':
      return sql`select * from tags order by name asc`
    case 'media_tags':
      return sql`select * from media_tags order by media_id desc, tag_id asc`
    case 'categories':
      return sql`select * from categories order by sort_order asc, id asc`
    case 'users':
      return sql`select id, name, email, role, access_level, vip_expires_at, status, created_at, updated_at from users order by id desc`
    case 'vip_requests':
      return sql`select * from vip_requests order by id desc`
    case 'purchase_requests':
      return sql`select * from purchase_requests order by id desc`
    case 'media_purchases':
      return sql`select * from media_purchases order by id desc`
    case 'notifications':
      return sql`select * from notifications order by created_at desc, id desc`
    case 'app_settings':
      return sql`select * from app_settings order by key asc`
  }
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await requireSuperAdmin(env, request)
  if (!currentUser) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  await ensureSchema(env)
  const sql = getSql(env)
  const url = new URL(request.url)
  const format = url.searchParams.get('format') ?? 'json'
  const table = (url.searchParams.get('table') ?? 'media') as BackupTable
  const scope = url.searchParams.get('scope') === 'core' ? 'core' : 'full'

  if (format === 'csv') {
    if (!allowedTables.includes(table)) {
      return Response.json({ ok: false, error: 'Invalid table' }, { status: 400 })
    }
    const rows = (await readTable(sql, table)) as Record<string, unknown>[]
    await writeAuditLog(env, currentUser, 'backup_export', table, null, { format: 'csv', rows: rows.length })
    return new Response(toCsv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="mediaplatform-${table}.csv"`,
      },
    })
  }

  const [media, mediaLinks, tags, mediaTags, categories, users, vipRequests, purchaseRequests, mediaPurchases, settings] = await Promise.all([
    readTable(sql, 'media'),
    readTable(sql, 'media_links'),
    readTable(sql, 'tags'),
    readTable(sql, 'media_tags'),
    readTable(sql, 'categories'),
    readTable(sql, 'users'),
    readTable(sql, 'vip_requests'),
    readTable(sql, 'purchase_requests'),
    readTable(sql, 'media_purchases'),
    readTable(sql, 'app_settings'),
  ])
  const [mediaEvents, mediaReviews, userFavorites, notifications] = scope === 'full'
    ? await Promise.all([
        readTable(sql, 'media_events'),
        readTable(sql, 'media_reviews'),
        readTable(sql, 'user_favorites'),
        readTable(sql, 'notifications'),
      ])
    : [[], [], [], []]
  await writeAuditLog(env, currentUser, 'backup_export', 'system', null, { format: 'json', scope })

  return Response.json({
    ok: true,
    exportedAt: new Date().toISOString(),
    scope,
    data: {
      media,
      mediaLinks,
      mediaEvents,
      mediaReviews,
      userFavorites,
      tags,
      mediaTags,
      categories,
      users,
      vipRequests,
      purchaseRequests,
      mediaPurchases,
      notifications,
      settings,
    },
  })
}
