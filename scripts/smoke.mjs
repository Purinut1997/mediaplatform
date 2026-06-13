const baseUrl = (process.env.SMOKE_BASE_URL || 'https://mediaplatform.pages.dev').replace(/\/$/, '')
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000)

const checks = [
  {
    path: '/',
    validate: (text) => text.includes('<title>MIKPURINUT Media Platform</title>') && text.includes('app-version'),
  },
  { path: '/api/health', validate: (data) => data.ok === true },
  { path: '/api/db-check', validate: (data) => data.ok === true && data.database === 'neon' },
  { path: '/api/settings', validate: (data) => data.ok === true && typeof data.settings === 'object' },
  {
    path: '/api/media?page=1&pageSize=10',
    validate: (data) => data.ok === true && Array.isArray(data.media) && Number.isInteger(data.total),
  },
]

let failed = false
for (const check of checks) {
  const started = Date.now()
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      headers: { 'user-agent': 'MIKPURINUT-production-smoke/1.0' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await response.json() : await response.text()
    const valid = response.ok && check.validate(body)
    console.log(`${valid ? 'PASS' : 'FAIL'} ${check.path} ${response.status} ${Date.now() - started}ms`)
    failed ||= !valid
  } catch (error) {
    failed = true
    console.error(`FAIL ${check.path} ${Date.now() - started}ms ${error instanceof Error ? error.message : error}`)
  }
}

if (failed) process.exitCode = 1
