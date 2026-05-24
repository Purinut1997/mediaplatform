import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Gauge,
  Heart,
  Layers3,
  Link2,
  ListFilter,
  Loader2,
  LockKeyhole,
  Menu,
  Moon,
  PlayCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Tag,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const LOGO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'

type Theme = 'light' | 'dark'
type View = 'home' | 'media' | 'detail' | 'admin'
type AccessLevel = 'สาธารณะ' | 'สมาชิก' | 'VIP' | 'ซื้อแยก'
type MediaStatus = 'เผยแพร่' | 'แบบร่าง' | 'ซ่อน'

type MediaItem = {
  id: number
  title: string
  category: string
  access: AccessLevel
  status: MediaStatus
  price: number
  downloads: number
  views: number
  rating: number
  cover: string
  source: 'Google Drive' | 'Google Sheet' | 'YouTube' | 'External Link'
  description: string
}

const mediaItems: MediaItem[] = [
  {
    id: 1,
    title: 'ชุดเอกสารอบรม AI สำหรับครู',
    category: 'เอกสารอบรม',
    access: 'สาธารณะ',
    status: 'เผยแพร่',
    price: 0,
    downloads: 428,
    views: 2460,
    rating: 4.9,
    source: 'Google Drive',
    cover:
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    description:
      'ไฟล์ PDF สำหรับใช้ประกอบการอบรม พร้อมตัวอย่างกิจกรรมและเอกสารแจกในห้องเรียน',
  },
  {
    id: 2,
    title: 'Google Sheet ระบบเช็กชื่อออนไลน์',
    category: 'AppScript',
    access: 'สมาชิก',
    status: 'เผยแพร่',
    price: 0,
    downloads: 189,
    views: 1120,
    rating: 4.8,
    source: 'Google Sheet',
    cover:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
    description:
      'เทมเพลต Google Sheet พร้อมแนวทางต่อยอด AppScript สำหรับงานโรงเรียน',
  },
  {
    id: 3,
    title: 'วิดีโอสอนติดตั้งระบบคลังสื่อ',
    category: 'วิดีโอสอน',
    access: 'VIP',
    status: 'เผยแพร่',
    price: 0,
    downloads: 76,
    views: 890,
    rating: 5,
    source: 'YouTube',
    cover:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    description:
      'วิดีโอแนะนำการติดตั้ง ใช้งาน และดูแลระบบสำหรับผู้ดูแลเว็บไซต์',
  },
  {
    id: 4,
    title: 'Prompt Pack สำหรับงานบริหารโรงเรียน',
    category: 'Prompt',
    access: 'ซื้อแยก',
    status: 'แบบร่าง',
    price: 499,
    downloads: 32,
    views: 510,
    rating: 4.7,
    source: 'Google Drive',
    cover:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
    description:
      'ชุดคำสั่งพร้อมตัวอย่างการใช้งานสำหรับจัดทำเอกสาร แผนงาน และรายงาน',
  },
]

const categories = ['ทั้งหมด', 'เอกสารอบรม', 'AppScript', 'วิดีโอสอน', 'Prompt']

