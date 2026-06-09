export class InputValidationError extends Error {}

export function boundedText(
  value: unknown,
  label: string,
  { min = 0, max, trim = true }: { min?: number; max: number; trim?: boolean },
) {
  const text = trim ? String(value ?? '').trim() : String(value ?? '')
  if (text.length < min || text.length > max) {
    throw new InputValidationError(`${label}ต้องมีความยาว ${min ? `${min}-${max}` : `ไม่เกิน ${max}`} ตัวอักษร`)
  }
  return text
}

export function normalizedEmail(value: unknown) {
  const email = boundedText(value, 'อีเมล', { min: 3, max: 254 }).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputValidationError('รูปแบบอีเมลไม่ถูกต้อง')
  }
  return email
}

export function passwordInput(value: unknown, min = 8) {
  return boundedText(value, 'รหัสผ่าน', { min, max: 200, trim: false })
}

export function boundedInteger(
  value: unknown,
  label: string,
  { min = 0, max }: { min?: number; max: number },
) {
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new InputValidationError(`${label}ต้องเป็นจำนวนเต็มตั้งแต่ ${min.toLocaleString()} ถึง ${max.toLocaleString()}`)
  }
  return number
}
