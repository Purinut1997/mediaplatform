const baseUrl = (process.env.SMOKE_BASE_URL || 'https://mediaplatform.pages.dev').replace(/\/$/, '')
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000)

const checks = [
  {
    path: '/',
    validate: (text, response) =>
      text.includes('<title>MIKPURINUT Media Platform</title>') &&
      text.includes('app-version') &&
      response.headers.get('x-frame-options') === 'DENY' &&
      response.headers.get('x-content-type-options') === 'nosniff' &&
      Boolean(response.headers.get('content-security-policy')),
  },
  {
    path: '/api/health',
    validate: (data, response) =>
      data.ok === true &&
      response.headers.get('cache-control') === 'no-store' &&
      Boolean(response.headers.get('content-security-policy')) &&
      Boolean(response.headers.get('permissions-policy')),
  },
  { path: '/api/db-check', validate: (data) => data.ok === true && data.database === 'neon' },
  {
    path: '/api/auth/config',
    validate: (data) =>
      data.ok === true &&
      typeof data.turnstileSiteKey === 'string' &&
      data.turnstileSiteKey.length > 10 &&
      typeof data.passwordResetEnabled === 'boolean' &&
      typeof data.googleEnabled === 'boolean',
  },
  {
    path: '/api/auth/google',
    expectedStatus: 302,
    redirect: 'manual',
    validate: (_body, response) => {
      const location = response.headers.get('location') || ''
      const stateCookie = response.headers.get('set-cookie') || ''
      return (
        location.includes('oauth=not_configured') ||
        (location.includes('accounts.google.com/o/oauth2') && stateCookie.includes('mp_google_state='))
      )
    },
  },
  {
    path: '/api/auth/google/callback',
    expectedStatus: 302,
    redirect: 'manual',
    validate: (_body, response) => (response.headers.get('location') || '').includes('oauth=invalid_state'),
  },
  { path: '/api/auth/me', validate: (data) => data.ok === true && data.user === null },
  { path: '/api/settings', validate: (data) => data.ok === true && typeof data.settings === 'object' },
  {
    path: '/api/media?page=1&pageSize=10',
    validate: (data) => data.ok === true && Array.isArray(data.media) && Number.isInteger(data.total),
  },
  {
    path: '/api/media?page=1&pageSize=100&status=all&access=VIP',
    validate: (data) =>
      data.ok === true &&
      Array.isArray(data.media) &&
      data.media.every((item) => ['เผยแพร่', 'เผยแพร่แล้ว'].includes(item.status)) &&
      data.media.every((item) => item.resourceUrl === '' && item.previewUrl === '' && item.links.length === 0),
  },
  {
    path: '/api/admin/email',
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  },
  {
    path: '/api/admin/health',
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  },
  {
    path: '/api/admin/notifications?page=1&pageSize=8',
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  },
  ...['/api/admin/activity?page=1', '/api/admin/errors?page=1', '/api/admin/users?page=1'].map((path) => ({
    path,
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  })),
  {
    path: '/api/media/bulk',
    method: 'POST',
    body: { action: 'delete', ids: [1] },
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  },
  {
    path: '/api/media/duplicate',
    method: 'POST',
    body: { id: 1 },
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  },
  {
    path: '/api/cron/link-checks',
    method: 'POST',
    body: {},
    expectedStatus: 401,
    validate: (data) => data.ok === false && data.error === 'Unauthorized',
  },
]

let failed = false
for (const check of checks) {
  const started = Date.now()
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      method: check.method || 'GET',
      headers: {
        'user-agent': 'MIKPURINUT-production-smoke/1.0',
        ...(check.body ? { 'content-type': 'application/json' } : {}),
      },
      body: check.body ? JSON.stringify(check.body) : undefined,
      redirect: check.redirect || 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    })
    const contentType = response.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? await response.json() : await response.text()
    const valid = response.status === (check.expectedStatus ?? 200) && check.validate(body, response)
    console.log(`${valid ? 'PASS' : 'FAIL'} ${check.path} ${response.status} ${Date.now() - started}ms`)
    failed ||= !valid
  } catch (error) {
    failed = true
    console.error(`FAIL ${check.path} ${Date.now() - started}ms ${error instanceof Error ? error.message : error}`)
  }
}

if (failed) process.exitCode = 1
