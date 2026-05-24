import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Crown,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  GraduationCap,
  Heart,
  Layers3,
  Link2,
  ListFilter,
  Loader2,
  LockKeyhole,
  Mail,
  Menu,
  Moon,
  PlayCircle,
  Plus,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const LOGO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'
const BRAND_HERO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/c70597729a1ba58a7b7b672d2bcace2f673a5a49/bdbeb65d-b4f5-4f65-a388-e95d950eac84%20%281%29.png'

type Theme = 'light' | 'dark'
type View = 'home' | 'media' | 'detail' | 'admin' | 'login' | 'register'
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

type AdminUser = {
  id: number
  name: string
  email: string
  role: CurrentUser['role']
  access: CurrentUser['access']
  status: 'active' | 'disabled'
  createdAt: string
}

type VipRequest = {
  id: number
  userId: number | null
  name: string
  email: string
  phone: string
  slipName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
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

type SiteSettings = {
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  heroImageUrl: string
  heroPrimaryLabel: string
  heroSecondaryLabel: string
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
const defaultSiteSettings: SiteSettings = {
  heroEyebrow: 'AI / Cyber / School Operations',
  heroTitle: 'ศูนย์กลางสื่อการเรียนรู้ที่สดใส ล้ำสมัย และใช้งานง่าย',
  heroDescription:
    'ออกแบบเป็น portal โรงเรียนยุคใหม่ มีคลังสื่อแบบ dashboard, แยกสิทธิ์ Public / Member / VIP และเชื่อมสื่อจาก Drive, Sheet, YouTube ได้ในที่เดียว',
  heroImageUrl: BRAND_HERO_URL,
  heroPrimaryLabel: 'เปิดคลังสื่อ',
  heroSecondaryLabel: 'ดูสิทธิ์ VIP',
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

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text()
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      response.ok
        ? 'API ส่งข้อมูลกลับมาไม่ถูกต้อง'
        : 'API ยังไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง',
    )
  }
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
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
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
        const [mediaResponse, categoriesResponse, settingsResponse] = await Promise.all([
          fetch('/api/media'),
          fetch('/api/categories'),
          fetch('/api/settings'),
        ])

        if (!mediaResponse.ok || !categoriesResponse.ok || !settingsResponse.ok) {
          throw new Error('API response was not ok')
        }

        const mediaJson = (await mediaResponse.json()) as {
          media?: MediaItem[]
        }
        const categoriesJson = (await categoriesResponse.json()) as {
          categories?: Array<{ name: string }>
        }
        const settingsJson = (await settingsResponse.json()) as {
          settings?: SiteSettings
        }

        if (!active) return

        const nextMedia = mediaJson.media?.length ? mediaJson.media : mediaItems
        setMediaRecords(nextMedia)
        setSelected(nextMedia[0] ?? mediaItems[0])
        setTopicOptions([
          'ทั้งหมด',
          ...(categoriesJson.categories?.map((item) => item.name) ?? topics.slice(1)),
        ])
        setSiteSettings(settingsJson.settings ?? defaultSiteSettings)
        setDataStatus('ready')
      } catch {
        if (!active) return
        setMediaRecords(mediaItems)
        setTopicOptions(topics)
        setSiteSettings(defaultSiteSettings)
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
              <Hero settings={siteSettings} setView={setView} />
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
            <LoginPanel onLogin={handleLogin} setView={setView} />
          )}
          {view === 'register' && (
            <RegisterPanel
              onRegistered={(user) => {
                handleLogin(user)
                notifySuccess('สมัครสมาชิกสำเร็จ')
              }}
              setView={setView}
              settings={siteSettings}
            />
          )}
          {view === 'admin' && currentUser?.role === 'superadmin' && (
            <AdminPanel
              mediaItems={mediaRecords}
              onCreated={() => {
                setRefreshToken((value) => value + 1)
                notifySuccess('เพิ่มสื่อใหม่ลง Neon แล้ว')
              }}
              onSettingsSaved={(settings) => {
                setSiteSettings(settings)
                notifySuccess('บันทึกการตั้งค่า VIP แล้ว')
              }}
              settings={siteSettings}
              topics={topicOptions.filter((item) => item !== 'ทั้งหมด')}
            />
          )}
          {view === 'admin' && currentUser?.role !== 'superadmin' && (
            <LoginPanel onLogin={handleLogin} setView={setView} />
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
            <>
              <button
                className="hidden min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/10 dark:text-white sm:inline-flex sm:items-center"
                onClick={() => setView('login')}
                type="button"
              >
                เข้าสู่ระบบ
              </button>
              <button
                className="hidden min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-black text-cyan-200 shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950 sm:inline-flex sm:items-center"
                onClick={() => setView('register')}
                type="button"
              >
                สมัครสมาชิก
              </button>
            </>
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
          {!currentUser && (
            <button
              className="mt-2 block min-h-12 w-full rounded-xl bg-slate-950 px-4 text-left text-sm font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950"
              onClick={() => {
                setView('register')
                setMenuOpen(false)
              }}
              type="button"
            >
              สมัครสมาชิก
            </button>
          )}
        </div>
      )}
    </header>
  )
}

