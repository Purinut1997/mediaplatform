import { boundedText, InputValidationError } from './input'

const MAX_PAYMENT_PROOF_DATA_URL_LENGTH = 1_100_000
const PAYMENT_PROOF_PATTERN = /^data:(image\/(?:jpeg|png|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/

export type DecodedPaymentProof = {
  bytes: Uint8Array
  mimeType: string
}

export function paymentProofDataUrl(value: unknown, label = 'หลักฐานการโอน') {
  const dataUrl = boundedText(value, label, { max: MAX_PAYMENT_PROOF_DATA_URL_LENGTH, trim: false })
  if (!dataUrl) return ''
  if (!PAYMENT_PROOF_PATTERN.test(dataUrl)) {
    throw new InputValidationError(`${label}ต้องเป็นไฟล์ JPG, PNG, WebP หรือ PDF เท่านั้น`)
  }
  return dataUrl
}

export function decodePaymentProof(dataUrl: string): DecodedPaymentProof {
  const match = PAYMENT_PROOF_PATTERN.exec(dataUrl)
  if (!match) throw new InputValidationError('ข้อมูลหลักฐานการโอนไม่ถูกต้อง')

  const encoded = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return { bytes, mimeType: match[1] }
}
