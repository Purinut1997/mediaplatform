import { describe, expect, it } from 'vitest'
import { readJson } from './api'

describe('frontend API response reader', () => {
  it('reads valid JSON responses', async () => {
    const result = await readJson<{ ok: boolean }>(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )

    expect(result.ok).toBe(true)
  })

  it('returns a useful error when Cloudflare responds with HTML', async () => {
    await expect(
      readJson(new Response('<!doctype html>', { status: 500 })),
    ).rejects.toThrow('API ยังไม่พร้อมใช้งาน')
  })
})
