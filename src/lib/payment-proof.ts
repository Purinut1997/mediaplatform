export type PaymentProof = {
  dataUrl: string
  name: string
}

const MAX_PAYMENT_PROOF_BYTES = 750_000
const PAYMENT_PROOF_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

export function paymentProofAccept() {
  return Array.from(PAYMENT_PROOF_TYPES).join(',')
}

export function paymentProofHelpText() {
  return 'รองรับ JPG, PNG, WebP หรือ PDF ขนาดไม่เกิน 750KB'
}

export function readPaymentProof(file: File): Promise<PaymentProof> {
  if (!PAYMENT_PROOF_TYPES.has(file.type)) {
    return Promise.reject(new Error('กรุณาแนบหลักฐานเป็น JPG, PNG, WebP หรือ PDF'))
  }
  if (file.size > MAX_PAYMENT_PROOF_BYTES) {
    return Promise.reject(new Error('ไฟล์หลักฐานต้องมีขนาดไม่เกิน 750KB'))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์หลักฐานไม่สำเร็จ'))
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      if (!dataUrl.startsWith('data:')) {
        reject(new Error('ไฟล์หลักฐานไม่ถูกต้อง'))
        return
      }
      resolve({ dataUrl, name: file.name })
    }
    reader.readAsDataURL(file)
  })
}
