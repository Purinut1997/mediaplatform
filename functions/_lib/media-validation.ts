export const MEDIA_ACCESS_LEVELS = ['สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก'] as const
export const MEDIA_STATUSES = ['ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ'] as const

export class MediaValidationError extends Error {}

function oneOf<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  fallback: T[number],
  label: string,
) {
  const normalized = String(value ?? fallback).trim()
  if (!allowed.includes(normalized)) {
    throw new MediaValidationError(`${label}ไม่ถูกต้อง`)
  }
  return normalized as T[number]
}

export function mediaAccess(value: unknown, fallback: (typeof MEDIA_ACCESS_LEVELS)[number] = 'สาธารณะ') {
  return oneOf(value, MEDIA_ACCESS_LEVELS, fallback, 'สิทธิ์การเข้าถึง')
}

export function mediaStatus(value: unknown, fallback: (typeof MEDIA_STATUSES)[number] = 'ฉบับร่าง') {
  const legacy = value === 'เผยแพร่' ? 'เผยแพร่แล้ว' : value === 'แบบร่าง' ? 'ฉบับร่าง' : value === 'ซ่อน' ? 'ซ่อนชั่วคราว' : value
  return oneOf(legacy, MEDIA_STATUSES, fallback, 'สถานะสื่อ')
}

export function mediaPrice(value: unknown) {
  const price = Number(value ?? 0)
  if (!Number.isFinite(price) || !Number.isInteger(price) || price < 0 || price > 10_000_000) {
    throw new MediaValidationError('ราคาสื่อต้องเป็นจำนวนเต็มตั้งแต่ 0 ถึง 10,000,000 บาท')
  }
  return price
}

export function mediaText(value: unknown, label: string, maxLength: number, fallback = '') {
  const text = String(value ?? fallback).trim()
  if (text.length > maxLength) {
    throw new MediaValidationError(`${label}ต้องไม่เกิน ${maxLength.toLocaleString('en-US')} ตัวอักษร`)
  }
  return text
}
