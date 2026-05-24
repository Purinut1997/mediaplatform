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
  const [result] = await sql`select now() as now`

  return Response.json({
    ok: true,
    database: 'neon',
    now: result.now,
  })
}
