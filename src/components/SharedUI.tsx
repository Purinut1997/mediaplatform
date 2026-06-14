import { AlertCircle, CheckCircle2, Loader2, Search } from 'lucide-react'
import { CREDIT_TEXT, LOGO_URL } from '../brand'
import type { SiteSettings } from '../types'

export function EmptyState() {
  return (
    <div className="mt-6 grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/76 p-8 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
      <div>
        <Search className="mx-auto mb-4 text-slate-400" size={42} />
        <h3 className="text-xl font-black text-slate-950 dark:text-white">
          ไม่พบสื่อที่ตรงกับเงื่อนไข
        </h3>
        <p className="mt-2 text-slate-500 dark:text-slate-400">
          ลองเปลี่ยนคำค้นหรือเลือกหมวดหมู่ทั้งหมด
        </p>
      </div>
    </div>
  )
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/92 text-white backdrop-blur">
      <div className="text-center">
        <img
          alt="MIKPURINUT"
          className="mx-auto mb-5 h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-2xl"
          src={LOGO_URL}
        />
        <Loader2 className="mx-auto mb-4 animate-spin text-cyan-300" size={34} />
        <p className="text-xl font-black">กำลังเตรียม AI School Media Portal</p>
        <p className="mt-2 text-sm text-slate-300">{CREDIT_TEXT}</p>
      </div>
    </div>
  )
}

export function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-2xl border border-cyan-200 bg-white p-4 shadow-2xl dark:border-cyan-400/20 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="shrink-0 text-cyan-500" />
        <p className="font-bold text-slate-700 dark:text-slate-100">{message}</p>
      </div>
    </div>
  )
}

export function Popup({
  title,
  message,
  tone,
  onClose,
}: {
  title: string
  message: string
  tone: 'success' | 'error'
  onClose: () => void
}) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
        <Icon
          className={`mx-auto mb-4 ${tone === 'success' ? 'text-cyan-500' : 'text-red-500'}`}
          size={46}
        />
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{message}</p>
        <button
          className="mt-6 min-h-12 w-full rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950"
          onClick={onClose}
          type="button"
        >
          ตกลง
        </button>
      </div>
    </div>
  )
}

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="nexus-footer mt-10 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img alt="MIKPURINUT" className="h-12 w-12 rounded-xl object-cover" src={LOGO_URL} />
            <p className="font-black">{settings.footerBrandName}</p>
          </div>
          <p className="max-w-md leading-7 text-slate-300">
            {settings.footerDescription}
          </p>
        </div>
        <div>
          <p className="mb-3 font-black">{settings.footerSystemTitle}</p>
          <p className="text-slate-300">{settings.footerSystemText}</p>
        </div>
        <div>
          <p className="mb-3 font-black">เครดิต</p>
          <p className="text-slate-300">{CREDIT_TEXT}</p>
        </div>
      </div>
    </footer>
  )
}

export function CreditBadge() {
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-30 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300">
      {CREDIT_TEXT}
    </div>
  )
}
