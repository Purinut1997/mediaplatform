import { getCurrentUser } from '../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../_lib/admin'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { writeNotification } from '../_lib/notifications'
import { boundedInteger, boundedText, InputValidationError } from '../_lib/input'
import { optionalHttpUrl, safeHttpUrl, UrlValidationError } from '../_lib/url'

type SiteSettings = {
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  heroImageUrl: string
  heroPrimaryLabel: string
  heroSecondaryLabel: string
  announcementText: string
  footerBrandName: string
  footerDescription: string
  footerSystemTitle: string
  footerSystemText: string
  maintenanceEnabled: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  vipRegistrationEnabled: boolean
  vipPrice: number
  vipLifetimeEnabled: boolean
  vipDurationDays: number
  vipRefundDays: number
  vipUpgradeBadge: string
  vipUpgradeTitle: string
  vipUpgradeDescription: string
  vipUpgradeBenefits: string
  vipTermsText: string
  purchaseEnabled: boolean
  purchaseRefundDays: number
  orderExpiryHours: number
  paymentReviewHours: number
  commercePolicyText: string
  refundRequestEnabled: boolean
  refundContactTitle: string
  refundInstructions: string
  refundFormUrl: string
  refundContactEmail: string
  refundLineUrl: string
  refundContactPhone: string
  vipQrUrl: string
  vipBankName: string
  vipAccountNumber: string
  vipAccountName: string
  vipPaymentTitle: string
  vipPaymentSubtitle: string
  vipSlipLabel: string
  vipAgreementLabel: string
  vipSubmitLabel: string
  eserviceMemberLimit: number
  eserviceVipLimit: number
}

