import {
  BadgeCheck,
  BookOpen,
  BrainCircuit,
  Cloud,
  Database,
  FolderHeart,
  LockKeyhole,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCircle2,
  UserPlus,
  X,
} from 'lucide-react'
import { BRAND_HERO_URL, LOGO_URL } from '../brand'
import { canAccessAdmin } from '../lib/media'
import type { CurrentUser, SiteSettings, Theme, View } from '../types'

export function Header({
  currentUser,
  theme,
  view,
  menuOpen,
  onLogout,
  onOpenSearch,
  setMenuOpen,
  setTheme,
  setView,
}: {
  currentUser: CurrentUser | null
  theme: Theme
  view: View
  menuOpen: boolean
  onLogout: () => void
  onOpenSearch: () => void
  setMenuOpen: (value: boolean) => void
  setTheme: (theme: Theme) => void
  setView: (view: View) => void
}) {
  const nav = [
    { label: 'หน้าหลัก', value: 'home' as View },
    { label: 'คลังสื่อ', value: 'media' as View },
    { label: 'E-Service', value: 'services' as View },
  ]
  const memberNav = currentUser
    ? [...nav, { label: 'คลังของฉัน', value: 'account' as View }]
    : nav
  const visibleNav = canAccessAdmin(currentUser)
    ? [...memberNav, { label: 'หลังบ้าน', value: 'admin' as View }]
    : memberNav

  return (
    <header className="nexus-header sticky top-0 z-40 border-b backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button className="flex min-h-12 items-center gap-3 text-left" onClick={() => setView('home')} type="button">
          <img alt="MIKPURINUT logo" className="h-11 w-11 rounded-2xl border border-white object-cover shadow-lg shadow-cyan-900/15" src={LOGO_URL} />
          <span>
            <span className="block text-base font-black tracking-wide text-slate-950 dark:text-white">MIKPURINUT Nexus</span>
            <span className="block text-xs font-semibold text-cyan-700 dark:text-cyan-300">AI School Media Portal</span>
          </span>
        </button>

        <nav className="hidden items-center rounded-2xl border border-white/70 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex">
          {visibleNav.map((item) => (
            <button
              className={`min-h-10 rounded-xl px-4 text-sm font-black transition ${view === item.value ? 'nexus-nav-active text-white' : 'text-slate-600 hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-white/10'}`}
              key={item.value}
              onClick={() => setView(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button aria-label="ค้นหาสื่ออัจฉริยะ" className="hidden min-h-11 items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 md:inline-flex dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={onOpenSearch} type="button">
            <Search size={17} /> ค้นหา <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400 dark:bg-white/10">⌘K</span>
          </button>
          <button aria-label="สลับธีม" className="grid h-11 w-11 place-items-center rounded-xl border border-white/70 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} type="button">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          {currentUser ? (
            <button className="hidden min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-cyan-200 shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950 sm:inline-flex sm:items-center" onClick={() => setView('account')} type="button">
              <UserCircle2 className="mr-2" size={18} />
              {currentUser.name}
            </button>
          ) : (
            <>
              <button className="hidden min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white sm:inline-flex sm:items-center" onClick={() => setView('login')} type="button">เข้าสู่ระบบ</button>
              <button className="hidden min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-cyan-200 shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950 sm:inline-flex sm:items-center" onClick={() => setView('register')} type="button">สมัครสมาชิก</button>
            </>
          )}
          <button aria-label="เปิดเมนู" className="grid h-11 w-11 place-items-center rounded-xl border border-white/70 bg-white/80 text-slate-700 lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={() => setMenuOpen(!menuOpen)} type="button">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 lg:hidden dark:border-white/10 dark:bg-slate-950/95">
          <button className="mb-2 flex min-h-12 w-full items-center gap-2 rounded-xl bg-cyan-50 px-4 text-left text-sm font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200" onClick={() => { onOpenSearch(); setMenuOpen(false) }} type="button"><Search size={17} />ค้นหาสื่ออัจฉริยะ</button>
          {visibleNav.map((item) => (
            <button className="block min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10" key={item.value} onClick={() => { setView(item.value); setMenuOpen(false) }} type="button">
              {item.label}
            </button>
          ))}
          <button className="block min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10" onClick={() => { if (currentUser) onLogout(); else setView('login'); setMenuOpen(false) }} type="button">
            {currentUser ? 'ออกจากระบบ' : 'เข้าสู่ระบบ'}
          </button>
          {!currentUser && (
            <button className="mt-2 block min-h-12 w-full rounded-xl bg-slate-950 px-4 text-left text-sm font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={() => { setView('register'); setMenuOpen(false) }} type="button">สมัครสมาชิก</button>
          )}
        </div>
      )}
    </header>
  )
}

export function Hero({
  mediaCount,
  totalDownloads,
  setView,
  settings,
}: {
  mediaCount: number
  totalDownloads: number
  setView: (view: View) => void
  settings: SiteSettings
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:pt-12">
      <div className="nexus-hero grid overflow-hidden rounded-[2rem] border backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <div className="p-6 sm:p-9 lg:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-900 dark:bg-cyan-400/10 dark:text-cyan-200"><BrainCircuit size={18} />{settings.heroEyebrow}</div>
          {settings.announcementText && <div className="mb-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">{settings.announcementText}</div>}
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl dark:text-white">{settings.heroTitle}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">{settings.heroDescription}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="nexus-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 font-black text-white transition hover:-translate-y-0.5" onClick={() => setView('media')} type="button"><BookOpen size={20} />{settings.heroPrimaryLabel}</button>
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-6 font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-cyan-400 dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={() => setView('media')} type="button"><ShieldCheck size={20} />{settings.heroSecondaryLabel}</button>
          </div>
        </div>
        <BrandShowcase imageUrl={settings.heroImageUrl} mediaCount={mediaCount} totalDownloads={totalDownloads} />
      </div>
    </section>
  )
}

export function HomeJourney({
  currentUser,
  setView,
}: {
  currentUser: CurrentUser | null
  setView: (view: View) => void
}) {
  const journey = [
    {
      detail: 'ค้นหาจากชื่อ หมวดหมู่ แท็ก หรือประเภทไฟล์ เพื่อเจอสื่อที่ต้องการได้เร็วขึ้น',
      icon: Search,
      kicker: 'STEP 01',
      title: 'ค้นพบสื่อที่ใช่',
    },
    {
      detail: currentUser
        ? 'บัญชีของคุณพร้อมบันทึกรายการโปรด ประวัติดาวน์โหลด และติดตามสิทธิ์แล้ว'
        : 'สร้างบัญชีครั้งเดียว เพื่อเก็บรายการโปรด ดูประวัติ และเข้าถึงสื่อสำหรับสมาชิก',
      icon: currentUser ? BadgeCheck : UserPlus,
      kicker: 'STEP 02',
      title: currentUser ? 'บัญชีพร้อมใช้งาน' : 'สมัครสมาชิกฟรี',
    },
    {
      detail: 'เปิดไฟล์ วิดีโอ และบทเรียนจากหลายแหล่ง พร้อมระบบสิทธิ์ที่ตรวจสอบจากเซิร์ฟเวอร์',
      icon: FolderHeart,
      kicker: 'STEP 03',
      title: 'เรียนรู้และกลับมาใช้ต่อ',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="nexus-glass overflow-hidden rounded-[2rem] border backdrop-blur-2xl">
        <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[0.75fr_1.25fr] lg:p-12">
          <div className="flex flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                <Sparkles size={17} /> เริ่มต้นได้ในไม่กี่นาที
              </p>
              <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl dark:text-white">
                จากการค้นหา<br />สู่คลังความรู้ของคุณ
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-slate-600 dark:text-slate-300">
                ไม่ว่าคุณจะเป็นครู ผู้เข้าอบรม หรือผู้ดูแลระบบ ทุกอย่างถูกจัดไว้ให้เริ่มง่ายและกลับมาใช้งานต่อได้เสมอ
              </p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <button className="nexus-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 font-black text-white" onClick={() => setView('media')} type="button">
                <Search size={18} /> สำรวจคลังสื่อ
              </button>
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-5 font-black text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={() => setView(currentUser ? 'account' : 'register')} type="button">
                {currentUser ? <UserCircle2 size={18} /> : <UserPlus size={18} />}
                {currentUser ? 'ไปที่คลังของฉัน' : 'สร้างบัญชีฟรี'}
              </button>
            </div>
          </div>

          <div className="grid gap-3">
            {journey.map((item) => (
              <div className="group grid gap-4 rounded-3xl border border-slate-200/80 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300 sm:grid-cols-[auto_1fr] dark:border-white/10 dark:bg-white/5" key={item.kicker}>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 transition group-hover:scale-105 dark:bg-cyan-300/10 dark:text-cyan-200">
                  <item.icon size={22} />
                </div>
                <div>
                  <p className="text-xs font-black tracking-[0.18em] text-cyan-700 dark:text-cyan-300">{item.kicker}</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid border-t border-slate-200/80 bg-slate-950 text-white sm:grid-cols-3 dark:border-white/10">
          {[
            { detail: 'สิทธิ์ตรวจสอบจาก API และ Session', icon: LockKeyhole, label: 'Server-side Security' },
            { detail: 'ข้อมูลระบบจัดเก็บบน Neon PostgreSQL', icon: Database, label: 'Reliable Data' },
            { detail: 'ให้บริการผ่าน Cloudflare Pages', icon: Cloud, label: 'Fast Delivery' },
          ].map((item) => (
            <div className="flex items-center gap-3 border-white/10 p-5 sm:border-r sm:last:border-r-0" key={item.label}>
              <item.icon className="shrink-0 text-cyan-300" size={22} />
              <div>
                <p className="text-sm font-black">{item.label}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function MaintenanceScreen({ setView, settings }: { setView: (view: View) => void; settings: SiteSettings }) {
  return (
    <section className="mx-auto grid min-h-[64vh] max-w-4xl place-items-center px-4 py-16 text-center sm:px-6">
      <div className="nexus-glass rounded-[2rem] border p-8 backdrop-blur-2xl">
        <img alt="MIKPURINUT logo" className="mx-auto h-20 w-20 rounded-3xl border border-cyan-200/50 object-cover shadow-xl shadow-cyan-500/10" src={LOGO_URL} />
        <p className="mt-6 text-sm font-black text-cyan-700 dark:text-cyan-200">MIKPURINUT Maintenance Mode</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl dark:text-white">{settings.maintenanceTitle}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-600 dark:text-slate-300">{settings.maintenanceMessage}</p>
        <button className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" onClick={() => setView('login')} type="button">เข้าสู่ระบบผู้ดูแล</button>
      </div>
    </section>
  )
}

function formatMetric(value: number) {
  return new Intl.NumberFormat('th-TH', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function BrandShowcase({ imageUrl, mediaCount, totalDownloads }: { imageUrl: string; mediaCount: number; totalDownloads: number }) {
  return (
    <div className="relative min-h-[380px] overflow-hidden border-t border-sky-100 bg-sky-950 text-white lg:border-l lg:border-t-0">
      <img alt="MIX The Architect brand" className="absolute inset-0 h-full w-full object-cover" src={imageUrl || BRAND_HERO_URL} />
      <div className="absolute inset-0 bg-gradient-to-r from-sky-950/10 via-sky-950/0 to-sky-950/32" />
      <div className="brand-code-rain absolute inset-0" />
      <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
        {[[formatMetric(mediaCount), 'สื่อในระบบ'], [formatMetric(totalDownloads), 'ดาวน์โหลด'], ['VIP', 'ปลดล็อกเพิ่ม']].map(([value, label]) => (
          <div className="rounded-2xl border border-white/25 bg-white/18 p-4 text-center shadow-xl backdrop-blur-md" key={label}>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs font-bold text-sky-50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
