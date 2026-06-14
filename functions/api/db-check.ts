import { neon } from '@neondatabase/serverless'

type Env = {
  DATABASE_URL?: string
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  if (!env.DATABASE_URL) {
    return Response.json(
      {
        ok: false,
        error: 'DATABASE_URL is not configured',
      },
      { status: 500 },
    )
  }

  const sql = neon(env.DATABASE_URL)
  const [result] = await sql`
    select
      now() as now,
      to_regclass('public.media_purchases') is not null as media_purchases_ready,
      to_regclass('public.purchase_requests') is not null as purchase_requests_ready,
      exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'users' and column_name = 'vip_expires_at'
      ) as vip_expiry_ready
  `

  return Response.json({
    ok: true,
    database: 'neon',
    now: result.now,
    commerceSchema: {
      mediaPurchases: Boolean(result.media_purchases_ready),
      purchaseRequests: Boolean(result.purchase_requests_ready),
      vipExpiry: Boolean(result.vip_expiry_ready),
    },
  })
}