const adminStats = [
  { label: 'สมาชิกทั้งหมด', value: '1,284', icon: Users },
  { label: 'สื่อเผยแพร่', value: '168', icon: Layers3 },
  { label: 'ดาวน์โหลดเดือนนี้', value: '4,920', icon: Download },
  { label: 'คำขอรอตรวจ', value: '12', icon: AlertCircle },
]

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return (window.localStorage.getItem('theme') as Theme | null) ?? 'light'
  })
  const [view, setView] = useState<View>('home')
  const [selected, setSelected] = useState<MediaItem>(mediaItems[0])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('ทั้งหมด')
  const [toast, setToast] = useState('ระบบเชื่อมต่อ Cloudflare + Neon สำเร็จ')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 780)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const filteredMedia = useMemo(
    () =>
      mediaItems.filter((item) => {
        const text = `${item.title} ${item.description}`.toLowerCase()
        const matchQuery = text.includes(query.toLowerCase())
        const matchCategory = category === 'ทั้งหมด' || item.category === category
        return matchQuery && matchCategory
      }),
    [category, query],
  )

  const openDetail = (item: MediaItem) => {
    setSelected(item)
    setView('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const notifySuccess = (message: string) => {
    setToast(message)
    setShowSuccess(true)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf5f1] text-slate-900 transition-colors duration-300 dark:bg-[#07110f] dark:text-slate-100">
      <TechBackground />
      {loading && <LoadingOverlay />}

      <div className="relative z-10">
        <Header
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          setTheme={setTheme}
          setView={setView}
          theme={theme}
          view={view}
        />

        <main>
          {view === 'home' && (
            <>
              <Hero setView={setView} />
              <MediaSection
                category={category}
                filteredMedia={filteredMedia}
                openDetail={openDetail}
                query={query}
                setCategory={setCategory}
                setQuery={setQuery}
              />
            </>
          )}
          {view === 'media' && (
            <MediaSection
              category={category}
              expanded
              filteredMedia={filteredMedia}
              openDetail={openDetail}
              query={query}
              setCategory={setCategory}
              setQuery={setQuery}
            />
          )}
          {view === 'detail' && (
            <MediaDetail
              item={selected}
              onBack={() => setView('media')}
              onError={() => setShowError(true)}
              onSuccess={() => notifySuccess('บันทึกรายการโปรดแล้ว')}
            />
          )}
          {view === 'admin' && (
            <AdminPanel
              onSuccess={() => notifySuccess('บันทึกการตั้งค่าตัวอย่างแล้ว')}
            />
          )}
        </main>

        <Footer />
      </div>

      <CreditBadge />
      {toast && <Toast message={toast} />}
      {showSuccess && (
        <Popup
          message="ระบบบันทึกข้อมูลตัวอย่างเรียบร้อย พร้อมต่อยอดกับฐานข้อมูลจริง"
          onClose={() => setShowSuccess(false)}
          title="ดำเนินการสำเร็จ"
          tone="success"
        />
      )}
      {showError && (
        <Popup
          message="สื่อนี้ต้องใช้สิทธิ์สมาชิกหรือ VIP ก่อนจึงจะเปิดลิงก์จริงได้"
          onClose={() => setShowError(false)}
          title="ยังไม่มีสิทธิ์ดาวน์โหลด"
          tone="error"
        />
      )}
    </div>
  )
}

function TechBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(20,184,166,.16),transparent_34%),linear-gradient(300deg,rgba(190,242,100,.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,.82),rgba(226,242,236,.76))] dark:bg-[linear-gradient(120deg,rgba(45,212,191,.14),transparent_36%),linear-gradient(300deg,rgba(190,242,100,.10),transparent_31%),linear-gradient(180deg,rgba(7,17,15,.98),rgba(10,25,22,.94))]" />
      <div className="circuit-grid absolute inset-0 opacity-70 dark:opacity-45" />
      <div className="scan-lane absolute left-[-12%] top-[18%] h-20 w-[124%] rotate-[-7deg]" />
      <div className="scan-lane scan-lane-slow absolute left-[-18%] top-[72%] h-16 w-[132%] rotate-[5deg]" />
      <div className="data-chip left-[6%] top-[18%]">MEDIA_SYNC</div>
      <div className="data-chip right-[9%] top-[28%]">NEON_OK</div>
      <div className="data-chip bottom-[18%] left-[18%]">VIP_GATE</div>
    </div>
  )
}

