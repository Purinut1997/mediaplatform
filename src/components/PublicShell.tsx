import { BookOpen, BrainCircuit, Menu, Moon, ShieldCheck, Sun, UserCircle2, X } from 'lucide-react'
import { BRAND_HERO_URL, LOGO_URL } from '../brand'
import { canAccessAdmin } from '../lib/media'
import type { CurrentUser, SiteSettings, Theme, View } from '../types'

export function Header({
  currentUser,
  theme,
  view,
  menuOpen,
  onLogout,
  setMenuOpen,
  setTheme,
  setView,
}: {
  currentUser: CurrentUser | null
  theme: Theme
  view: View
  menuOpen: boolean
  onLogout: () => void
  setMenuOpen: (value: boolean) => void
  setTheme: (theme: Theme) => void
  setView: (view: View) => void
}) {
  const nav = [
    { label: 'หน้าหลัก', value: 'home' as View },
    { label: 'คลังสื่อ', value: 'media' as View },
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

export function Hero({ setView, settings }: { setView: (view: View) => void; settings: SiteSettings }) {
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
        <BrandShowcase imageUrl={settings.heroImageUrl} />
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

function BrandShowcase({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative min-h-[380px] overflow-hidden border-t border-sky-100 bg-sky-950 text-white lg:border-l lg:border-t-0">
      <img alt="MIX The Architect brand" className="absolute inset-0 h-full w-full object-cover" src={imageUrl || BRAND_HERO_URL} />
      <div className="absolute inset-0 bg-gradient-to-r from-sky-950/10 via-sky-950/0 to-sky-950/32" />
      <div className="brand-code-rain absolute inset-0" />
      <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
        {[['168', 'สื่อพร้อมใช้'], ['4.9k', 'ดาวน์โหลด'], ['VIP', 'ปลดล็อกเพิ่ม']].map(([value, label]) => (
          <div className="rounded-2xl border border-white/25 bg-white/18 p-4 text-center shadow-xl backdrop-blur-md" key={label}>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs font-bold text-sky-50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