const defaultSettings: SiteSettings = {
  heroEyebrow: 'AI / Cyber / School Operations',
  heroTitle: 'ศูนย์กลางสื่อการเรียนรู้ที่สดใส ล้ำสมัย และใช้งานง่าย',
  heroDescription:
    'ออกแบบเป็น portal โรงเรียนยุคใหม่ มีคลังสื่อแบบ dashboard, แยกสิทธิ์ Public / Member / VIP และเชื่อมสื่อจาก Drive, Sheet, YouTube ได้ในที่เดียว',
  heroImageUrl:
    'https://raw.githubusercontent.com/Purinut1997/web-images/c70597729a1ba58a7b7b672d2bcace2f673a5a49/bdbeb65d-b4f5-4f65-a388-e95d950eac84%20%281%29.png',
  heroPrimaryLabel: 'เปิดคลังสื่อ',
  heroSecondaryLabel: 'ดูสิทธิ์ VIP',
  announcementText: '',
  footerBrandName: 'MIKPURINUT Nexus',
  footerDescription: 'ระบบคลังสื่อสมาชิกสำหรับโรงเรียนและผู้จัดอบรม รองรับลิงก์ Drive, Sheet, YouTube และหลังบ้านผู้ดูแล',
  footerSystemTitle: 'ระบบ',
  footerSystemText: 'Public · Member · VIP · Admin',
  maintenanceEnabled: false,
  maintenanceTitle: 'ระบบกำลังปรับปรุง',
  maintenanceMessage: 'กรุณากลับมาใหม่ภายหลัง',
  vipRegistrationEnabled: false,
  vipPrice: 0,
  vipLifetimeEnabled: false,
  vipDurationDays: 30,
  vipRefundDays: 7,
  vipUpgradeBadge: 'UPGRADE TO VIP',
  vipUpgradeTitle: 'ปลดล็อกคลังสื่อขั้นสูงภายหลังได้ทุกเมื่อ',
  vipUpgradeDescription: 'ส่งคำขอจากบัญชีสมาชิกเดิม ประวัติและรายการโปรดทั้งหมดจะยังอยู่ครบ',
  vipUpgradeBenefits: 'เข้าถึงสื่อสมาชิกและ VIP\nรับสิทธิ์ตามระยะเวลาที่ผู้ดูแลอนุมัติ\nติดตามสถานะคำขอได้จากหน้านี้',
  vipTermsText: '1. สิทธิ์ VIP ผูกกับบัญชีผู้สมัครและห้ามโอน ให้ยืม จำหน่ายต่อ หรือเผยแพร่สื่อแก่บุคคลอื่น\n2. ระยะเวลาสิทธิ์เริ่มนับหลังผู้ดูแลตรวจสอบหลักฐานและอนุมัติคำขอแล้ว\n3. ผู้สมัครต้องแนบหลักฐานการชำระเงินที่ถูกต้อง ชัดเจน และเป็นรายการจริง\n4. การส่งข้อมูลหรือหลักฐานอันเป็นเท็จอาจทำให้คำขอถูกปฏิเสธ ระงับสิทธิ์ หรือปิดบัญชี\n5. การขอคืนเงินเป็นไปตามระยะเวลาที่ระบบแสดง และขึ้นอยู่กับการใช้งานสิทธิ์จริงรวมถึงข้อกำหนดตามกฎหมาย\n6. ผู้ดูแลอาจปรับปรุงบริการหรือเงื่อนไข โดยจะแจ้งข้อความฉบับปัจจุบันให้ตรวจสอบก่อนยอมรับ\n7. เมื่อเลือกยอมรับ ถือว่าผู้สมัครได้อ่าน เข้าใจ และยอมรับเงื่อนไขฉบับนี้แล้ว',
  purchaseEnabled: false,
  purchaseRefundDays: 7,
  orderExpiryHours: 24,
  paymentReviewHours: 24,
  commercePolicyText: 'สิทธิ์ผูกกับบัญชีผู้ซื้อ ห้ามเผยแพร่หรือจำหน่ายต่อ การคืนเงินพิจารณาตามเงื่อนไขที่แสดงก่อนชำระเงิน',
  refundRequestEnabled: true,
  refundContactTitle: 'ศูนย์ช่วยเหลือและขอคืนเงิน',
  refundInstructions: 'กรุณาแจ้งอีเมลบัญชี รายการหรือสื่อที่ต้องการคืนเงิน วันที่ชำระเงิน เหตุผล และหลักฐานที่เกี่ยวข้อง ผู้ดูแลจะตรวจสอบตามลำดับโดยไม่ขอรหัสผ่านหรือข้อมูลบัตรของคุณ',
  refundFormUrl: '',
  refundContactEmail: '',
  refundLineUrl: '',
  refundContactPhone: '',
  vipQrUrl: '',
  vipBankName: 'พร้อมเพย์ (PromptPay)',
  vipAccountNumber: '',
  vipAccountName: 'MIKPURINUT',
  vipPaymentTitle: 'ข้อมูลการชำระเงิน VIP',
  vipPaymentSubtitle: 'กรุณาโอนเงินและแนบสลิปเพื่อยืนยันสิทธิ์',
  vipSlipLabel: 'แนบสลิปโอนเงิน',
  vipAgreementLabel: 'ข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน',
  vipSubmitLabel: 'ลงทะเบียนสมาชิก',
  eserviceMemberLimit: 6,
  eserviceVipLimit: 18,
}

