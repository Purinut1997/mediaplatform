import { getCurrentUser } from '../_lib/auth'
import { writeAuditLog, writeErrorLog } from '../_lib/admin'
import { ensureSchema, getSql, type Env } from '../_lib/db'
import { writeNotification } from '../_lib/notifications'
import { optionalHttpUrl, safeHttpUrl, UrlValidationError } from '../_lib/url'

type SiteSettings = {
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  heroImageUrl: string
  heroPrimaryLabel: string
  heroSecondaryLabel: string
  announcementText: string
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
  return {
    ...defaultSettings,
    ...(value ?? {}),
    vipRegistrationEnabled: Boolean(value?.vipRegistrationEnabled),
    maintenanceEnabled: Boolean(value?.maintenanceEnabled),
    vipPrice: Number(value?.vipPrice ?? defaultSettings.vipPrice),
    heroImageUrl: safeHttpUrl(value?.heroImageUrl, defaultSettings.heroImageUrl),
    vipQrUrl: safeHttpUrl(value?.vipQrUrl),
  }
}

export const onRequestGet = async ({ env }: { env: Env }) => {
  await ensureSchema(env)
  const sql = getSql(env)
  const [row] = (await sql`
    select value
    from app_settings
    where key = 'site'
    limit 1
  `) as Array<{ value: SiteSettings }>

  return Response.json({ ok: true, settings: normalizeSettings(row?.value) })
}

export const onRequestPut = async ({ env, request }: { env: Env; request: Request }) => {
  const currentUser = await getCurrentUser(env, request)
  if (currentUser?.role !== 'superadmin') {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Partial<SiteSettings>
    const settings: SiteSettings = normalizeSettings({
      heroEyebrow: String(body.heroEyebrow ?? defaultSettings.heroEyebrow),
      heroTitle: String(body.heroTitle ?? defaultSettings.heroTitle),
      heroDescription: String(body.heroDescription ?? defaultSettings.heroDescription),
      heroImageUrl: optionalHttpUrl(body.heroImageUrl, 'ลิงก์ภาพหน้าแรก') || defaultSettings.heroImageUrl,
      heroPrimaryLabel: String(body.heroPrimaryLabel ?? defaultSettings.heroPrimaryLabel),
      heroSecondaryLabel: String(body.heroSecondaryLabel ?? defaultSettings.heroSecondaryLabel),
      announcementText: String(body.announcementText ?? ''),
      maintenanceEnabled: Boolean(body.maintenanceEnabled),
      maintenanceTitle: String(body.maintenanceTitle ?? defaultSettings.maintenanceTitle),
      maintenanceMessage: String(body.maintenanceMessage ?? defaultSettings.maintenanceMessage),
      vipRegistrationEnabled: Boolean(body.vipRegistrationEnabled),
      vipPrice: Number(body.vipPrice ?? defaultSettings.vipPrice),
      vipQrUrl: optionalHttpUrl(body.vipQrUrl, 'ลิงก์ QR Code'),
      vipBankName: String(body.vipBankName ?? defaultSettings.vipBankName),
      vipAccountNumber: String(body.vipAccountNumber ?? ''),
      vipAccountName: String(body.vipAccountName ?? defaultSettings.vipAccountName),
      vipPaymentTitle: String(body.vipPaymentTitle ?? defaultSettings.vipPaymentTitle),
      vipPaymentSubtitle: String(body.vipPaymentSubtitle ?? defaultSettings.vipPaymentSubtitle),
      vipSlipLabel: String(body.vipSlipLabel ?? defaultSettings.vipSlipLabel),
      vipAgreementLabel: String(body.vipAgreementLabel ?? defaultSettings.vipAgreementLabel),
      vipSubmitLabel: String(body.vipSubmitLabel ?? defaultSettings.vipSubmitLabel),
    })

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
    if (error instanceof UrlValidationError) {
      return Response.json({ ok: false, error: error.message }, { status: 400 })
    }
    await writeErrorLog(env, 'settings.update', error)
    return Response.json({ ok: false, error: 'บันทึกการตั้งค่าไม่สำเร็จ' }, { status: 500 })
  }
}
