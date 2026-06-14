import { afterEach, describe, expect, it, vi } from 'vitest'
import worker from './index'

afterEach(() => vi.unstubAllGlobals())

const env = {
  SITE_ORIGIN: 'https://mediaplatform.pages.dev',
  CRON_SECRET: 's3cr3t-value-not-shown',
}

describe('link check cron worker', () => {
  it('reports its target without exposing the secret', async () => {
    const response = await worker.fetch(new Request('https://worker.example'), env)
    const data = await response.json()

    expect(data).toMatchObject({
      ok: true,
      target: 'https://mediaplatform.pages.dev/api/cron/link-checks',
      secretConfigured: true,
    })
    expect(JSON.stringify(data)).not.toContain(env.CRON_SECRET)
  })

  it('rejects unauthorized manual runs', async () => {
    const response = await worker.fetch(new Request('https://worker.example', { method: 'POST' }), env)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'Unauthorized' })
  })

  it('forwards authorized manual runs to the protected Pages endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, results: [] }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await worker.fetch(new Request('https://worker.example', {
      method: 'POST',
      headers: { 'x-cron-secret': env.CRON_SECRET },
    }), env)

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://mediaplatform.pages.dev/api/cron/link-checks')
    expect(init).toMatchObject({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': env.CRON_SECRET,
      },
    })
  })

  it('schedules the same protected link check', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true, results: [] }))
    vi.stubGlobal('fetch', fetchMock)
    const tasks: Promise<unknown>[] = []

    worker.scheduled(
      { cron: '0 */6 * * *', scheduledTime: 1234 },
      env,
      { waitUntil: (task) => tasks.push(task) },
    )
    await Promise.all(tasks)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, init] = fetchMock.mock.calls[0]
    expect(String(init?.body)).toContain('cron:0 */6 * * *:1234')
  })
})