function directImageUrl(value: unknown) {
  const url = safeHttpUrl(value)
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parsed.hostname === 'github.com' && parts.length >= 5 && parts[2] === 'blob') {
      return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts.slice(3).join('/')}`
    }
  } catch {
    return ''
  }
  return url
}

function optionalEmail(value: unknown) {
  const email = boundedText(value, 'อีเมลติดต่อคืนเงิน', { max: 160 }).toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new InputValidationError('รูปแบบอีเมลติดต่อคืนเงินไม่ถูกต้อง')
  }
  return email
}

function normalizeSettings(value?: Partial<SiteSettings>) {
  const legacyPrice = Number(value?.vipPrice ?? defaultSettings.vipPrice)
  return {
    ...defaultSettings,
    ...(value ?? {}),
    vipRegistrationEnabled: Boolean(value?.vipRegistrationEnabled),
    purchaseEnabled: Boolean(value?.purchaseEnabled),
    maintenanceEnabled: Boolean(value?.maintenanceEnabled),
    vipLifetimeEnabled: Boolean(value?.vipLifetimeEnabled),
    vipPrice: Number.isInteger(legacyPrice) && legacyPrice >= 0 && legacyPrice <= 10_000_000 ? legacyPrice : 0,
    vipDurationDays: boundedInteger(value?.vipDurationDays ?? defaultSettings.vipDurationDays, 'อายุ VIP', { min: 1, max: 3650 }),
    vipRefundDays: boundedInteger(value?.vipRefundDays ?? defaultSettings.vipRefundDays, 'ระยะเวลาขอคืนเงิน VIP', { max: 365 }),
    purchaseRefundDays: boundedInteger(value?.purchaseRefundDays ?? defaultSettings.purchaseRefundDays, 'ระยะเวลาขอคืนเงินซื้อแยก', { max: 365 }),
    orderExpiryHours: boundedInteger(value?.orderExpiryHours ?? defaultSettings.orderExpiryHours, 'อายุคำสั่งซื้อ', { min: 1, max: 720 }),
    paymentReviewHours: boundedInteger(value?.paymentReviewHours ?? defaultSettings.paymentReviewHours, 'เวลาตรวจสอบการชำระเงิน', { min: 1, max: 720 }),
    eserviceMemberLimit: boundedInteger(value?.eserviceMemberLimit ?? defaultSettings.eserviceMemberLimit, 'โควตา E-Service สมาชิก', { max: 1000 }),
    eserviceVipLimit: boundedInteger(value?.eserviceVipLimit ?? defaultSettings.eserviceVipLimit, 'โควตา E-Service VIP', { max: 1000 }),
    refundRequestEnabled: value?.refundRequestEnabled === undefined
      ? defaultSettings.refundRequestEnabled
      : Boolean(value.refundRequestEnabled),
    vipBankName: value?.vipBankName?.trim() || defaultSettings.vipBankName,
    vipAccountName: value?.vipAccountName?.trim() || defaultSettings.vipAccountName,
    vipPaymentTitle: value?.vipPaymentTitle?.trim() || defaultSettings.vipPaymentTitle,
    vipPaymentSubtitle: value?.vipPaymentSubtitle?.trim() || defaultSettings.vipPaymentSubtitle,
    vipSlipLabel: value?.vipSlipLabel?.trim() || defaultSettings.vipSlipLabel,
    vipAgreementLabel: value?.vipAgreementLabel?.trim() || defaultSettings.vipAgreementLabel,
    vipSubmitLabel: value?.vipSubmitLabel?.trim() || defaultSettings.vipSubmitLabel,
    heroImageUrl: safeHttpUrl(value?.heroImageUrl, defaultSettings.heroImageUrl),
    vipQrUrl: directImageUrl(value?.vipQrUrl),
  }
}

function readSettings(body: Partial<SiteSettings>): SiteSettings {
  return normalizeSettings({
    heroEyebrow: boundedText(body.heroEyebrow ?? defaultSettings.heroEyebrow, 'ข้อความเหนือหัวข้อ', { max: 100 }),
    heroTitle: boundedText(body.heroTitle ?? defaultSettings.heroTitle, 'หัวข้อหน้าแรก', { min: 1, max: 180 }),
    heroDescription: boundedText(body.heroDescription ?? defaultSettings.heroDescription, 'คำอธิบายหน้าแรก', { max: 800 }),
    heroImageUrl: optionalHttpUrl(body.heroImageUrl, 'ลิงก์ภาพหน้าแรก') || defaultSettings.heroImageUrl,
    heroPrimaryLabel: boundedText(body.heroPrimaryLabel ?? defaultSettings.heroPrimaryLabel, 'ข้อความปุ่มหลัก', { min: 1, max: 60 }),
    heroSecondaryLabel: boundedText(body.heroSecondaryLabel ?? defaultSettings.heroSecondaryLabel, 'ข้อความปุ่มรอง', { min: 1, max: 60 }),
    announcementText: boundedText(body.announcementText, 'ข้อความประกาศ', { max: 500 }),
    footerBrandName: boundedText(body.footerBrandName ?? defaultSettings.footerBrandName, 'ชื่อแบรนด์ Footer', { min: 1, max: 100 }),
    footerDescription: boundedText(body.footerDescription ?? defaultSettings.footerDescription, 'คำอธิบาย Footer', { max: 500 }),
    footerSystemTitle: boundedText(body.footerSystemTitle ?? defaultSettings.footerSystemTitle, 'หัวข้อระบบ Footer', { min: 1, max: 80 }),
    footerSystemText: boundedText(body.footerSystemText ?? defaultSettings.footerSystemText, 'ข้อความระบบ Footer', { max: 300 }),
    maintenanceEnabled: Boolean(body.maintenanceEnabled),
    maintenanceTitle: boundedText(body.maintenanceTitle ?? defaultSettings.maintenanceTitle, 'หัวข้อปิดปรับปรุง', { min: 1, max: 120 }),
    maintenanceMessage: boundedText(body.maintenanceMessage ?? defaultSettings.maintenanceMessage, 'ข้อความปิดปรับปรุง', { max: 500 }),
    vipRegistrationEnabled: Boolean(body.vipRegistrationEnabled),
    vipPrice: boundedInteger(body.vipPrice ?? defaultSettings.vipPrice, 'ราคา VIP', { max: 10_000_000 }),
    vipLifetimeEnabled: Boolean(body.vipLifetimeEnabled),
    vipDurationDays: boundedInteger(body.vipDurationDays ?? defaultSettings.vipDurationDays, 'อายุ VIP', { min: 1, max: 3650 }),
    vipRefundDays: boundedInteger(body.vipRefundDays ?? defaultSettings.vipRefundDays, 'ระยะเวลาขอคืนเงิน VIP', { max: 365 }),
    vipUpgradeBadge: boundedText(body.vipUpgradeBadge ?? defaultSettings.vipUpgradeBadge, 'ป้ายหัวข้อ VIP', { min: 1, max: 80 }),
    vipUpgradeTitle: boundedText(body.vipUpgradeTitle ?? defaultSettings.vipUpgradeTitle, 'หัวข้อแนะนำ VIP', { min: 1, max: 180 }),
    vipUpgradeDescription: boundedText(body.vipUpgradeDescription ?? defaultSettings.vipUpgradeDescription, 'คำอธิบาย VIP', { max: 500 }),
    vipUpgradeBenefits: boundedText(body.vipUpgradeBenefits ?? defaultSettings.vipUpgradeBenefits, 'รายการสิทธิประโยชน์ VIP', { max: 1000 }),
    vipTermsText: boundedText(body.vipTermsText ?? defaultSettings.vipTermsText, 'เงื่อนไข VIP', { min: 1, max: 5000 }),
    purchaseEnabled: Boolean(body.purchaseEnabled),
    purchaseRefundDays: boundedInteger(body.purchaseRefundDays ?? defaultSettings.purchaseRefundDays, 'ระยะเวลาขอคืนเงินซื้อแยก', { max: 365 }),
    orderExpiryHours: boundedInteger(body.orderExpiryHours ?? defaultSettings.orderExpiryHours, 'อายุคำสั่งซื้อ', { min: 1, max: 720 }),
    paymentReviewHours: boundedInteger(body.paymentReviewHours ?? defaultSettings.paymentReviewHours, 'เวลาตรวจสอบการชำระเงิน', { min: 1, max: 720 }),
    commercePolicyText: boundedText(body.commercePolicyText ?? defaultSettings.commercePolicyText, 'เงื่อนไขการซื้อและคืนเงิน', { max: 2000 }),
    refundRequestEnabled: Boolean(body.refundRequestEnabled),
    refundContactTitle: boundedText(body.refundContactTitle ?? defaultSettings.refundContactTitle, 'หัวข้อขอคืนเงิน', { min: 1, max: 120 }),
    refundInstructions: boundedText(body.refundInstructions ?? defaultSettings.refundInstructions, 'คำแนะนำขอคืนเงิน', { min: 1, max: 1500 }),
    refundFormUrl: optionalHttpUrl(body.refundFormUrl, 'ลิงก์แบบฟอร์มขอคืนเงิน'),
    refundContactEmail: optionalEmail(body.refundContactEmail),
    refundLineUrl: optionalHttpUrl(body.refundLineUrl, 'ลิงก์ LINE สำหรับคืนเงิน'),
    refundContactPhone: boundedText(body.refundContactPhone, 'เบอร์โทรติดต่อคืนเงิน', { max: 40 }),
    vipQrUrl: directImageUrl(optionalHttpUrl(body.vipQrUrl, 'ลิงก์ QR Code')),
    vipBankName: boundedText(body.vipBankName ?? defaultSettings.vipBankName, 'ชื่อช่องทางชำระเงิน', { max: 120 }),
    vipAccountNumber: boundedText(body.vipAccountNumber, 'เลขบัญชี', { max: 80 }),
    vipAccountName: boundedText(body.vipAccountName ?? defaultSettings.vipAccountName, 'ชื่อบัญชี', { max: 120 }),
    vipPaymentTitle: boundedText(body.vipPaymentTitle ?? defaultSettings.vipPaymentTitle, 'หัวข้อชำระเงิน', { max: 120 }),
    vipPaymentSubtitle: boundedText(body.vipPaymentSubtitle ?? defaultSettings.vipPaymentSubtitle, 'คำอธิบายชำระเงิน', { max: 300 }),
    vipSlipLabel: boundedText(body.vipSlipLabel ?? defaultSettings.vipSlipLabel, 'ข้อความแนบสลิป', { max: 100 }),
    vipAgreementLabel: boundedText(body.vipAgreementLabel ?? defaultSettings.vipAgreementLabel, 'ข้อความยอมรับเงื่อนไข', { max: 300 }),
    vipSubmitLabel: boundedText(body.vipSubmitLabel ?? defaultSettings.vipSubmitLabel, 'ข้อความปุ่มสมัคร VIP', { max: 100 }),
    eserviceMemberLimit: boundedInteger(body.eserviceMemberLimit ?? defaultSettings.eserviceMemberLimit, 'โควตา E-Service สมาชิก', { max: 1000 }),
    eserviceVipLimit: boundedInteger(body.eserviceVipLimit ?? defaultSettings.eserviceVipLimit, 'โควตา E-Service VIP', { max: 1000 }),
  })
}

function settingsForViewer(settings: SiteSettings, isSuperAdmin: boolean) {
  if (isSuperAdmin || settings.vipRegistrationEnabled || settings.purchaseEnabled) return settings
  return {
    ...settings,
    vipPrice: 0,
    purchaseEnabled: false,
    vipQrUrl: '',
    vipBankName: '',
    vipAccountNumber: '',
    vipAccountName: '',
    vipPaymentTitle: '',
    vipPaymentSubtitle: '',
    vipSlipLabel: '',
    vipAgreementLabel: '',
    vipSubmitLabel: '',
  }
}

export const onRequestGet = async ({ env, request }: { env: Env; request: Request }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const currentUser = await getCurrentUser(env, request)
  const [row] = (await sql`
    select value
    from app_settings
    where key = 'site'
    limit 1
  `) as Array<{ value: SiteSettings }>

  const settings = normalizeSettings(row?.value)
  return Response.json({ ok: true, settings: settingsForViewer(settings, currentUser?.role === 'superadmin') })
}

export const onRequestPut = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await getCurrentUser(env, request)
  if (currentUser?.role !== 'superadmin') {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Partial<SiteSettings>
    const settings = readSettings(body)

    const sql = getSql(env)
    await sql`
      insert into app_settings (key, value, updated_at)
      values ('site', ${JSON.stringify(settings)}::jsonb, now())
      on conflict (key) do update set
        value = excluded.value,
        updated_at = now()
    `
    await writeAuditLog(env, currentUser, 'update_settings', 'app_settings', 'site', {
      maintenanceEnabled: settings.maintenanceEnabled,
      vipRegistrationEnabled: settings.vipRegistrationEnabled,
    })
    if (settings.maintenanceEnabled) {
      await writeNotification(env, {
        audience: 'superadmin',
        type: 'maintenance',
        title: 'Maintenance Mode เปิดอยู่',
        detail: 'ผู้ใช้ทั่วไปจะเห็นหน้าปิดปรับปรุง',
        tone: 'amber',
        targetType: 'app_settings',
        targetId: 'site',
        fingerprint: 'system:maintenance',
      })
    }

    return Response.json({ ok: true, settings })
  } catch (error) {
    if (error instanceof UrlValidationError || error instanceof InputValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    await writeErrorLog(env, 'settings.update', error)
    return Response.json({ ok: false, error: 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 })
  }
}
