import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Gauge,
  GraduationCap,
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
  Star,
  Sun,
  Tag,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const LOGO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'
const BRAND_HERO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/c70597729a1ba58a7b7b672d2bcace2f673a5a49/bdbeb65d-b4f5-4f65-a388-e95d950eac84%20%281%29.png'

type Theme = 'light' | 'dark'
type View = 'home' | 'media' | 'detail' | 'admin' | 'login'
type AccessLevel = 'สาธารณะ' | 'สมาชิก' | 'VIP' | 'ซื้อแยก'
type MediaStatus = 'เผยแพร่' | 'แบบร่าง' | 'ซ่อน'

type MediaItem = {
  id: number
  slug?: string
  title: string
  topic: string
  access: AccessLevel
  status: MediaStatus
  price: number
  downloads: number
  views: number
  rating: number
  cover: string
  source: 'Google Drive' | 'Google Sheet' | 'YouTube' | 'External Link'
  description: string
  resourceUrl?: string
  previewUrl?: string
  createdAt?: string
  updatedAt?: string
}

type CurrentUser = {
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'member'
  access: 'VIP' | 'สมาชิก'
}

type MediaFormState = {
  title: string
  topic: string
  access: AccessLevel
  status: MediaStatus
  price: string
  source: MediaItem['source']
  cover: string
  resourceUrl: string
  previewUrl: string
  description: string
}

