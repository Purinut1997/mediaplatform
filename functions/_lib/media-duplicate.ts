const COPY_SUFFIX = ' (สำเนา)'

export function duplicateMediaTitle(value: unknown) {
  const title = String(value ?? '').trim()
  const base = title.slice(0, Math.max(0, 200 - COPY_SUFFIX.length)).trimEnd()
  return `${base || 'สื่อ'}${COPY_SUFFIX}`
}

export function duplicateMediaSlug(value: unknown, id: number, timestamp = Date.now()) {
  const base = String(value ?? 'media')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'media'
  return `${base}-copy-${id}-${timestamp}`
}
