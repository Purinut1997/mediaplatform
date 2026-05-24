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
      'ไฟล์ PDF สำหรับใช้ประกอบการอบรม พร้อมตัวอย่างกิจกรรมในห้องเรียน',
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
  { label: 'สมาชิกทั้งหมด', value: '1,284', icon: Users, tone: 'blue' },
  { label: 'สื่อเผยแพร่', value: '168', icon: Layers3, tone: 'emerald' },
  { label: 'ดาวน์โหลดเดือนนี้', value: '4,920', icon: Download, tone: 'cyan' },
  { label: 'คำขอรอตรวจ', value: '12', icon: AlertCircle, tone: 'amber' },
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
  const [toast, setToast] = useState('เชื่อมต่อ Cloudflare + Neon สำเร็จ')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 800)
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
        const matchQuery =
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase())
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

  const handleDemoAction = (message: string) => {
    setToast(message)
    setShowSuccess(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      {loading && <LoadingOverlay />}
      <Header
        theme={theme}
        view={view}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        setTheme={setTheme}
        setView={setView}
      />

      <main>
        {view === 'home' && (
          <>
            <Hero setView={setView} />
            <MediaSection
              category={category}
              filteredMedia={filteredMedia}
              query={query}
              setCategory={setCategory}
              setQuery={setQuery}
              openDetail={openDetail}
            />
          </>
        )}
        {view === 'media' && (
          <MediaSection
            category={category}
            filteredMedia={filteredMedia}
            query={query}
            setCategory={setCategory}
            setQuery={setQuery}
            openDetail={openDetail}
            expanded
          />
        )}
        {view === 'detail' && (
          <MediaDetail
            item={selected}
            onBack={() => setView('media')}
            onError={() => setShowError(true)}
            onSuccess={() => handleDemoAction('บันทึกรายการโปรดแล้ว')}
          />
        )}
        {view === 'admin' && (
          <AdminPanel
            onSuccess={() => handleDemoAction('บันทึกการตั้งค่าตัวอย่างแล้ว')}
          />
        )}
      </main>

      <Footer />
      <CreditBadge />
      {toast && <Toast message={toast} />}
      {showSuccess && (
        <Popup
          title="ดำเนินการสำเร็จ"
          message="ระบบบันทึกข้อมูลตัวอย่างเรียบร้อย พร้อมต่อยอดกับฐานข้อมูลจริง"
          tone="success"
          onClose={() => setShowSuccess(false)}
        />
      )}
      {showError && (
        <Popup
          title="ยังไม่มีสิทธิ์ดาวน์โหลด"
          message="สื่อนี้ต้องใช้สิทธิ์สมาชิกหรือ VIP ก่อนจึงจะเปิดลิงก์จริงได้"
          tone="error"
          onClose={() => setShowError(false)}
        />
      )}
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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/78">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          className="flex min-h-12 items-center gap-3 text-left"
          onClick={() => setView('home')}
          type="button"
        >
          <img
            alt="MIKPURINUT logo"
            className="h-11 w-11 rounded-full border border-white object-cover shadow-lg"
            src={LOGO_URL}
          />
          <span>
            <span className="block text-base font-black text-slate-950 dark:text-white">
              MIKPURINUT Media
            </span>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
              ระบบคลังสื่อสมาชิก
            </span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <button
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                view === item.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
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
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <button
            className="hidden min-h-11 rounded-full bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950 sm:inline-flex sm:items-center"
            onClick={() => setView('admin')}
            type="button"
          >
            เข้าหลังบ้าน
          </button>
          <button
            aria-label="เปิดเมนู"
            className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-slate-950">
          {nav.map((item) => (
            <button
              className="block min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
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
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(90deg,rgba(59,130,246,.25)_1px,transparent_1px),linear-gradient(rgba(20,184,166,.18)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-2 text-sm font-bold text-cyan-100">
            <Sparkles size={17} />
            ระบบคลังสื่อสำหรับโรงเรียนและสมาชิก VIP
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            จัดการสื่อ ลิงก์ Drive, Sheet, YouTube และสิทธิ์สมาชิกในที่เดียว
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            ต้นแบบระบบที่ออกแบบให้ขยายต่อได้จริง มีหน้า public, หน้าสมาชิก,
            และศูนย์ควบคุม Super Admin โดยคงเครดิต MIKPURINUT ตามเงื่อนไข
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 font-black text-white shadow-xl shadow-blue-500/30 transition hover:-translate-y-0.5"
              onClick={() => setView('media')}
              type="button"
            >
              <BookOpen size={20} />
              เปิดคลังสื่อ
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
              onClick={() => setView('admin')}
              type="button"
            >
              <ShieldCheck size={20} />
              ดู Super Admin
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
          <div className="rounded-xl bg-slate-950/90 p-4">
            <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="ml-2">deploy pipeline</span>
            </div>
            <div className="space-y-3 font-mono text-sm text-slate-300">
              <p>
                <span className="text-cyan-300">Cloudflare</span> deploy --
                production
              </p>
              <p>
                <span className="text-emerald-300">Neon</span> database check
                ok
              </p>
              <p>
                access.role = <span className="text-amber-300">VIP</span> |
                Admin | Public
              </p>
              <p>
                media.links = Drive + Sheet + YouTube + External
              </p>
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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
            <Database size={16} />
            {expanded ? 'คลังสื่อทั้งหมด' : 'สื่อแนะนำ'}
          </p>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">
            ค้นหาและจัดการสื่อได้จากหน้าเว็บ
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,360px)_auto]">
          <label className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อสื่อหรือคำอธิบาย"
              value={query}
            />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white">
            <ListFilter size={18} />
            ตัวกรอง
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((item) => (
          <button
            className={`min-h-11 shrink-0 rounded-full px-5 text-sm font-black transition ${
              category === item
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200'
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
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
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70 transition duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900 dark:shadow-black/20">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={item.cover}
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-slate-900 shadow">
          {item.access}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white shadow">
          {item.source}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
          <Tag size={16} />
          {item.category}
        </div>
        <h3 className="line-clamp-2 min-h-14 text-lg font-black text-slate-950 dark:text-white">
          {item.title}
        </h3>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <Download size={16} />
            {item.downloads}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="fill-amber-400 text-amber-400" size={16} />
            {item.rating}
          </span>
        </div>
        <button
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5"
          onClick={() => openDetail(item)}
          type="button"
        >
          รายละเอียด
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
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
        onClick={onBack}
        type="button"
      >
        กลับไปคลังสื่อ
      </button>

      <div className="grid gap-6 rounded-3xl border border-blue-200 bg-white p-4 shadow-xl shadow-blue-100/70 lg:grid-cols-[1fr_.9fr] dark:border-blue-500/30 dark:bg-slate-900 dark:shadow-black/20">
        <div className="overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
          <img alt={item.title} className="h-full min-h-80 w-full object-cover" src={item.cover} />
        </div>
        <div className="p-2 sm:p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
              {item.category}
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
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
            <InfoTile
              icon={LockKeyhole}
              label="ระดับสิทธิ์"
              value={item.access}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-black text-white shadow-lg shadow-emerald-500/20"
              onClick={item.access === 'สาธารณะ' ? onSuccess : onError}
              type="button"
            >
              <Download size={20} />
              ดาวน์โหลด / เปิดลิงก์
            </button>
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-black text-white shadow-lg shadow-violet-500/20"
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
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black">
            <FileText className="text-blue-600" />
            รายละเอียดสื่อ
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li>รองรับการแปะลิงก์ Google Drive, Google Sheet, YouTube และลิงก์ภายนอก</li>
            <li>ทุกการ์ดต้องมีหน้าปกก่อนเผยแพร่ เพื่อให้คลังสื่อดูเป็นมืออาชีพ</li>
            <li>ระบบจะเช็กสิทธิ์ก่อนแสดงปุ่มดาวน์โหลดจริงในขั้นตอน backend</li>
          </ul>
        </section>
        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black">
            <PlayCircle className="text-violet-600" />
            Preview
          </h3>
          <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-white/10">
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
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <Icon className="mb-3 text-blue-600 dark:text-blue-300" size={24} />
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
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-sm font-black text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
            <Gauge size={16} />
            Super Admin Control Center
          </p>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">
            ดูแลเว็บทั้งหมดโดยไม่ต้องแก้โค้ด
          </h2>
        </div>
        <button
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-black text-white shadow-lg shadow-blue-500/20"
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
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900"
            key={stat.label}
          >
            <stat.icon className="mb-5 text-blue-600 dark:text-blue-300" size={28} />
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
            <p className="mt-1 text-3xl font-black text-slate-950 dark:text-white">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
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
                className="mb-2 flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left font-black text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                key={label as string}
                type="button"
              >
                <MenuIcon size={19} />
                {label as string}
              </button>
            )
          })}
        </aside>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <h3 className="text-xl font-black">รายการสื่อล่าสุด</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-500 dark:bg-white/10 dark:text-slate-300">
              ตารางจะเปลี่ยนเป็น card บนมือถือ
            </span>
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block dark:border-white/10">
            <table className="w-full table-fixed text-left">
              <thead className="bg-slate-50 text-sm text-slate-500 dark:bg-white/5 dark:text-slate-300">
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
                      <button className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
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
                className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                key={item.id}
              >
                <p className="font-black text-slate-950 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {item.category} · {item.access} · {item.status}
                </p>
                <button className="mt-3 min-h-11 rounded-lg bg-blue-600 px-4 font-black text-white">
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
    <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/10 dark:bg-slate-900">
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
          className="mx-auto mb-5 h-20 w-20 rounded-full border border-white/20 object-cover shadow-2xl"
          src={LOGO_URL}
        />
        <Loader2 className="mx-auto mb-4 animate-spin text-cyan-300" size={34} />
        <p className="text-xl font-black">กำลังเตรียมระบบคลังสื่อ</p>
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
          className="mt-6 min-h-12 w-full rounded-xl bg-slate-950 px-5 font-black text-white dark:bg-white dark:text-slate-950"
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
            <img alt="MIKPURINUT" className="h-12 w-12 rounded-full object-cover" src={LOGO_URL} />
            <p className="font-black">MIKPURINUT Media Platform</p>
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
    <div className="pointer-events-none fixed bottom-3 right-3 z-30 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-500 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-300">
      Created by MIKPURINUT
    </div>
  )
}

export default App