function Hero({
  setView,
  settings,
}: {
  setView: (view: View) => void
  settings: SiteSettings
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:pt-12">
      <div className="grid overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-2xl shadow-sky-900/10 backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-white/[0.06]">
        <div className="p-6 sm:p-9 lg:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-900 dark:bg-cyan-400/10 dark:text-cyan-200">
            <BrainCircuit size={18} />
            {settings.heroEyebrow}
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl dark:text-white">
            {settings.heroTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark:text-slate-300">
            {settings.heroDescription}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 font-black text-cyan-200 shadow-xl shadow-slate-900/15 transition hover:-translate-y-0.5 dark:bg-cyan-300 dark:text-slate-950"
              onClick={() => setView('media')}
              type="button"
            >
              <BookOpen size={20} />
              {settings.heroPrimaryLabel}
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-6 font-black text-slate-800 transition hover:-translate-y-0.5 hover:border-cyan-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
              onClick={() => setView('media')}
              type="button"
            >
              <ShieldCheck size={20} />
              {settings.heroSecondaryLabel}
            </button>
          </div>
        </div>

        <BrandShowcase imageUrl={settings.heroImageUrl} />
      </div>
    </section>
  )
}

function BrandShowcase({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="relative min-h-[380px] overflow-hidden border-t border-sky-100 bg-sky-950 text-white lg:border-l lg:border-t-0">
      <img
        alt="MIX The Architect brand"
        className="absolute inset-0 h-full w-full object-cover"
        src={imageUrl || BRAND_HERO_URL}
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

function LoginPanel({
  onLogin,
  setView,
}: {
  onLogin: (user: CurrentUser) => void
  setView: (view: View) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [botVerified, setBotVerified] = useState(false)
  const [botTrap, setBotTrap] = useState('')
  const [botStartedAt] = useState(() => Date.now())

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          botVerified,
          botStartedAt,
          website: botTrap,
        }),
      })
      const result = await readJson<{
        user?: CurrentUser
        error?: string
      }>(response)

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
    <section className="mx-auto grid min-h-[calc(100vh-88px)] max-w-7xl place-items-center px-4 py-10 sm:px-6">
      <form
        className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/86 shadow-2xl shadow-sky-900/12 backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-slate-950/88"
        onSubmit={submitLogin}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500" />
        <div className="relative overflow-hidden bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(34,211,238,.38),transparent_32%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,.34),transparent_28%),linear-gradient(135deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:auto,auto,28px_28px]" />
          <div className="relative flex min-h-full flex-col justify-between gap-10">
            <div>
              <div className="flex items-center gap-3">
                <img
                  alt="MIKPURINUT"
                  className="h-14 w-14 rounded-2xl border border-cyan-300/30 object-cover shadow-xl shadow-cyan-500/20"
                  src={LOGO_URL}
                />
                <div>
                  <p className="text-sm font-black text-cyan-200">MIKPURINUT Nexus</p>
                  <p className="text-xs font-bold text-slate-400">Member Access Console</p>
                </div>
              </div>
              <h2 className="mt-10 text-4xl font-black leading-tight">
                เข้าสู่พื้นที่คลังสื่ออัจฉริยะ
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                ใช้บัญชีเดียวเพื่อเปิดสิทธิ์ดาวน์โหลด ติดตามสื่อที่บันทึกไว้ และเข้าสู่หลังบ้านเมื่อคุณเป็นผู้ดูแล
              </p>
            </div>

            <div className="grid gap-3">
              {[
                ['Public', 'ดูสื่อเปิดเผยได้ทันที'],
                ['Member', 'ปลดล็อกไฟล์สมาชิก'],
                ['VIP', 'เข้าถึงชุดสื่อขั้นสูง'],
              ].map(([label, detail]) => (
                <div
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/8 px-4 py-3"
                  key={label}
                >
                  <span className="font-black text-white">{label}</span>
                  <span className="text-sm font-bold text-slate-400">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="mb-7">
            <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">
              Secure Login
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">
              ลงชื่อเข้าใช้
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">
              กรอกอีเมลและรหัสผ่านเพื่อเข้าสู่ระบบบัญชีของคุณ
            </p>
          </div>

        <label className="block">
          <span className="text-sm font-black text-slate-600 dark:text-slate-300">
            อีเมล
          </span>
          <span className="mt-2 grid min-h-14 grid-cols-[58px_1fr] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-within:border-blue-500 transition-within:ring-4 transition-within:ring-blue-500/10 dark:border-white/10 dark:bg-white/10">
            <span className="grid place-items-center border-r border-slate-100 bg-slate-50 text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300">
              <Mail size={21} />
            </span>
            <input
              className="min-w-0 bg-transparent px-4 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              onChange={(event) => setEmail(event.target.value)}
              inputMode="email"
              placeholder="กรอกอีเมลหรือชื่อผู้ใช้"
              type="text"
              value={email}
            />
          </span>
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-black text-slate-600 dark:text-slate-300">
            รหัสผ่าน
          </span>
          <span className="mt-2 grid min-h-14 grid-cols-[58px_1fr_52px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-within:border-blue-500 transition-within:ring-4 transition-within:ring-blue-500/10 dark:border-white/10 dark:bg-white/10">
            <span className="grid place-items-center border-r border-slate-100 bg-slate-50 text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-cyan-300">
              <LockKeyhole size={21} />
            </span>
            <input
              className="min-w-0 bg-transparent px-4 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              className="grid place-items-center text-slate-500 hover:text-blue-600 dark:text-slate-300"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? <Eye size={21} /> : <EyeOff size={21} />}
            </button>
          </span>
        </label>

        <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold">
          <label className="flex min-h-10 items-center gap-2 text-slate-500 dark:text-slate-300">
            <input
              checked={remember}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            จำฉันไว้ในระบบ
          </label>
          <button className="text-blue-600 hover:text-blue-700" type="button">
            ลืมรหัสผ่าน?
          </button>
        </div>

        <input
          aria-hidden="true"
          className="hidden"
          onChange={(event) => setBotTrap(event.target.value)}
          tabIndex={-1}
          value={botTrap}
        />
        <label className="mt-4 flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
          <input
            checked={botVerified}
            className="h-4 w-4"
            onChange={(event) => setBotVerified(event.target.checked)}
            type="checkbox"
          />
          ฉันไม่ใช่โปรแกรมอัตโนมัติ
        </label>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-5 text-lg font-black text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting && <Loader2 className="animate-spin" size={20} />}
            {submitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
            {!submitting && <ChevronRight size={21} />}
          </button>

        <div className="my-8 flex items-center gap-3 text-xs font-black text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          หรือเข้าสู่ระบบด้วย
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 font-black text-white shadow-lg shadow-red-500/20"
            onClick={() => setError('Google Login จะเชื่อมต่อในขั้นตอน OAuth ถัดไป')}
            type="button"
          >
            <span className="text-xl">G</span>
            Google
          </button>
          <button
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 font-black text-white shadow-lg shadow-blue-700/20"
            onClick={() => setError('Facebook Login เป็นตัวเลือกสำรองในอนาคต')}
            type="button"
          >
            <span className="text-xl">f</span>
            Facebook
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4 text-center text-sm font-bold text-slate-500 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-slate-300">
          ยังไม่มีบัญชีสมาชิก?{' '}
          <button
            className="font-black text-blue-600 dark:text-cyan-200"
            onClick={() => setView('register')}
            type="button"
          >
            สมัครฟรี!
          </button>
        </div>
        </div>
      </form>
    </section>
  )
}

function RegisterPanel({
  onRegistered,
  setView,
  settings,
}: {
  onRegistered: (user: CurrentUser) => void
  setView: (view: View) => void
  settings: SiteSettings
}) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    membership: 'member' as 'member' | 'vip',
  })
  const [agree, setAgree] = useState(false)
  const [slipName, setSlipName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [botVerified, setBotVerified] = useState(false)
  const [botTrap, setBotTrap] = useState('')
  const [botStartedAt] = useState(() => Date.now())

  const updateForm = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submitRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    if (!agree) {
      setError('กรุณายืนยันว่าข้อมูลถูกต้องก่อนสมัครสมาชิก')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          slipName,
          botVerified,
          botStartedAt,
          website: botTrap,
        }),
      })
      const result = await readJson<{
        user?: CurrentUser
        error?: string
      }>(response)

      if (!response.ok || !result.user) {
        throw new Error(result.error ?? 'สมัครสมาชิกไม่สำเร็จ')
      }

      onRegistered(result.user)
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : 'สมัครสมาชิกไม่สำเร็จ',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const vipSelected = form.membership === 'vip'

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 p-5 text-white shadow-2xl shadow-sky-900/15 sm:p-8">
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_12%_18%,rgba(34,211,238,.36),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(244,114,182,.26),transparent_30%),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:auto,auto,42px_42px,42px_42px]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <button
              className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 font-black text-cyan-100"
              onClick={() => setView('login')}
              type="button"
            >
              <ArrowLeft size={18} />
              กลับไปหน้าเข้าสู่ระบบ
            </button>
            <div className="flex items-center gap-4">
              <img
                alt="MIKPURINUT"
                className="h-16 w-16 rounded-2xl border border-cyan-300/30 object-cover shadow-xl shadow-cyan-500/20"
                src={LOGO_URL}
              />
              <div>
                <p className="text-sm font-black text-cyan-200">MIKPURINUT Membership</p>
                <h2 className="text-3xl font-black sm:text-4xl">
                  เลือกสิทธิ์ แล้วเริ่มใช้งานคลังสื่อ
                </h2>
              </div>
            </div>
            <p className="mt-5 max-w-3xl leading-8 text-slate-300">
              สมัครครั้งเดียวเพื่อเก็บประวัติ ดาวน์โหลดสื่อสมาชิก และส่งคำขอ VIP ได้ในหน้าเดียว
              โดยผู้ดูแลสามารถเปิดปิดแพ็กเกจ VIP และเปลี่ยน QR Code จากหลังบ้าน
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {['บัญชีสมาชิก', 'เลือกสิทธิ์', 'ยืนยันและใช้งาน'].map((item, index) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/10 p-4"
                key={item}
              >
                <p className="text-xs font-black text-cyan-200">STEP {index + 1}</p>
                <p className="mt-1 font-black">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <form
        className="mt-6 rounded-[2rem] border border-white/70 bg-white/86 p-5 shadow-2xl shadow-slate-950/8 backdrop-blur-xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/[0.06]"
        onSubmit={submitRegister}
      >
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-black text-slate-950 dark:text-white">
              สมัครสมาชิกใหม่
            </h2>
            <p className="mt-1 text-sm font-black text-slate-500 dark:text-slate-400">
              ข้อมูลบัญชี
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <RegisterField
            label="ชื่อ-นามสกุล"
            onChange={(value) => updateForm('name', value)}
            placeholder="เช่น สมชาย ใจดี"
            value={form.name}
          />
          <RegisterField
            label="เบอร์โทรศัพท์"
            onChange={(value) => updateForm('phone', value)}
            placeholder="08xxxxxxxx"
            value={form.phone}
          />
          <RegisterField
            className="md:col-span-2"
            label="อีเมล"
            onChange={(value) => updateForm('email', value)}
            placeholder="name@example.com"
            type="email"
            value={form.email}
          />
          <RegisterField
            label="รหัสผ่าน"
            onChange={(value) => updateForm('password', value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            type="password"
            value={form.password}
          />
          <RegisterField
            label="ยืนยันรหัสผ่าน"
            onChange={(value) => updateForm('confirmPassword', value)}
            placeholder="ระบุรหัสผ่านอีกครั้ง"
            type="password"
            value={form.confirmPassword}
          />
        </div>

        <p className="mt-6 text-sm font-black text-slate-600 dark:text-slate-300">
          เลือกประเภทสมาชิก
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <MembershipCard
            active={form.membership === 'member'}
            detail="ดาวน์โหลดไฟล์พื้นฐาน"
            icon={<Users size={34} />}
            onClick={() => updateForm('membership', 'member')}
            title="สมาชิกทั่วไป (ฟรี)"
          />
          <MembershipCard
            active={vipSelected}
            badge="แนะนำ"
            detail={
              settings.vipRegistrationEnabled && settings.vipPrice > 0
                ? `${settings.vipPrice.toLocaleString('th-TH')} บาท / ตลอดชีพ`
                : 'รอเปิดรับจากผู้ดูแล'
            }
            disabled={!settings.vipRegistrationEnabled}
            icon={<Crown size={36} />}
            onClick={() => updateForm('membership', 'vip')}
            title="สมาชิก VIP"
          />
        </div>

        {vipSelected && settings.vipRegistrationEnabled && (
          <div className="mt-6 rounded-3xl bg-slate-50 p-5 shadow-lg shadow-slate-950/5 dark:bg-white/[0.06]">
            <h3 className="text-center text-xl font-black text-blue-700 dark:text-cyan-200">
              {settings.vipPaymentTitle}
            </h3>
            <p className="mt-2 text-center text-sm font-bold text-slate-500 dark:text-slate-400">
              {settings.vipPaymentSubtitle}
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
              <div className="text-center">
                {settings.vipQrUrl ? (
                  <img
                    alt="VIP QR"
                    className="mx-auto h-44 w-44 rounded-xl border border-slate-200 bg-white object-cover p-2"
                    src={settings.vipQrUrl}
                  />
                ) : (
                  <div className="mx-auto grid h-44 w-44 place-items-center rounded-xl border border-dashed border-slate-300 bg-white text-sm font-bold text-slate-400">
                    QR Code
                  </div>
                )}
                <p className="mt-3 text-sm font-bold text-slate-500 dark:text-slate-300">
                  สแกนเพื่อจ่ายเงิน
                </p>
              </div>
              <div className="space-y-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                <p>ธนาคาร: {settings.vipBankName}</p>
                <p>เลขที่บัญชี: {settings.vipAccountNumber || '-'}</p>
                <p>ชื่อบัญชี: {settings.vipAccountName}</p>
                <p className="text-red-500">
                  ยอดโอน: {settings.vipPrice > 0 ? `${settings.vipPrice.toLocaleString('th-TH')} บาท` : 'รอผู้ดูแลกำหนด'}
                </p>
                <label className="block">
                  <span className="mb-2 block font-black">{settings.vipSlipLabel}</span>
                  <input
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                    onChange={(event) => setSlipName(event.target.files?.[0]?.name ?? '')}
                    type="file"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="mx-auto mt-6 grid h-20 max-w-xs place-items-center border border-slate-300 bg-white text-sm text-slate-500">
          <label className="flex items-center gap-3 font-bold">
            <input
              checked={botVerified}
              className="h-4 w-4"
              onChange={(event) => setBotVerified(event.target.checked)}
              type="checkbox"
            />
            ฉันไม่ใช่โปรแกรมอัตโนมัติ
          </label>
        </div>
        <input
          aria-hidden="true"
          className="hidden"
          onChange={(event) => setBotTrap(event.target.value)}
          tabIndex={-1}
          value={botTrap}
        />

        <label className="mt-5 flex items-start gap-3 text-sm font-bold text-slate-500 dark:text-slate-300">
          <input
            checked={agree}
            className="mt-1 h-4 w-4"
            onChange={(event) => setAgree(event.target.checked)}
            type="checkbox"
          />
          {settings.vipAgreementLabel}
        </label>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {error}
          </div>
        )}

        <button
          className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 text-lg font-black text-white shadow-2xl shadow-rose-500/20 disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? <Loader2 className="animate-spin" size={22} /> : <UserPlus size={22} />}
          {submitting ? 'กำลังลงทะเบียน...' : settings.vipSubmitLabel}
        </button>
        <p className="mt-5 text-center text-sm font-bold text-slate-500 dark:text-slate-300">
          มีบัญชีผู้ใช้งานแล้ว?{' '}
          <button className="font-black text-blue-600 dark:text-cyan-200" onClick={() => setView('login')} type="button">
            เข้าสู่ระบบ
          </button>
        </p>
      </form>
    </section>
  )
}

function RegisterField({
  className = '',
  label,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  className?: string
  label: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  value: string
}) {
  return (
    <label className={className}>
      <span className="text-sm font-black text-slate-700 dark:text-slate-200">
        {label}
      </span>
      <input
        className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/10"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  )
}

function MembershipCard({
  active,
  badge,
  detail,
  disabled,
  icon,
  onClick,
  title,
}: {
  active: boolean
  badge?: string
  detail: string
  disabled?: boolean
  icon: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      className={`relative min-h-32 rounded-2xl border p-5 text-center transition ${
        active
          ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-xl shadow-pink-500/15'
          : 'border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-0.5'}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {badge && (
        <span className="absolute right-4 top-[-12px] rounded-lg bg-pink-500 px-3 py-1 text-xs font-black text-white">
          {badge}
        </span>
      )}
      <div className="mx-auto mb-3 grid place-items-center text-current">{icon}</div>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{disabled ? 'ปิดรับสมัครชั่วคราว' : detail}</p>
    </button>
  )
}

function AdminPanel({
  mediaItems,
  onCreated,
  onSettingsSaved,
  settings,
  topics,
}: {
  mediaItems: MediaItem[]
  onCreated: () => void
  onSettingsSaved: (settings: SiteSettings) => void
  settings: SiteSettings
  topics: string[]
}) {
  const [form, setForm] = useState<MediaFormState>(() =>
    createEmptyMediaForm(topics[0]),
  )
  const [adminToken, setAdminToken] = useState('')
  const [settingsForm, setSettingsForm] = useState({
    ...settings,
    vipPrice: String(settings.vipPrice),
  })
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [vipRequests, setVipRequests] = useState<VipRequest[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [error, setError] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [memberError, setMemberError] = useState('')

  const pendingVipRequests = vipRequests.filter((request) => request.status === 'pending')
  const adminMetrics = [
    { label: 'สมาชิกทั้งหมด', value: adminUsers.length.toLocaleString('th-TH'), icon: Users },
    { label: 'สื่อเผยแพร่', value: mediaItems.length.toLocaleString('th-TH'), icon: Layers3 },
    {
      label: 'ดาวน์โหลดรวม',
      value: mediaItems.reduce((sum, item) => sum + item.downloads, 0).toLocaleString('th-TH'),
      icon: Download,
    },
    { label: 'คำขอรอตรวจ', value: pendingVipRequests.length.toLocaleString('th-TH'), icon: AlertCircle },
  ]

  const loadMembers = async () => {
    setLoadingMembers(true)
    setMemberError('')
    try {
      const response = await fetch('/api/admin/users', { credentials: 'include' })
      const result = await readJson<{
        users?: AdminUser[]
        vipRequests?: VipRequest[]
        error?: string
      }>(response)

      if (!response.ok) throw new Error(result.error ?? 'โหลดข้อมูลสมาชิกไม่สำเร็จ')
      setAdminUsers(result.users ?? [])
      setVipRequests(result.vipRequests ?? [])
    } catch (loadError) {
      setMemberError(
        loadError instanceof Error ? loadError.message : 'โหลดข้อมูลสมาชิกไม่สำเร็จ',
      )
    } finally {
      setLoadingMembers(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => void loadMembers())
  }, [])

  const submitMemberAction = async (payload: Record<string, unknown>) => {
    setLoadingMembers(true)
    setMemberError('')
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const result = await readJson<{ error?: string }>(response)

      if (!response.ok) throw new Error(result.error ?? 'อัปเดตสมาชิกไม่สำเร็จ')
      await loadMembers()
    } catch (actionError) {
      setMemberError(
        actionError instanceof Error ? actionError.message : 'อัปเดตสมาชิกไม่สำเร็จ',
      )
      setLoadingMembers(false)
    }
  }

  const updateForm = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const startEditMedia = (item: MediaItem) => {
    setEditingMediaId(item.id)
    setForm({
      title: item.title,
      topic: item.topic,
      access: item.access,
      status: item.status,
      price: String(item.price ?? 0),
      source: item.source,
      cover: item.cover,
      resourceUrl: item.resourceUrl ?? '',
      previewUrl: item.previewUrl ?? '',
      description: item.description,
    })
    document.getElementById('admin-create-media')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resetMediaForm = () => {
    setEditingMediaId(null)
    setForm(createEmptyMediaForm(topics[0]))
  }

  const updateSettings = (
    name: keyof typeof settingsForm,
    value: string | boolean,
  ) => {
    setSettingsForm((current) => ({ ...current, [name]: value }))
  }

  const submitMedia = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(editingMediaId ? `/api/media/${editingMediaId}` : '/api/media', {
        method: editingMediaId ? 'PUT' : 'POST',
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

      resetMediaForm()
      onCreated()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const deleteMedia = async (item: MediaItem) => {
    if (!window.confirm(`ลบสื่อ "${item.title}" ใช่ไหม?`)) return
    setError('')
    setSaving(true)
    try {
      const response = await fetch(`/api/media/${item.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'ลบสื่อไม่สำเร็จ')
      if (editingMediaId === item.id) resetMediaForm()
      onCreated()
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบสื่อไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const submitSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSettingsError('')
    setSavingSettings(true)

    const nextSettings: SiteSettings = {
      ...settingsForm,
      vipPrice: Number(settingsForm.vipPrice || 0),
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(nextSettings),
      })
      const result = await readJson<{
        settings?: SiteSettings
        error?: string
      }>(response)

      if (!response.ok || !result.settings) {
        throw new Error(result?.error ?? 'บันทึกการตั้งค่าไม่สำเร็จ')
      }

      onSettingsSaved(result.settings)
    } catch (saveError) {
      setSettingsError(
        saveError instanceof Error ? saveError.message : 'บันทึกการตั้งค่าไม่สำเร็จ',
      )
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,.96),rgba(8,13,24,.98)_52%,rgba(12,35,50,.92))] p-4 text-white shadow-2xl shadow-slate-950/30 ring-1 ring-cyan-300/10 sm:p-6">
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/12 px-3 py-1.5 text-sm font-black text-cyan-100">
              <Gauge size={16} />
              Super Admin Control Center
            </p>
            <h2 className="text-3xl font-black leading-tight sm:text-4xl">
              หลังบ้านดาร์กแบบ programmer dashboard
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
              จัดการสื่อ สมาชิก VIP และข้อความหน้าเว็บจากพื้นที่เดียว ออกแบบให้สแกนง่ายบนคอมและมือถือ
            </p>
          </div>
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-300 to-sky-400 px-5 font-black text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5"
            href="#admin-create-media"
          >
            <Plus size={20} />
            เพิ่มสื่อใหม่
          </a>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {adminMetrics.map((stat) => (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-sm ring-1 ring-white/[0.03]"
              key={stat.label}
            >
              <stat.icon className="mb-4 text-cyan-300" size={24} />
              <p className="text-sm font-bold text-slate-400">{stat.label}</p>
              <p className="mt-1 text-3xl font-black tracking-tight text-white">{stat.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[230px_1fr]">
          <aside className="h-max rounded-2xl border border-white/10 bg-black/25 p-3 lg:sticky lg:top-24">
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
                  className="mb-1 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-slate-300 transition hover:bg-cyan-300/10 hover:text-cyan-100"
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
          <section className="rounded-2xl border border-emerald-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <Users className="text-emerald-300" size={22} />
                  สมาชิกและคำขอ VIP
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  ตรวจคำขอ VIP ปรับสิทธิ์ และเปิด/ปิดบัญชีสมาชิกได้จากหน้านี้
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 font-black text-slate-950 disabled:opacity-60"
                disabled={loadingMembers}
                onClick={loadMembers}
                type="button"
              >
                {loadingMembers ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                รีเฟรช
              </button>
            </div>

            {memberError && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {memberError}
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-black text-white">คำขอ VIP รอตรวจ</p>
                  <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">
                    {pendingVipRequests.length}
                  </span>
                </div>
                <div className="grid gap-3">
                  {pendingVipRequests.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                      ยังไม่มีคำขอ VIP ที่รอตรวจ
                    </div>
                  )}
                  {pendingVipRequests.map((request) => (
                    <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-4" key={request.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-white">{request.name}</p>
                          <p className="text-sm font-semibold text-slate-400">{request.email}</p>
                          {request.phone && (
                            <p className="text-sm font-semibold text-slate-400">{request.phone}</p>
                          )}
                          {request.slipName && (
                            <p className="mt-1 text-xs font-bold text-cyan-200">สลิป: {request.slipName}</p>
                          )}
                        </div>
                        <Crown className="shrink-0 text-amber-300" size={22} />
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-3 font-black text-slate-950 disabled:opacity-60"
                          disabled={loadingMembers}
                          onClick={() => submitMemberAction({ action: 'approve-vip', requestId: request.id })}
                          type="button"
                        >
                          <CheckCircle2 size={18} />
                          อนุมัติ
                        </button>
                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 font-black text-white disabled:opacity-60"
                          disabled={loadingMembers}
                          onClick={() => submitMemberAction({ action: 'reject-vip', requestId: request.id })}
                          type="button"
                        >
                          <X size={18} />
                          ปฏิเสธ
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 font-black text-white">สมาชิกทั้งหมด</p>
                <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1">
                  {adminUsers.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                      ยังไม่มีข้อมูลสมาชิก
                    </div>
                  )}
                  {adminUsers.map((user) => {
                    const isSuperAdmin = user.role === 'superadmin'
                    return (
                      <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-4" key={user.id}>
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div className="min-w-0">
                            <p className="truncate font-black text-white">{user.name}</p>
                            <p className="truncate text-sm font-semibold text-slate-400">{user.email}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-black">
                              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-cyan-200">{user.role}</span>
                              <span className="rounded-full bg-amber-300/10 px-3 py-1 text-amber-200">{user.access}</span>
                              <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{user.status}</span>
                            </div>
                          </div>
                          <ShieldCheck className={isSuperAdmin ? 'text-cyan-300' : 'text-slate-500'} size={22} />
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <button
                            className="min-h-10 rounded-xl bg-cyan-300/10 px-3 text-sm font-black text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={loadingMembers || isSuperAdmin}
                            onClick={() =>
                              submitMemberAction({
                                action: 'set-access',
                                userId: user.id,
                                access: user.access === 'VIP' ? 'สมาชิก' : 'VIP',
                              })
                            }
                            type="button"
                          >
                            {user.access === 'VIP' ? 'ลดเป็นสมาชิก' : 'ให้สิทธิ์ VIP'}
                          </button>
                          <button
                            className="min-h-10 rounded-xl bg-white/10 px-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={loadingMembers || isSuperAdmin}
                            onClick={() =>
                              submitMemberAction({
                                action: 'set-status',
                                userId: user.id,
                                status: user.status === 'active' ? 'disabled' : 'active',
                              })
                            }
                            type="button"
                          >
                            {user.status === 'active' ? 'ปิดบัญชี' : 'เปิดบัญชี'}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <form
            className="rounded-2xl border border-sky-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]"
            onSubmit={submitSettings}
          >
            <div className="mb-4">
              <h3 className="text-xl font-black">ตั้งค่าหน้าแรกและหน้าปกเว็บไซต์</h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                แก้ข้อความ hero และรูปหน้าปกหน้าแรกได้โดยไม่ต้องแก้โค้ด
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label="ป้ายหัวข้อเล็ก"
                name="heroEyebrow"
                onChange={updateSettings}
                placeholder="AI / Cyber / School Operations"
                value={settingsForm.heroEyebrow}
              />
              <AdminField
                label="URL รูปหน้าปกเว็บไซต์"
                name="heroImageUrl"
                onChange={updateSettings}
                placeholder="https://..."
                value={settingsForm.heroImageUrl}
              />
              <AdminField
                label="หัวข้อใหญ่หน้าแรก"
                name="heroTitle"
                onChange={updateSettings}
                placeholder="ศูนย์กลางสื่อ..."
                value={settingsForm.heroTitle}
              />
              <AdminField
                label="คำอธิบายหน้าแรก"
                name="heroDescription"
                onChange={updateSettings}
                placeholder="รายละเอียดแนะนำเว็บไซต์"
                value={settingsForm.heroDescription}
              />
              <AdminField
                label="ข้อความปุ่มหลัก"
                name="heroPrimaryLabel"
                onChange={updateSettings}
                placeholder="เปิดคลังสื่อ"
                value={settingsForm.heroPrimaryLabel}
              />
              <AdminField
                label="ข้อความปุ่มรอง"
                name="heroSecondaryLabel"
                onChange={updateSettings}
                placeholder="ดูสิทธิ์ VIP"
                value={settingsForm.heroSecondaryLabel}
              />
            </div>
            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-300 px-5 font-black text-slate-950 shadow-lg shadow-sky-500/20 disabled:opacity-60 sm:w-auto"
              disabled={savingSettings}
              type="submit"
            >
              {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Settings size={20} />}
              {savingSettings ? 'กำลังบันทึก...' : 'บันทึกหน้าแรก'}
            </button>
          </form>

          <form
            className="rounded-2xl border border-pink-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]"
            onSubmit={submitSettings}
          >
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-black">ตั้งค่าสมัคร VIP และ QR Code</h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  เปิด/ปิดแพ็กเกจ VIP และเปลี่ยนข้อมูลชำระเงินที่หน้า สมัครสมาชิก
                </p>
              </div>
              <label className="inline-flex min-h-11 items-center gap-3 rounded-2xl bg-black/24 px-4 font-black">
                <input
                  checked={settingsForm.vipRegistrationEnabled}
                  onChange={(event) =>
                    updateSettings('vipRegistrationEnabled', event.target.checked)
                  }
                  type="checkbox"
                />
                เปิดรับ VIP
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label="ราคา VIP"
                name="vipPrice"
                onChange={updateSettings}
                placeholder="499"
                type="number"
                value={settingsForm.vipPrice}
              />
              <AdminField
                label="URL QR Code"
                name="vipQrUrl"
                onChange={updateSettings}
                placeholder="https://..."
                value={settingsForm.vipQrUrl}
              />
              <AdminField
                label="ธนาคาร / ช่องทาง"
                name="vipBankName"
                onChange={updateSettings}
                placeholder="พร้อมเพย์ (PromptPay)"
                value={settingsForm.vipBankName}
              />
              <AdminField
                label="เลขที่บัญชี / เบอร์พร้อมเพย์"
                name="vipAccountNumber"
                onChange={updateSettings}
                placeholder="08x-xxx-xxxx"
                value={settingsForm.vipAccountNumber}
              />
              <AdminField
                label="ชื่อบัญชี"
                name="vipAccountName"
                onChange={updateSettings}
                placeholder="MIKPURINUT"
                value={settingsForm.vipAccountName}
              />
              <AdminField
                label="หัวข้อกล่องชำระเงิน"
                name="vipPaymentTitle"
                onChange={updateSettings}
                placeholder="ข้อมูลการชำระเงิน VIP"
                value={settingsForm.vipPaymentTitle}
              />
              <AdminField
                label="คำอธิบายกล่องชำระเงิน"
                name="vipPaymentSubtitle"
                onChange={updateSettings}
                placeholder="กรุณาโอนเงินและแนบสลิปเพื่อยืนยันสิทธิ์"
                value={settingsForm.vipPaymentSubtitle}
              />
              <AdminField
                label="ข้อความช่องแนบสลิป"
                name="vipSlipLabel"
                onChange={updateSettings}
                placeholder="แนบสลิปโอนเงิน"
                value={settingsForm.vipSlipLabel}
              />
              <AdminField
                label="ข้อความยอมรับเงื่อนไข"
                name="vipAgreementLabel"
                onChange={updateSettings}
                placeholder="ข้อมูลถูกต้องและยอมรับเงื่อนไขการใช้งาน"
                value={settingsForm.vipAgreementLabel}
              />
              <AdminField
                label="ข้อความปุ่มสมัคร"
                name="vipSubmitLabel"
                onChange={updateSettings}
                placeholder="ลงทะเบียนสมาชิก"
                value={settingsForm.vipSubmitLabel}
              />
            </div>

            {settingsError && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {settingsError}
              </div>
            )}
            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pink-400 px-5 font-black text-white shadow-lg shadow-pink-500/20 disabled:opacity-60 sm:w-auto"
              disabled={savingSettings}
              type="submit"
            >
              {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Settings size={20} />}
              {savingSettings ? 'กำลังบันทึก...' : 'บันทึกตั้งค่า VIP'}
            </button>
          </form>

          <form
            className="rounded-2xl border border-cyan-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]"
            id="admin-create-media"
            onSubmit={submitMedia}
          >
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-black">
                  {editingMediaId ? 'แก้ไขการ์ดสื่อ' : 'เพิ่มการ์ดสื่อใหม่'}
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  แปะลิงก์ Drive, Sheet, YouTube หรือเว็บภายนอก โดยไม่ต้องแก้โค้ด
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingMediaId && (
                  <button
                    className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white"
                    onClick={resetMediaForm}
                    type="button"
                  >
                    ยกเลิกแก้ไข
                  </button>
                )}
                <span className="inline-flex min-h-10 items-center rounded-xl bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">
                  {editingMediaId ? `ID ${editingMediaId}` : 'บันทึกลง Neon'}
                </span>
              </div>
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
              {saving ? <Loader2 className="animate-spin" size={20} /> : editingMediaId ? <Pencil size={20} /> : <Plus size={20} />}
              {saving ? 'กำลังบันทึก...' : editingMediaId ? 'บันทึกการแก้ไข' : 'บันทึกสื่อใหม่'}
            </button>
          </form>

          <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-300/10 px-3 text-sm font-black text-cyan-200"
                            onClick={() => startEditMedia(item)}
                            type="button"
                          >
                            <Pencil size={15} />
                            แก้ไข
                          </button>
                          <button
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-400/10 px-3 text-sm font-black text-red-200"
                            onClick={() => deleteMedia(item)}
                            type="button"
                          >
                            <Trash2 size={15} />
                            ลบ
                          </button>
                        </div>
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
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <button
                      className="min-h-11 rounded-xl bg-cyan-300 px-4 font-black text-slate-950"
                      onClick={() => startEditMedia(item)}
                      type="button"
                    >
                      แก้ไข
                    </button>
                    <button
                      className="min-h-11 rounded-xl bg-red-400/15 px-4 font-black text-red-100"
                      onClick={() => deleteMedia(item)}
                      type="button"
                    >
                      ลบ
                    </button>
                  </div>
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

function AdminField<K extends string>({
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  label: string
  name: K
  onChange: (name: K, value: string) => void
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
