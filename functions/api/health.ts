export const onRequestGet = async () =>
  Response.json({
    ok: true,
    service: 'media-vip-platform',
    runtime: 'cloudflare-pages-functions',
  })
