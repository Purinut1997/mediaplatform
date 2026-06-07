const MAX_URL_LENGTH = 2048

export class UrlValidationError extends Error {}

export function safeHttpUrl(value: unknown, fallback = '') {
  const input = String(value ?? '').trim()
  if (!input) return fallback
  if (input.length > MAX_URL_LENGTH) return fallback

  try {
    const url = new URL(input)
    if (!['http:', 'https:'].includes(url.protocol)) return fallback
    if (url.username || url.password || isPrivateHost(url.hostname)) return fallback
    return url.href
  } catch {
    return fallback
  }
}

export function requireHttpUrl(value: unknown, label: string) {
  const url = safeHttpUrl(value)
  if (!url) {
    throw new UrlValidationError(`${label} ต้องเป็นลิงก์ http/https ที่เปิดใช้งานจากอินเทอร์เน็ตได้`)
  }
  return url
}

export function optionalHttpUrl(value: unknown, label: string) {
  return String(value ?? '').trim() ? requireHttpUrl(value, label) : ''
}

function isPrivateHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === '::1' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    return true
  }

  const ipv4 = host.split('.').map(Number)
  if (ipv4.length === 4 && ipv4.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [first, second] = ipv4
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      first >= 224
    )
  }

  return (
    host.startsWith('::ffff:') ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe8') ||
    host.startsWith('fe9') ||
    host.startsWith('fea') ||
    host.startsWith('feb')
  )
}
