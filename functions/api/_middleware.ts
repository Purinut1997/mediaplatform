type Context = {
  request: Request
  next: () => Promise<Response>
}

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const onRequest = async ({ request, next }: Context) => {
  const url = new URL(request.url)
  const origin = request.headers.get('Origin')
  const fetchSite = request.headers.get('Sec-Fetch-Site')

  if (
    unsafeMethods.has(request.method) &&
    ((origin && origin !== url.origin) || fetchSite === 'cross-site')
  ) {
    return Response.json({ ok: false, error: 'Cross-site request blocked' }, { status: 403 })
  }

  const response = await next()
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'no-store')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-Robots-Tag', 'noindex')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