function Header({
  theme,
  view,
  menuOpen,
  setMenuOpen,
  setTheme,
  setView,
}: {
  theme: Theme
  view: View
  menuOpen: boolean
  setMenuOpen: (value: boolean) => void
  setTheme: (theme: Theme) => void
  setView: (view: View) => void
}) {
  const nav = [
    { label: 'หน้าหลัก', value: 'home' as View },
    { label: 'คลังสื่อ', value: 'media' as View },
    { label: 'Super Admin', value: 'admin' as View },
  ]

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/72 shadow-sm shadow-emerald-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-[#07110f]/78">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          className="flex min-h-12 items-center gap-3 text-left"
          onClick={() => setView('home')}
          type="button"
        >
          <img
            alt="MIKPURINUT logo"
            className="h-11 w-11 rounded-xl border border-white object-cover shadow-lg shadow-emerald-900/15"
            src={LOGO_URL}
          />
          <span>
            <span className="block text-base font-black tracking-wide text-slate-950 dark:text-white">
              MIKPURINUT Grid
            </span>
            <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Media Operations Center
            </span>
          </span>
        </button>

        <nav className="hidden items-center rounded-2xl border border-slate-200/80 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex">
          {nav.map((item) => (
            <button
              className={`min-h-10 rounded-xl px-4 text-sm font-black transition ${
                view === item.value
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                  : 'text-slate-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
              key={item.value}
              onClick={() => setView(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            aria-label="สลับธีม"
            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="hidden min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-lime-300 dark:text-slate-950 sm:inline-flex sm:items-center"
            onClick={() => setView('admin')}
            type="button"
          >
            เข้าหลังบ้าน
          </button>
          <button
            aria-label="เปิดเมนู"
            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 lg:hidden dark:border-white/10 dark:bg-slate-950/95">
          {nav.map((item) => (
            <button
              className="block min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-slate-700 hover:bg-emerald-50 dark:text-slate-200 dark:hover:bg-white/10"
              key={item.value}
              onClick={() => {
                setView(item.value)
                setMenuOpen(false)
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}

function Hero({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:pb-14 lg:pt-12">
      <div className="grid overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/72 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl lg:grid-cols-[1fr_420px] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="p-6 sm:p-9 lg:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
            <Sparkles size={17} />
            ศูนย์ควบคุมคลังสื่อสำหรับโรงเรียน
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl dark:text-white">
            คลังสื่อที่ดูแลได้เหมือนแผงควบคุม ไม่ใช่เว็บขายไฟล์ธรรมดา
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            จัดการการ์ดสื่อ ลิงก์ Drive, Sheet, YouTube, สิทธิ์สมาชิก และ
            VIP ผ่านหลังบ้าน โดยออกแบบให้มือถือใช้งานง่ายและขยายระบบต่อได้
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 font-black text-slate-950 shadow-xl shadow-emerald-500/25 transition hover:-translate-y-0.5"
              onClick={() => setView('media')}
              type="button"
            >
              <BookOpen size={20} />
              เปิดคลังสื่อ
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-6 font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-emerald-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
              onClick={() => setView('admin')}
              type="button"
            >
              <ShieldCheck size={20} />
              ดู Super Admin
            </button>
          </div>
        </div>

        <div className="relative min-h-[360px] border-t border-slate-900/10 bg-slate-950 p-5 text-white lg:border-l lg:border-t-0 dark:bg-black/50">
          <div className="control-map absolute inset-0" />
          <div className="relative grid h-full content-between gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-black text-lime-200">LIVE SYSTEM MAP</p>
              <div className="mt-5 grid gap-3">
                {['Cloudflare Pages', 'Neon Database', 'Drive / Sheet / YouTube'].map(
                  (label, index) => (
                    <div
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3"
                      key={label}
                    >
                      <span className="font-bold">{label}</span>
                      <span className="rounded-lg bg-lime-300 px-2 py-1 text-xs font-black text-slate-950">
                        NODE {index + 1}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                ['168', 'สื่อ'],
                ['4.9k', 'ดาวน์โหลด'],
                ['12', 'รอตรวจ'],
              ].map(([value, label]) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur"
                  key={label}
                >
                  <p className="text-2xl font-black text-lime-200">{value}</p>
                  <p className="mt-1 text-xs font-bold text-slate-300">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MediaSection({
  category,
  filteredMedia,
  query,
  setCategory,
  setQuery,
  openDetail,
  expanded,
}: {
  category: string
  filteredMedia: MediaItem[]
  query: string
  setCategory: (value: string) => void
  setQuery: (value: string) => void
  openDetail: (item: MediaItem) => void
  expanded?: boolean
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_520px] lg:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-xl bg-lime-100 px-3 py-1 text-sm font-black text-lime-900 dark:bg-lime-300/10 dark:text-lime-200">
            <Database size={16} />
            {expanded ? 'คลังสื่อทั้งหมด' : 'รายการพร้อมใช้งาน'}
          </p>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">
            เลือกสื่อจากแผงข้อมูลเดียว
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
          <label className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white/80 pl-12 pr-4 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อสื่อหรือคำอธิบาย"
              value={query}
            />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white">
            <ListFilter size={18} />
            ตัวกรอง
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => (
          <button
            className={`min-h-11 shrink-0 rounded-2xl px-5 text-sm font-black transition ${
              category === item
                ? 'bg-slate-950 text-lime-200 dark:bg-lime-300 dark:text-slate-950'
                : 'border border-slate-200 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200'
            }`}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {filteredMedia.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredMedia.map((item) => (
            <MediaCard item={item} key={item.id} openDetail={openDetail} />
          ))}
        </div>
      )}
    </section>
  )
}

function MediaCard({
  item,
  openDetail,
}: {
  item: MediaItem
  openDetail: (item: MediaItem) => void
}) {
  return (
    <article className="group grid overflow-hidden rounded-3xl border border-slate-900/10 bg-white/76 shadow-lg shadow-emerald-950/5 backdrop-blur transition duration-300 hover:-translate-y-1 sm:grid-cols-[210px_1fr] dark:border-white/10 dark:bg-white/[0.06]">
      <div className="relative min-h-52 overflow-hidden sm:min-h-full">
        <img
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={item.cover}
        />
        <span className="absolute left-3 top-3 rounded-xl bg-slate-950/86 px-3 py-1 text-xs font-black text-lime-200 shadow">
          {item.access}
        </span>
      </div>
      <div className="flex flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
            <Tag size={15} />
            {item.category}
          </span>
          <span className="rounded-xl bg-slate-100 px-3 py-1 text-slate-600 dark:bg-white/10 dark:text-slate-300">
            {item.source}
          </span>
        </div>
        <h3 className="line-clamp-2 text-xl font-black leading-snug text-slate-950 dark:text-white">
          {item.title}
        </h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {item.description}
        </p>
        <div className="mt-5 flex items-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Download size={16} />
            {item.downloads}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={16} />
            {item.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="fill-amber-400 text-amber-400" size={16} />
            {item.rating}
          </span>
        </div>
        <button
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 font-black text-lime-200 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 dark:bg-lime-300 dark:text-slate-950"
          onClick={() => openDetail(item)}
          type="button"
        >
          เปิดแฟ้มสื่อ
          <ChevronRight size={19} />
        </button>
      </div>
    </article>
  )
}

function MediaDetail({
  item,
  onBack,
  onError,
  onSuccess,
}: {
  item: MediaItem
  onBack: () => void
  onError: () => void
  onSuccess: () => void
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <button
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
        onClick={onBack}
        type="button"
      >
        กลับไปคลังสื่อ
      </button>

      <div className="grid gap-6 overflow-hidden rounded-[2rem] border border-slate-900/10 bg-white/78 p-4 shadow-2xl shadow-emerald-950/10 backdrop-blur lg:grid-cols-[.95fr_1.05fr] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
          <img
            alt={item.title}
            className="h-full min-h-80 w-full object-cover"
            src={item.cover}
          />
        </div>
        <div className="p-2 sm:p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-xl bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
              {item.category}
            </span>
            <span className="rounded-xl bg-lime-100 px-3 py-1 text-sm font-black text-lime-900 dark:bg-lime-300/10 dark:text-lime-200">
              {item.access}
            </span>
          </div>
          <h2 className="text-3xl font-black leading-tight text-slate-950 dark:text-white sm:text-4xl">
            {item.title}
          </h2>
          <p className="mt-4 leading-8 text-slate-600 dark:text-slate-300">
            {item.description}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoTile icon={Eye} label="เข้าชม" value={`${item.views} ครั้ง`} />
            <InfoTile icon={Download} label="ดาวน์โหลด" value={`${item.downloads} ครั้ง`} />
            <InfoTile icon={FileText} label="แหล่งไฟล์" value={item.source} />
            <InfoTile icon={LockKeyhole} label="ระดับสิทธิ์" value={item.access} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 font-black text-slate-950 shadow-lg shadow-emerald-500/20"
              onClick={item.access === 'สาธารณะ' ? onSuccess : onError}
              type="button"
            >
              <Download size={20} />
              ดาวน์โหลด / เปิดลิงก์
            </button>
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-lime-200 shadow-lg shadow-slate-900/10 dark:bg-lime-300 dark:text-slate-950"
              onClick={onSuccess}
              type="button"
            >
              <Heart size={20} />
              เก็บไว้ภายหลัง
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-900/10 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black">
            <FileText className="text-emerald-600" />
            รายละเอียดสื่อ
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li>รองรับการแปะลิงก์ Google Drive, Google Sheet, YouTube และลิงก์ภายนอก</li>
            <li>ทุกการ์ดต้องมีหน้าปกก่อนเผยแพร่ เพื่อให้คลังสื่อดูเป็นมืออาชีพ</li>
            <li>ระบบจะเช็กสิทธิ์ก่อนแสดงปุ่มดาวน์โหลดจริงในขั้นตอน backend</li>
          </ul>
        </section>
        <aside className="rounded-3xl border border-slate-900/10 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black">
            <PlayCircle className="text-lime-600" />
            Preview
          </h3>
          <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-white/10">
            <ExternalLink className="mb-3" />
            Google Drive / YouTube embed จะอยู่ตรงนี้
          </div>
        </aside>
      </div>
    </section>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <Icon className="mb-3 text-emerald-600 dark:text-emerald-300" size={24} />
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function AdminPanel({ onSuccess }: { onSuccess: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-1 text-sm font-black text-lime-200 dark:bg-lime-300 dark:text-slate-950">
            <Gauge size={16} />
            Super Admin Control Center
          </p>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">
            หลังบ้านแบบแผงควบคุม แก้ข้อมูลได้โดยไม่ต้องแตะโค้ด
          </h2>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 font-black text-slate-950 shadow-lg shadow-emerald-500/20"
          onClick={onSuccess}
          type="button"
        >
          <Plus size={20} />
          เพิ่มสื่อใหม่
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <article
            className="rounded-3xl border border-slate-900/10 bg-white/76 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]"
            key={stat.label}
          >
            <stat.icon className="mb-5 text-emerald-600 dark:text-emerald-300" size={28} />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[270px_1fr]">
        <aside className="rounded-3xl border border-slate-900/10 bg-slate-950 p-4 text-white shadow-xl shadow-emerald-950/10 dark:border-white/10">
          {[
            ['Dashboard', BarChart3],
            ['จัดการสื่อ', Layers3],
            ['สมาชิกและ VIP', Users],
            ['หมวดหมู่และแท็ก', Tag],
            ['ลิงก์ภายนอก', Link2],
            ['ตั้งค่าเว็บ', Settings],
          ].map(([label, Icon]) => {
            const MenuIcon = Icon as typeof BarChart3
            return (
              <button
                className="mb-2 flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-black text-slate-200 hover:bg-white/10"
                key={label as string}
                type="button"
              >
                <MenuIcon size={19} />
                {label as string}
              </button>
            )
          })}
        </aside>

        <section className="rounded-3xl border border-slate-900/10 bg-white/76 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h3 className="text-xl font-black">รายการสื่อล่าสุด</h3>
            <span className="rounded-xl bg-lime-100 px-3 py-1 text-sm font-bold text-lime-900 dark:bg-lime-300/10 dark:text-lime-200">
              ตารางจะเปลี่ยนเป็น card บนมือถือ
            </span>
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block dark:border-white/10">
            <table className="w-full table-fixed text-left">
              <thead className="bg-slate-950 text-sm text-lime-200">
                <tr>
                  <th className="w-[34%] px-4 py-3">สื่อ</th>
                  <th className="px-4 py-3">สิทธิ์</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">ดาวน์โหลด</th>
                  <th className="px-4 py-3">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                {mediaItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4">
                      <p className="truncate font-black text-slate-950 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-sm text-slate-500">{item.category}</p>
                    </td>
                    <td className="px-4 py-4">{item.access}</td>
                    <td className="px-4 py-4">{item.status}</td>
                    <td className="px-4 py-4">{item.downloads}</td>
                    <td className="px-4 py-4">
                      <button className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {mediaItems.map((item) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5"
                key={item.id}
              >
                <p className="font-black text-slate-950 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.category} · {item.access} · {item.status}
                </p>
                <button className="mt-3 min-h-11 rounded-xl bg-emerald-500 px-4 font-black text-slate-950">
                  แก้ไข
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white/76 p-8 text-center backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
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

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/92 text-white backdrop-blur">
      <div className="text-center">
        <img
          alt="MIKPURINUT"
          className="mx-auto mb-5 h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-2xl"
          src={LOGO_URL}
        />
        <Loader2 className="mx-auto mb-4 animate-spin text-lime-300" size={34} />
        <p className="text-xl font-black">กำลังเตรียมศูนย์ควบคุมคลังสื่อ</p>
        <p className="mt-2 text-sm text-slate-300">Created by MIKPURINUT</p>
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl dark:border-emerald-400/20 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="shrink-0 text-emerald-500" />
        <p className="font-bold text-slate-700 dark:text-slate-100">{message}</p>
      </div>
    </div>
  )
}

function Popup({
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
          className={`mx-auto mb-4 ${tone === 'success' ? 'text-emerald-500' : 'text-red-500'}`}
          size={46}
        />
        <h3 className="text-2xl font-black text-slate-950 dark:text-white">{title}</h3>
        <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{message}</p>
        <button
          className="mt-6 min-h-12 w-full rounded-2xl bg-slate-950 px-5 font-black text-lime-200 dark:bg-lime-300 dark:text-slate-950"
          onClick={onClose}
          type="button"
        >
          ตกลง
        </button>
      </div>
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-10 bg-slate-950 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <img
              alt="MIKPURINUT"
              className="h-12 w-12 rounded-xl object-cover"
              src={LOGO_URL}
            />
            <p className="font-black">MIKPURINUT Grid</p>
          </div>
          <p className="max-w-md leading-7 text-slate-300">
            ระบบคลังสื่อสมาชิกสำหรับโรงเรียนและผู้จัดอบรม รองรับลิงก์ Drive,
            Sheet, YouTube และ Super Admin
          </p>
        </div>
        <div>
          <p className="mb-3 font-black">ระบบ</p>
          <p className="text-slate-300">Public · Member · VIP · Admin · Super Admin</p>
        </div>
        <div>
          <p className="mb-3 font-black">เครดิต</p>
          <p className="text-slate-300">Created by MIKPURINUT</p>
        </div>
      </div>
    </footer>
  )
}

function CreditBadge() {
  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-30 rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300">
      Created by MIKPURINUT
    </div>
  )
}

export default App