const mediaItems: MediaItem[] = [
  {
    id: 1,
    title: 'ชุดเอกสารอบรม AI สำหรับครู',
    topic: 'AI',
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
    topic: 'AppScript',
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
    topic: 'อบรม',
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
    topic: 'งานเอกสาร',
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

const topics = ['ทั้งหมด', 'AI', 'AppScript', 'โรงเรียน', 'งานเอกสาร', 'อบรม']
const accessOptions: AccessLevel[] = ['สาธารณะ', 'สมาชิก', 'VIP', 'ซื้อแยก']
const statusOptions: MediaStatus[] = ['เผยแพร่', 'แบบร่าง', 'ซ่อน']
const sourceOptions: MediaItem['source'][] = [
  'Google Drive',
  'Google Sheet',
  'YouTube',
  'External Link',
]

function createEmptyMediaForm(topic = 'โรงเรียน'): MediaFormState {
  return {
    title: '',
    topic,
    access: 'สาธารณะ',
    status: 'เผยแพร่',
    price: '0',
    source: 'Google Drive',
    cover: '',
    resourceUrl: '',
    previewUrl: '',
    description: '',
  }
}
const portalTiles = [
  { label: 'คลังสื่อ', detail: 'ไฟล์ เอกสาร วิดีโอ', icon: Archive, view: 'media' as View },
  { label: 'AI Lab', detail: 'Prompt และคู่มือ AI', icon: BrainCircuit, view: 'media' as View },
  { label: 'ห้องอบรม', detail: 'บทเรียนและวิดีโอ', icon: GraduationCap, view: 'media' as View },
  { label: 'VIP Preview', detail: 'ดูสิ่งที่จะปลดล็อก', icon: ShieldCheck, view: 'media' as View },
]

const adminStats = [
  { label: 'สมาชิกทั้งหมด', value: '1,284', icon: Users },
  { label: 'สื่อเผยแพร่', value: '168', icon: Layers3 },
  { label: 'ดาวน์โหลดเดือนนี้', value: '4,920', icon: Download },
  { label: 'คำขอรอตรวจ', value: '12', icon: AlertCircle },
]

function canViewMedia(user: CurrentUser | null, item: MediaItem) {
  if (user?.role === 'superadmin') return true
  if (item.access === 'สาธารณะ') return true
  if (user?.access === 'VIP') return item.access !== 'ซื้อแยก'
  if (user?.access === 'สมาชิก') return item.access === 'สมาชิก'
  return false
}

function getPreviewUrl(item: MediaItem) {
  const link = item.previewUrl || item.resourceUrl || ''
  if (!link) return ''

  if (item.source === 'YouTube') {
    const id =
      link.match(/[?&]v=([^&]+)/)?.[1] ||
      link.match(/youtu\.be\/([^?&]+)/)?.[1] ||
      link.match(/youtube\.com\/embed\/([^?&]+)/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : link
  }

  if (item.source === 'Google Drive') {
    const id = link.match(/\/d\/([^/]+)/)?.[1] || link.match(/[?&]id=([^&]+)/)?.[1]
    return id ? `https://drive.google.com/file/d/${id}/preview` : link
  }

  if (item.source === 'Google Sheet') {
    return link.replace(/\/edit.*$/, '/preview')
  }

  return link
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return (window.localStorage.getItem('theme') as Theme | null) ?? 'light'
  })
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = window.localStorage.getItem('currentUser')
    return saved ? (JSON.parse(saved) as CurrentUser) : null
  })
  const [mediaRecords, setMediaRecords] = useState<MediaItem[]>(mediaItems)
  const [topicOptions, setTopicOptions] = useState(topics)
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'fallback'>(
    'loading',
  )
  const [refreshToken, setRefreshToken] = useState(0)
  const [view, setView] = useState<View>('home')
  const [selected, setSelected] = useState<MediaItem>(mediaItems[0])
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('ทั้งหมด')
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
    if (currentUser) {
      window.localStorage.setItem('currentUser', JSON.stringify(currentUser))
    } else {
      window.localStorage.removeItem('currentUser')
    }
  }, [currentUser])

  useEffect(() => {
    let active = true

    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (!response.ok) return
        const result = (await response.json()) as { user?: CurrentUser | null }
        if (!active) return
        setCurrentUser(result.user ?? null)
      } catch {
        if (!active) return
        setCurrentUser(null)
      }
    }

    void loadCurrentUser()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 760)
    return () => window.clearTimeout(timer)
  }, [refreshToken])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let active = true

    async function loadData() {
      try {
        const [mediaResponse, categoriesResponse] = await Promise.all([
          fetch('/api/media'),
          fetch('/api/categories'),
        ])

        if (!mediaResponse.ok || !categoriesResponse.ok) {
          throw new Error('API response was not ok')
        }

        const mediaJson = (await mediaResponse.json()) as {
          media?: MediaItem[]
        }
        const categoriesJson = (await categoriesResponse.json()) as {
          categories?: Array<{ name: string }>
        }

        if (!active) return

        const nextMedia = mediaJson.media?.length ? mediaJson.media : mediaItems
        setMediaRecords(nextMedia)
        setSelected(nextMedia[0] ?? mediaItems[0])
        setTopicOptions([
          'ทั้งหมด',
          ...(categoriesJson.categories?.map((item) => item.name) ?? topics.slice(1)),
        ])
        setDataStatus('ready')
      } catch {
        if (!active) return
        setMediaRecords(mediaItems)
        setTopicOptions(topics)
        setDataStatus('fallback')
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [])

  const filteredMedia = useMemo(
    () =>
      mediaRecords.filter((item) => {
        const text = `${item.title} ${item.description}`.toLowerCase()
        const matchQuery = text.includes(query.toLowerCase())
        const matchTopic = topic === 'ทั้งหมด' || item.topic === topic
        return matchQuery && matchTopic && canViewMedia(currentUser, item)
      }),
    [currentUser, mediaRecords, query, topic],
  )

  const lockedPreviewMedia = useMemo(
    () => mediaRecords.filter((item) => !canViewMedia(currentUser, item)),
    [currentUser, mediaRecords],
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

  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user)
    setToast(`เข้าสู่ระบบแล้ว: ${user.name}`)
    setView(user.role === 'superadmin' ? 'admin' : 'media')
  }

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setCurrentUser(null)
    setToast('ออกจากระบบแล้ว')
    setView('home')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2fbff] text-slate-900 transition-colors duration-300 dark:bg-[#06111d] dark:text-slate-100">
      <TechBackground />
      {loading && <LoadingOverlay />}

      <div className="relative z-10">
        <Header
          currentUser={currentUser}
          menuOpen={menuOpen}
          onLogout={logout}
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
              <PortalTiles setView={setView} />
              <MediaSection
                currentUser={currentUser}
                dataStatus={dataStatus}
                filteredMedia={filteredMedia}
                lockedPreviewMedia={lockedPreviewMedia}
                openDetail={openDetail}
                query={query}
                setQuery={setQuery}
                setTopic={setTopic}
                topic={topic}
                topics={topicOptions}
              />
            </>
          )}
          {view === 'media' && (
            <MediaSection
              currentUser={currentUser}
              dataStatus={dataStatus}
              expanded
              filteredMedia={filteredMedia}
              lockedPreviewMedia={lockedPreviewMedia}
              openDetail={openDetail}
              query={query}
              setQuery={setQuery}
              setTopic={setTopic}
              topic={topic}
              topics={topicOptions}
            />
          )}
          {view === 'detail' && (
            <MediaDetail
              item={selected}
              canDownload={canViewMedia(currentUser, selected)}
              onBack={() => setView('media')}
              onError={() => setShowError(true)}
              onSuccess={() => notifySuccess('บันทึกรายการโปรดแล้ว')}
            />
          )}
          {view === 'login' && (
            <LoginPanel onLogin={handleLogin} />
          )}
          {view === 'admin' && currentUser?.role === 'superadmin' && (
            <AdminPanel
              mediaItems={mediaRecords}
              onCreated={() => {
                setRefreshToken((value) => value + 1)
                notifySuccess('เพิ่มสื่อใหม่ลง Neon แล้ว')
              }}
              topics={topicOptions.filter((item) => item !== 'ทั้งหมด')}
            />
          )}
          {view === 'admin' && currentUser?.role !== 'superadmin' && (
            <LoginPanel onLogin={handleLogin} />
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(125,211,252,.42),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(56,189,248,.30),transparent_32%),radial-gradient(circle_at_52%_86%,rgba(191,219,254,.42),transparent_36%),linear-gradient(180deg,rgba(255,255,255,.92),rgba(226,246,255,.78))] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,.18),transparent_32%),linear-gradient(180deg,rgba(6,17,29,.98),rgba(8,22,38,.96))]" />
      <div className="academy-grid absolute inset-0" />
      <div className="ai-orbit left-[8%] top-[17%]" />
      <div className="ai-orbit ai-orbit-alt right-[10%] top-[12%]" />
      <CodeRain />
      <div className="particle-field absolute inset-0">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            style={
              {
                '--x': `${(index * 37) % 100}%`,
                '--y': `${(index * 61) % 100}%`,
                '--delay': `${index * 0.32}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

function CodeRain() {
  const columns = ['AI', '01', '</>', 'DATA', 'MIX', '{}', 'NEXUS', 'MEDIA', 'VIP', 'SYNC']

  return (
    <div className="code-rain absolute inset-0">
      {columns.map((text, index) => (
        <span
          key={`${text}-${index}`}
          style={
            {
              '--left': `${(index * 11 + 3) % 100}%`,
              '--delay': `${index * 0.55}s`,
              '--speed': `${7 + (index % 4)}s`,
            } as React.CSSProperties
          }
        >
          {text}
        </span>
      ))}
    </div>
  )
}

function Header({
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
  const visibleNav =
    currentUser?.role === 'superadmin'
      ? [...nav, { label: 'หลังบ้าน', value: 'admin' as View }]
      : nav

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/72 shadow-sm shadow-slate-950/5 backdrop-blur-2xl dark:border-white/10 dark:bg-[#070b14]/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <button
          className="flex min-h-12 items-center gap-3 text-left"
          onClick={() => setView('home')}
          type="button"
        >
          <img
            alt="MIKPURINUT logo"
            className="h-11 w-11 rounded-2xl border border-white object-cover shadow-lg shadow-cyan-900/15"
            src={LOGO_URL}
          />
          <span>
            <span className="block text-base font-black tracking-wide text-slate-950 dark:text-white">
              MIKPURINUT Nexus
            </span>
            <span className="block text-xs font-semibold text-cyan-700 dark:text-cyan-300">
              AI School Media Portal
            </span>
          </span>
        </button>

        <nav className="hidden items-center rounded-2xl border border-white/70 bg-white/70 p-1 shadow-sm dark:border-white/10 dark:bg-white/5 lg:flex">
          {visibleNav.map((item) => (
            <button
              className={`min-h-10 rounded-xl px-4 text-sm font-black transition ${
                view === item.value
                  ? 'bg-slate-950 text-cyan-200 shadow-lg shadow-cyan-500/10 dark:bg-cyan-300 dark:text-slate-950'
                  : 'text-slate-600 hover:bg-cyan-50 dark:text-slate-300 dark:hover:bg-white/10'
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
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/70 bg-white/80 text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            type="button"
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          {currentUser ? (
            <button
              className="hidden min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-cyan-200 shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950 sm:inline-flex sm:items-center"
              onClick={() =>
                currentUser.role === 'superadmin' ? setView('admin') : onLogout()
              }
              type="button"
            >
              {currentUser.role === 'superadmin' ? 'หลังบ้าน' : 'ออกจากระบบ'}
            </button>
          ) : (
            <button
              className="hidden min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-cyan-200 shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950 sm:inline-flex sm:items-center"
              onClick={() => setView('login')}
              type="button"
            >
              เข้าสู่ระบบ
            </button>
          )}
          <button
            aria-label="เปิดเมนู"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/70 bg-white/80 text-slate-700 lg:hidden dark:border-white/10 dark:bg-white/10 dark:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white/95 px-4 py-3 lg:hidden dark:border-white/10 dark:bg-slate-950/95">
          {visibleNav.map((item) => (
            <button
              className="block min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10"
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
          <button
            className="block min-h-12 w-full rounded-xl px-4 text-left text-sm font-bold text-slate-700 hover:bg-cyan-50 dark:text-slate-200 dark:hover:bg-white/10"
            onClick={() => {
              if (currentUser) {
                onLogout()
              } else {
                setView('login')
              }
              setMenuOpen(false)
            }}
            type="button"
          >
            {currentUser ? 'ออกจากระบบ' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      )}
    </header>
  )
}

function Hero({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:pt-12">
      <div className="grid overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-2xl shadow-sky-900/10 backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="p-6 sm:p-9 lg:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-900 dark:bg-cyan-400/10 dark:text-cyan-200">
            <BrainCircuit size={18} />
            AI / Cyber / School Operations
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl dark:text-white">
            ศูนย์กลางสื่อการเรียนรู้ที่สดใส ล้ำสมัย และใช้งานง่าย
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            ออกแบบเป็น portal โรงเรียนยุคใหม่ มีคลังสื่อแบบ dashboard, แยกสิทธิ์
            Public / Member / VIP และเชื่อมสื่อจาก Drive, Sheet, YouTube ได้ในที่เดียว
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-cyan-200 shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950"
              onClick={() => setView('media')}
              type="button"
            >
              <BookOpen size={20} />
              เปิดคลังสื่อ
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-6 font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-cyan-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
              onClick={() => setView('media')}
              type="button"
            >
              <ShieldCheck size={20} />
              ดูสิทธิ์ VIP
            </button>
          </div>
        </div>

        <BrandShowcase />
      </div>
    </section>
  )
}

function BrandShowcase() {
  return (
    <div className="relative min-h-[380px] overflow-hidden border-t border-sky-100 bg-sky-950 text-white lg:border-l lg:border-t-0">
      <img
        alt="MIX The Architect brand"
        className="absolute inset-0 h-full w-full object-cover"
        src={BRAND_HERO_URL}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-sky-950/10 via-sky-950/0 to-sky-950/32" />
      <div className="brand-code-rain absolute inset-0" />
      <div className="absolute bottom-5 left-5 right-5 grid gap-3 sm:grid-cols-3">
        {[
          ['168', 'สื่อพร้อมใช้'],
          ['4.9k', 'ดาวน์โหลด'],
          ['VIP', 'ปลดล็อกเพิ่ม'],
        ].map(([value, label]) => (
          <div
            className="rounded-2xl border border-white/25 bg-white/18 p-4 text-center shadow-xl backdrop-blur-md"
            key={label}
          >
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs font-bold text-sky-50">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortalTiles({ setView }: { setView: (view: View) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {portalTiles.map((tile) => (
          <button
            className="group min-h-28 rounded-3xl border border-white/70 bg-white/74 p-5 text-left shadow-lg shadow-slate-950/5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.06]"
            key={tile.label}
            onClick={() => setView(tile.view)}
            type="button"
          >
            <tile.icon className="mb-4 text-cyan-600 transition group-hover:scale-110 dark:text-cyan-300" />
            <p className="text-lg font-black text-slate-950 dark:text-white">{tile.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {tile.detail}
            </p>
          </button>
        ))}
      </div>
    </section>
  )
}

function MediaSection({
  currentUser,
  dataStatus,
  filteredMedia,
  lockedPreviewMedia,
  query,
  setQuery,
  setTopic,
  topic,
  topics,
  openDetail,
  expanded,
}: {
  currentUser: CurrentUser | null
  dataStatus: 'loading' | 'ready' | 'fallback'
  filteredMedia: MediaItem[]
  lockedPreviewMedia: MediaItem[]
  query: string
  setQuery: (value: string) => void
  setTopic: (value: string) => void
  topic: string
  topics: string[]
  openDetail: (item: MediaItem) => void
  expanded?: boolean
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_520px] lg:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">
            <Database size={16} />
            {expanded ? 'คลังสื่อทั้งหมด' : 'สื่อพร้อมใช้งาน'}
          </p>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">
            หมวดหมู่หลายชั้น สำหรับค้นหาไวบนมือถือและ PC
          </h2>
          <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
            {dataStatus === 'ready'
              ? 'ข้อมูลนี้ดึงจาก Neon ผ่าน Cloudflare Functions'
              : dataStatus === 'fallback'
                ? 'กำลังใช้ข้อมูลสำรองในหน้าเว็บ เพราะ API ยังไม่พร้อม'
                : 'กำลังโหลดข้อมูลจาก Neon...'}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_auto]">
          <label className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              className="min-h-12 w-full rounded-2xl border border-white/70 bg-white/78 pl-12 pr-4 text-base outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/10"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อสื่อหรือคำอธิบาย"
              value={query}
            />
          </label>
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/78 px-5 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white">
            <ListFilter size={18} />
            ตัวกรอง
          </button>
        </div>
      </div>

      <FilterRow
        items={topics}
        label="หัวข้อ"
        selected={topic}
        setSelected={setTopic}
      />
      <AccessNotice currentUser={currentUser} />

      {filteredMedia.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {filteredMedia.map((item) => (
            <MediaCard item={item} key={item.id} openDetail={openDetail} />
          ))}
        </div>
      )}
      {lockedPreviewMedia.length > 0 && (
        <VipPreview lockedMedia={lockedPreviewMedia} />
      )}
    </section>
  )
}

function AccessNotice({ currentUser }: { currentUser: CurrentUser | null }) {
  const text =
    currentUser?.role === 'superadmin'
      ? 'คุณเข้าสู่ระบบเป็น Super Admin จึงเห็นสื่อทุกระดับ'
      : currentUser?.access === 'VIP'
        ? 'บัญชี VIP เห็นสื่อสมาชิกและ VIP ที่ดาวน์โหลดได้'
        : currentUser?.access === 'สมาชิก'
          ? 'บัญชีสมาชิกเห็นสื่อสาธารณะและสื่อสำหรับสมาชิก'
          : 'ผู้เยี่ยมชมเห็นเฉพาะสื่อสาธารณะ ส่วน VIP แสดงเป็นตัวอย่างด้านล่าง'

  return (
    <div className="mt-3 rounded-3xl border border-cyan-200/70 bg-cyan-50/80 p-4 text-sm font-bold text-cyan-950 shadow-sm backdrop-blur dark:border-cyan-300/10 dark:bg-cyan-300/10 dark:text-cyan-100">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 shrink-0" size={18} />
        <p>{text}</p>
      </div>
    </div>
  )
}

function VipPreview({ lockedMedia }: { lockedMedia: MediaItem[] }) {
  return (
    <section className="mt-8 rounded-[2rem] border border-violet-200/70 bg-white/70 p-4 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-violet-300/10 dark:bg-white/[0.06] sm:p-6">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">
            <ShieldCheck size={16} />
            VIP Preview
          </p>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">
            ถ้าเป็น VIP จะปลดล็อกอะไรได้บ้าง
          </h3>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          แสดงเป็นตัวอย่างเท่านั้น ยังไม่เปิดลิงก์ดาวน์โหลด
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {lockedMedia.map((item) => (
          <article
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-black/20 sm:grid-cols-[96px_1fr]"
            key={item.id}
          >
            <img
              alt={item.title}
              className="h-28 w-full rounded-xl object-cover sm:h-full"
              src={item.cover}
            />
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="rounded-xl bg-slate-950 px-2 py-1 text-xs font-black text-cyan-200">
                  {item.access}
                </span>
                <span className="rounded-xl bg-violet-50 px-2 py-1 text-xs font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">
                  ล็อกอยู่
                </span>
              </div>
              <p className="font-black text-slate-950 dark:text-white">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function FilterRow<T extends string>({
  items,
  label,
  selected,
  setSelected,
}: {
  items: T[]
  label: string
  selected: T
  setSelected: (value: T) => void
}) {
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
      <span className="grid min-h-11 shrink-0 place-items-center rounded-2xl bg-slate-950 px-4 text-sm font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950">
        {label}
      </span>
      {items.map((item) => (
        <button
          className={`min-h-11 shrink-0 rounded-2xl px-5 text-sm font-black transition ${
            selected === item
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'border border-white/70 bg-white/70 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200'
          }`}
          key={item}
          onClick={() => setSelected(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
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
    <article className="group grid overflow-hidden rounded-3xl border border-white/70 bg-white/76 shadow-lg shadow-slate-950/5 backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:grid-cols-[210px_1fr] dark:border-white/10 dark:bg-white/[0.06]">
      <div className="relative min-h-52 overflow-hidden sm:min-h-full">
        <img
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          src={item.cover}
        />
        <span className="absolute left-3 top-3 rounded-xl bg-slate-950/86 px-3 py-1 text-xs font-black text-cyan-200 shadow">
          {item.access}
        </span>
      </div>
      <div className="flex flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold">
          <span className="inline-flex items-center gap-1 rounded-xl bg-cyan-50 px-3 py-1 text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-200">
            <Tag size={15} />
            {item.topic}
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
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 font-black text-cyan-200 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950"
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
  canDownload,
  item,
  onBack,
  onError,
  onSuccess,
}: {
  canDownload: boolean
  item: MediaItem
  onBack: () => void
  onError: () => void
  onSuccess: () => void
}) {
  const previewUrl = getPreviewUrl(item)
  const openResource = () => {
    if (!canDownload) {
      onError()
      return
    }

    if (item.resourceUrl) {
      window.open(item.resourceUrl, '_blank', 'noopener,noreferrer')
    }

    onSuccess()
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <button
        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/70 bg-white/78 px-4 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white"
        onClick={onBack}
        type="button"
      >
        กลับไปคลังสื่อ
      </button>

      <div className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:grid-cols-[.95fr_1.05fr] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
          <img
            alt={item.title}
            className="h-full min-h-80 w-full object-cover"
            src={item.cover}
          />
        </div>
        <div className="p-2 sm:p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-xl bg-cyan-50 px-3 py-1 text-sm font-black text-cyan-800 dark:bg-cyan-400/10 dark:text-cyan-200">
              {item.topic}
            </span>
            <span className="rounded-xl bg-violet-50 px-3 py-1 text-sm font-black text-violet-800 dark:bg-violet-400/10 dark:text-violet-200">
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
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 font-black text-slate-950 shadow-lg shadow-cyan-500/20"
              onClick={openResource}
              type="button"
            >
              <Download size={20} />
              ดาวน์โหลด / เปิดลิงก์
            </button>
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 shadow-lg shadow-slate-900/10 dark:bg-cyan-300 dark:text-slate-950"
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
        <section className="rounded-3xl border border-white/70 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black">
            <FileText className="text-cyan-600" />
            รายละเอียดสื่อ
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-300">
            <li>รองรับการแปะลิงก์ Google Drive, Google Sheet, YouTube และลิงก์ภายนอก</li>
            <li>ทุกการ์ดต้องมีหน้าปกก่อนเผยแพร่ เพื่อให้คลังสื่อดูเป็นมืออาชีพ</li>
            <li>ระบบจะเช็กสิทธิ์ก่อนแสดงปุ่มดาวน์โหลดจริงในขั้นตอน backend</li>
          </ul>
        </section>
        <aside className="rounded-3xl border border-white/70 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <h3 className="mb-4 inline-flex items-center gap-2 text-xl font-black">
            <PlayCircle className="text-violet-600" />
            Preview
          </h3>
          {previewUrl ? (
            <iframe
              className="h-72 w-full rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={previewUrl}
              title={`preview-${item.title}`}
            />
          ) : (
            <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-white/10">
              <ExternalLink className="mb-3" />
              เพิ่มลิงก์ preview จากหลังบ้านเพื่อแสดง Drive / Sheet / YouTube ตรงนี้
            </div>
          )}
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
    <div className="rounded-2xl border border-white/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
      <Icon className="mb-3 text-cyan-600 dark:text-cyan-300" size={24} />
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}

function LoginPanel({ onLogin }: { onLogin: (user: CurrentUser) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const result = (await response.json()) as {
        user?: CurrentUser
        error?: string
      }

      if (!response.ok || !result.user) {
        throw new Error(result.error ?? 'เข้าสู่ระบบไม่สำเร็จ')
      }

      onLogin(result.user)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="bg-slate-950 p-8 text-white sm:p-10">
          <img
            alt="MIKPURINUT"
            className="mb-6 h-16 w-16 rounded-2xl object-cover shadow-2xl"
            src={LOGO_URL}
          />
          <p className="mb-3 inline-flex rounded-2xl bg-cyan-300 px-3 py-1 text-sm font-black text-slate-950">
            Secure Access
          </p>
          <h2 className="text-3xl font-black">เข้าสู่ระบบผู้ดูแล</h2>
          <p className="mt-4 leading-8 text-slate-300">
            หลังบ้าน Super Admin จะไม่แสดงต่อผู้ใช้ทั่วไป ต้องเข้าสู่ระบบด้วยบัญชีที่ได้รับสิทธิ์ก่อน
          </p>
          <p className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm leading-7 text-slate-300">
            ระบบนี้เชื่อม session กับ Neon แล้ว ผู้ดูแลต้องมีบัญชีในฐานข้อมูล
            และ Cloudflare ต้องตั้งค่า bootstrap admin ก่อนใช้งานครั้งแรก
          </p>
        </div>

        <form className="p-6 sm:p-10" onSubmit={submitLogin}>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white">
            Login
          </h3>
          <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            ใช้บัญชี superadmin เพื่อเข้าสู่แผงควบคุม
          </p>

          <label className="mt-6 block">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
              ชื่อผู้ใช้
            </span>
            <input
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/10"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              type="email"
              value={email}
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
              รหัสผ่าน
            </span>
            <input
              className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-white/10 dark:bg-white/10"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type="password"
              value={password}
            />
          </label>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 shadow-lg shadow-slate-900/10 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-300 dark:text-slate-950"
            disabled={submitting}
            type="submit"
          >
            {submitting && <Loader2 className="animate-spin" size={20} />}
            {submitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ Super Admin'}
          </button>
        </form>
      </div>
    </section>
  )
}

function AdminPanel({
  mediaItems,
  onCreated,
  topics,
}: {
  mediaItems: MediaItem[]
  onCreated: () => void
  topics: string[]
}) {
  const [form, setForm] = useState<MediaFormState>(() =>
    createEmptyMediaForm(topics[0]),
  )
  const [adminToken, setAdminToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateForm = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submitMedia = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          price: Number(form.price || 0),
        }),
      })

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(result?.error ?? 'บันทึกข้อมูลไม่สำเร็จ')
      }

      setForm(createEmptyMediaForm(topics[0]))
      onCreated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#080d18] p-4 text-white shadow-2xl shadow-slate-950/30 sm:p-6">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-1 text-sm font-black text-slate-950">
              <Gauge size={16} />
              Super Admin Control Center
            </p>
            <h2 className="text-3xl font-black">
              หลังบ้านดาร์กแบบ programmer dashboard
            </h2>
          </div>
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-black text-slate-950 shadow-lg shadow-cyan-500/20"
            href="#admin-create-media"
          >
            <Plus size={20} />
            เพิ่มสื่อใหม่
          </a>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {adminStats.map((stat) => (
            <article
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-sm"
              key={stat.label}
            >
              <stat.icon className="mb-5 text-cyan-300" size={28} />
              <p className="text-sm font-bold text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-black text-white">{stat.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[270px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-black/24 p-4">
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
                  className="mb-2 flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left font-black text-slate-200 hover:bg-cyan-300/10"
                  key={label as string}
                  type="button"
                >
                  <MenuIcon size={19} />
                  {label as string}
                </button>
              )
            })}
          </aside>

          <div className="grid gap-6">
          <form
            className="rounded-3xl border border-cyan-300/15 bg-white/[0.06] p-4"
            id="admin-create-media"
            onSubmit={submitMedia}
          >
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-black">เพิ่มการ์ดสื่อใหม่</h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  แปะลิงก์ Drive, Sheet, YouTube หรือเว็บภายนอก โดยไม่ต้องแก้โค้ด
                </p>
              </div>
              <span className="rounded-xl bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">
                บันทึกลง Neon
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-sm font-black text-slate-200">
                  รหัสบันทึกหลังบ้าน
                </span>
                <input
                  className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  onChange={(event) => setAdminToken(event.target.value)}
                  placeholder="เว้นว่างได้ถ้าเข้าสู่ระบบ superadmin แล้ว"
                  type="password"
                  value={adminToken}
                />
              </label>
              <AdminField
                label="ชื่อสื่อ"
                name="title"
                onChange={updateForm}
                placeholder="เช่น คู่มืออบรม AI สำหรับครู"
                value={form.title}
              />
              <AdminSelect
                label="หมวดหมู่"
                name="topic"
                onChange={updateForm}
                options={topics.length ? topics : ['โรงเรียน']}
                value={form.topic}
              />
              <AdminSelect
                label="สิทธิ์การเข้าถึง"
                name="access"
                onChange={updateForm}
                options={accessOptions}
                value={form.access}
              />
              <AdminSelect
                label="สถานะ"
                name="status"
                onChange={updateForm}
                options={statusOptions}
                value={form.status}
              />
              <AdminSelect
                label="ชนิดลิงก์"
                name="source"
                onChange={updateForm}
                options={sourceOptions}
                value={form.source}
              />
              <AdminField
                label="ราคา"
                name="price"
                onChange={updateForm}
                placeholder="0"
                type="number"
                value={form.price}
              />
              <AdminField
                label="URL หน้าปก"
                name="cover"
                onChange={updateForm}
                placeholder="https://..."
                value={form.cover}
              />
              <AdminField
                label="ลิงก์ไฟล์หรือวิดีโอ"
                name="resourceUrl"
                onChange={updateForm}
                placeholder="Google Drive / Sheet / YouTube URL"
                value={form.resourceUrl}
              />
              <AdminField
                label="Preview URL (ถ้ามี)"
                name="previewUrl"
                onChange={updateForm}
                placeholder="ปล่อยว่างได้ ระบบจะเดา preview ให้"
                value={form.previewUrl}
              />
              <label className="md:col-span-2">
                <span className="text-sm font-black text-slate-200">รายละเอียด</span>
                <textarea
                  className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  onChange={(event) => updateForm('description', event.target.value)}
                  placeholder="สรุปว่าไฟล์นี้ใช้ทำอะไร เหมาะกับใคร และต้องมีสิทธิ์ระดับไหน"
                  value={form.description}
                />
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {error}
              </div>
            )}

            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-black text-slate-950 shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={saving}
              type="submit"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              {saving ? 'กำลังบันทึก...' : 'บันทึกสื่อใหม่'}
            </button>
          </form>

          <section className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h3 className="text-xl font-black">รายการสื่อล่าสุด</h3>
              <span className="rounded-xl bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">
                ตารางจะเปลี่ยนเป็น card บนมือถือ
              </span>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              <table className="w-full table-fixed text-left">
                <thead className="bg-black/32 text-sm text-cyan-200">
                  <tr>
                    <th className="w-[34%] px-4 py-3">สื่อ</th>
                    <th className="px-4 py-3">สิทธิ์</th>
                    <th className="px-4 py-3">สถานะ</th>
                    <th className="px-4 py-3">ดาวน์โหลด</th>
                    <th className="px-4 py-3">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {mediaItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <p className="truncate font-black text-white">{item.title}</p>
                        <p className="text-sm text-slate-400">{item.topic}</p>
                      </td>
                      <td className="px-4 py-4">{item.access}</td>
                      <td className="px-4 py-4">{item.status}</td>
                      <td className="px-4 py-4">{item.downloads}</td>
                      <td className="px-4 py-4">
                        <button className="rounded-xl bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-200">
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
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={item.id}>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.topic} · {item.access} · {item.status}
                  </p>
                  <button className="mt-3 min-h-11 rounded-xl bg-cyan-300 px-4 font-black text-slate-950">
                    แก้ไข
                  </button>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
      </div>
    </section>
  )
}

function AdminField({
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  label: string
  name: keyof MediaFormState
  onChange: (name: keyof MediaFormState, value: string) => void
  placeholder: string
  type?: string
  value: string
}) {
  return (
    <label>
      <span className="text-sm font-black text-slate-200">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/24 px-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        min={type === 'number' ? 0 : undefined}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}

function AdminSelect<T extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string
  name: keyof MediaFormState
  onChange: (name: keyof MediaFormState, value: string) => void
  options: readonly T[]
  value: string
}) {
  return (
    <label>
      <span className="text-sm font-black text-slate-200">{label}</span>
      <select
        className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/24 px-4 text-base text-white outline-none transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
        onChange={(event) => onChange(name, event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option className="bg-slate-950" key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function EmptyState() {
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

function LoadingOverlay() {
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
        <p className="mt-2 text-sm text-slate-300">Created by MIKPURINUT</p>
      </div>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-24px)] max-w-md -translate-x-1/2 rounded-2xl border border-cyan-200 bg-white p-4 shadow-2xl dark:border-cyan-400/20 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="shrink-0 text-cyan-500" />
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
            <p className="font-black">MIKPURINUT Nexus</p>
          </div>
          <p className="max-w-md leading-7 text-slate-300">
            ระบบคลังสื่อสมาชิกสำหรับโรงเรียนและผู้จัดอบรม รองรับลิงก์ Drive,
            Sheet, YouTube และหลังบ้านผู้ดูแล
          </p>
        </div>
        <div>
          <p className="mb-3 font-black">ระบบ</p>
          <p className="text-slate-300">Public · Member · VIP · Admin</p>
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
