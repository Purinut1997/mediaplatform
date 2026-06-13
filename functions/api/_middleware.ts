type Context = {
  request: Request
  next: () => Promise<Response>
}

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const onRequest = async ({ request, next }: Context) => {
  const url = new URL(request.url)
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')
  const contentLength = Number(request.headers.get('Content-Length') ?? 0)
  const maxBodyBytes = url.pathname === '/api/admin/restore' ? 25_000_000 : 512_000

  if (
    unsafeMethods.has(request.method) &&
    ((origin && origin !== url.origin) || fetchSite === 'cross-site')
  ) {
    return Response.json({ ok: false, error: 'Cross-site request blocked' }, { status: 403 })
  }
  if (unsafeMethods.has(request.method) && contentLength > maxBodyBytes) {
    return Response.json({ ok: false, error: 'Request body is too large' }, { status: 413 })
  }

  const response = await next()
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Robots-Tag', 'noindex')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
