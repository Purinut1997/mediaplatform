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
  vipQrUrl: string
  vipBankName: string
  vipAccountNumber: string
  vipAccountName: string
  vipPaymentTitle: string
  vipPaymentSubtitle: string
  vipSlipLabel: string
  vipAgreementLabel: string
  vipSubmitLabel: string
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
  vipQrUrl: '',
  vipBankName: 'พร้อมเพย์ (PromptPay)',
  vipAccountNumber: '',
  vipAccountName: 'MIKPURINUT',
  vipPaymentTitle: 'ข้อมูลการชำระเงิน VIP',
  vipPaymentSubtitle: 'กรุณาโอนเงินและแนบสลิปเพื่อยืนยันสิทธิ์',
  vipSlipLabel: 'แนบสลิปโอนเงิน',
  vipAgreementLabel: 'ข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน',
  vipSubmitLabel: 'ลงทะเบียนสมาชิก',
}

function normalizeSettings(value?: Partial<SiteSettings>) {
  const legacyPrice = Number(value?.vipPrice ?? defaultSettings.vipPrice)
  return {
    ...defaultSettings,
    ...(value ?? {}),
    vipRegistrationEnabled: Boolean(value?.vipRegistrationEnabled),
    maintenanceEnabled: Boolean(value?.maintenanceEnabled),
    vipPrice: Number.isInteger(legacyPrice) && legacyPrice >= 0 && legacyPrice <= 10_000_000 ? legacyPrice : 0,
    heroImageUrl: safeHttpUrl(value?.heroImageUrl, defaultSettings.heroImageUrl),
    vipQrUrl: safeHttpUrl(value?.vipQrUrl),
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
    vipQrUrl: optionalHttpUrl(body.vipQrUrl, 'ลิงก์ QR Code'),
    vipBankName: boundedText(body.vipBankName ?? defaultSettings.vipBankName, 'ชื่อช่องทางชำระเงิน', { max: 120 }),
    vipAccountNumber: boundedText(body.vipAccountNumber, 'เลขบัญชี', { max: 80 }),
    vipAccountName: boundedText(body.vipAccountName ?? defaultSettings.vipAccountName, 'ชื่อบัญชี', { max: 120 }),
    vipPaymentTitle: boundedText(body.vipPaymentTitle ?? defaultSettings.vipPaymentTitle, 'หัวข้อชำระเงิน', { max: 120 }),
    vipPaymentSubtitle: boundedText(body.vipPaymentSubtitle ?? defaultSettings.vipPaymentSubtitle, 'คำอธิบายชำระเงิน', { max: 300 }),
    vipSlipLabel: boundedText(body.vipSlipLabel ?? defaultSettings.vipSlipLabel, 'ข้อความแนบสลิป', { max: 100 }),
    vipAgreementLabel: boundedText(body.vipAgreementLabel ?? defaultSettings.vipAgreementLabel, 'ข้อความยอมรับเงื่อนไข', { max: 300 }),
    vipSubmitLabel: boundedText(body.vipSubmitLabel ?? defaultSettings.vipSubmitLabel, 'ข้อความปุ่มสมัคร VIP', { max: 100 }),
  })
}

function settingsForViewer(settings: SiteSettings, isSuperAdmin: boolean) {
  if (isSuperAdmin || settings.vipRegistrationEnabled) return settings
  return {
    ...settings,
    vipPrice: 0,
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
