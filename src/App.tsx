import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  BookmarkCheck,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
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
  LogOut,
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
  UserCircle2,
  Users,
  X,
} from 'lucide-react'
import './App.css'

const LOGO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/ab67fea68788dc5db9514475e8f2b8cb1c32d8b3/ChatGPT%20Image%2023%20%E0%B8%9E.%E0%B8%84.%202569%2008_05_56.png'
const BRAND_HERO_URL =
  'https://raw.githubusercontent.com/Purinut1997/web-images/c70597729a1ba58a7b7b672d2bcace2f673a5a49/bdbeb65d-b4f5-4f65-a388-e95d950eac84%20%281%29.png'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string
    }
  }
}

type Theme = 'light' | 'dark'
type View = 'home' | 'media' | 'detail' | 'account' | 'admin' | 'login' | 'register' | 'forgot' | 'reset'
type AdminSection =
  | 'dashboard'
  | 'media'
  | 'members'
  | 'taxonomy'
  | 'links'
  | 'activity'
  | 'health'
  | 'backup'
  | 'errors'
  | 'settings'
type AccessLevel = 'สาธารณะ' | 'สมาชิก' | 'VIP' | 'ซื้อแยก'
type MediaStatus = 'ฉบับร่าง' | 'รอตรวจสอบ' | 'เผยแพร่แล้ว' | 'ซ่อนชั่วคราว' | 'ถูกปฏิเสธ'
type MediaSource = 'Google Drive' | 'Google Sheet' | 'YouTube' | 'External Link'
type AdminDateFilter = 'ทั้งหมด' | 'วันนี้' | '7 วัน' | '30 วัน'
type AdminMediaSort = 'ล่าสุด' | 'ดาวน์โหลดมากสุด' | 'เข้าชมมากสุด' | 'ชื่อ A-Z'

type MediaLink = {
  id?: number
  label: string
  type: MediaSource
  url: string
  previewUrl: string
  access: AccessLevel
}

type MediaItem = {
  id: number
  slug?: string
  title: string
  topic: string
  access: AccessLevel
  status: MediaStatus | 'เผยแพร่' | 'แบบร่าง' | 'ซ่อน'
  price: number
  downloads: number
  views: number
  rating: number
  cover: string
  source: MediaSource
  description: string
  resourceUrl?: string
  previewUrl?: string
  links?: MediaLink[]
  tags?: string[]
  createdAt?: string
  updatedAt?: string
}

type CurrentUser = {
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'member'
  access: 'VIP' | 'สมาชิก'
}

type MemberLibrary = {
  profile: CurrentUser & { createdAt: string }
  favorites: Array<{ media: MediaItem; savedAt: string }>
  history: Array<{ media: MediaItem; lastDownloadedAt: string; downloadCount: number }>
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

type AuditLog = {
  id: number
  actor: string
  action: string
  targetType: string
  targetId: string | null
  detail: Record<string, unknown>
  createdAt: string
}

type ErrorLog = {
  id: number
  source: string
  message: string
  stack: string
  detail: Record<string, unknown>
  createdAt: string
}

type SystemHealth = {
  cloudflare: string
  neon: string
  api: string
  storage: string
  responseTimeMs: number
  lastBackupAt: string | null
  lastLinkCheckAt?: string | null
  lastError: { source: string; message: string; createdAt: string } | null
  counts: {
    media: number
    users: number
    pendingVip: number
    links: number
    errors24h: number
    unreadNotifications?: number
    activeRateLimits?: number
  }
}

type TelegramStatus = {
  botTokenConfigured: boolean
  chatIdConfigured: boolean
  ready: boolean
}

type AdminNotification = {
  id: number
  audience: 'superadmin' | 'admin' | 'all'
  type: string
  title: string
  detail: string
  tone: 'sky' | 'amber' | 'red' | 'emerald'
  targetType: string | null
  targetId: string | null
  readAt: string | null
  createdAt: string
}

type AnalyticsPoint = {
  label: string
  value: number
}

type AdminAnalytics = {
  downloadsDaily: AnalyticsPoint[]
  viewsDaily: AnalyticsPoint[]
  membersMonthly: AnalyticsPoint[]
  vipWeekly: AnalyticsPoint[]
  topDownloads: AnalyticsPoint[]
  accessBreakdown: AnalyticsPoint[]
  statusBreakdown: AnalyticsPoint[]
  sourceBreakdown: AnalyticsPoint[]
  engagement: {
    views30d: number
    downloads30d: number
    activeUsers: number
    vipUsers: number
  }
}

type LinkCheckResult = {
  mediaId: number
  mediaTitle: string
  linkId: number
  label: string
  type: string
  url: string
  status: 'ok' | 'warning' | 'error'
  statusCode: number | null
  message: string
}

type RestorePreview = {
  categories: number
  media: number
  mediaLinks: number
  mediaEvents: number
  mediaReviews: number
  userFavorites: number
  tags: number
  mediaTags: number
  users: number
  vipRequests: number
  notifications: number
  settings: number
  mode?: 'merge' | 'replace'
  replaceTables?: string[]
  skippedUsers?: number
  warnings: string[]
}

type MediaFormState = {
  title: string
  topic: string
  access: AccessLevel
  status: MediaStatus
  price: string
  source: MediaSource
  cover: string
  resourceUrl: string
  previewUrl: string
  links: MediaLink[]
  tags: string
  description: string
}

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

const mediaItems: MediaItem[] = [
  {
    id: 1,
    title: 'ชุดเอกสารอบรม AI สำหรับครู',
    topic: 'AI',
    access: 'สาธารณะ',
    status: 'เผยแพร่แล้ว',
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
    status: 'เผยแพร่แล้ว',
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
    status: 'เผยแพร่แล้ว',
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
    status: 'ฉบับร่าง',
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
const statusOptions: MediaStatus[] = ['ฉบับร่าง', 'รอตรวจสอบ', 'เผยแพร่แล้ว', 'ซ่อนชั่วคราว', 'ถูกปฏิเสธ']
const sourceOptions: MediaSource[] = [
  'Google Drive',
  'Google Sheet',
  'YouTube',
  'External Link',
]

function normalizeMediaStatus(status: string): MediaStatus {
  if (status === 'เผยแพร่') return 'เผยแพร่แล้ว'
  if (status === 'แบบร่าง') return 'ฉบับร่าง'
  if (status === 'ซ่อน') return 'ซ่อนชั่วคราว'
  return statusOptions.includes(status as MediaStatus) ? (status as MediaStatus) : 'ฉบับร่าง'
}

const defaultSiteSettings: SiteSettings = {
  heroEyebrow: 'AI / Cyber / School Operations',
  heroTitle: 'ศูนย์กลางสื่อการเรียนรู้ที่สดใส ล้ำสมัย และใช้งานง่าย',
  heroDescription:
    'ออกแบบเป็น portal โรงเรียนยุคใหม่ มีคลังสื่อแบบ dashboard, แยกสิทธิ์ Public / Member / VIP และเชื่อมสื่อจาก Drive, Sheet, YouTube ได้ในที่เดียว',
  heroImageUrl: BRAND_HERO_URL,
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

function createEmptyMediaForm(topic = 'โรงเรียน'): MediaFormState {
  return {
    title: '',
    topic,
    access: 'สาธารณะ',
    status: 'เผยแพร่แล้ว',
    price: '0',
    source: 'Google Drive',
    cover: '',
    resourceUrl: '',
    previewUrl: '',
    links: [createEmptyMediaLink()],
    tags: '',
    description: '',
  }
}

function createEmptyMediaLink(): MediaLink {
  return {
    label: 'ไฟล์หลัก',
    type: 'Google Drive',
    url: '',
    previewUrl: '',
    access: 'สาธารณะ',
  }
}
const portalTiles = [
  { label: 'คลังสื่อ', detail: 'ไฟล์ เอกสาร วิดีโอ', icon: Archive, view: 'media' as View },
  { label: 'AI Lab', detail: 'Prompt และคู่มือ AI', icon: BrainCircuit, view: 'media' as View },
  { label: 'ห้องอบรม', detail: 'บทเรียนและวิดีโอ', icon: GraduationCap, view: 'media' as View },
  { label: 'VIP Preview', detail: 'ดูสิ่งที่จะปลดล็อก', icon: ShieldCheck, view: 'media' as View },
]

function canViewMedia(user: CurrentUser | null, item: MediaItem) {
  return canViewAccess(user, item.access)
}

function canViewAccess(user: CurrentUser | null, access: AccessLevel) {
  if (user?.role === 'superadmin' || user?.role === 'admin') return true
  if (access === 'สาธารณะ') return true
  if (user?.access === 'VIP') return access !== 'ซื้อแยก'
  if (user?.access === 'สมาชิก') return access === 'สมาชิก'
  return false
}

function canAccessAdmin(user: CurrentUser | null) {
  return user?.role === 'superadmin' || user?.role === 'admin'
}

function trackMediaEvent(mediaId: number, eventType: 'view') {
  void fetch('/api/media/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mediaId, eventType }),
  }).catch(() => undefined)
}

function getPreviewUrl(item: MediaItem) {
  const primaryLink = item.links?.[0]
  const link = primaryLink?.previewUrl || primaryLink?.url || item.previewUrl || item.resourceUrl || ''
  if (!link) return ''

  const source = primaryLink?.type || item.source

  if (source === 'YouTube') {
    const id =
      link.match(/[?&]v=([^&]+)/)?.[1] ||
      link.match(/youtu\.be\/([^?&]+)/)?.[1] ||
      link.match(/youtube\.com\/embed\/([^?&]+)/)?.[1]
    return id ? `https://www.youtube.com/embed/${id}` : link
  }

  if (source === 'Google Drive') {
    const id = link.match(/\/d\/([^/]+)/)?.[1] || link.match(/[?&]id=([^&]+)/)?.[1]
    return id ? `https://drive.google.com/file/d/${id}/preview` : link
  }

  if (source === 'Google Sheet') {
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
  const [view, setView] = useState<View>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset')
      ? 'reset'
      : 'home',
  )
  const [selected, setSelected] = useState<MediaItem>(mediaItems[0])
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('ทั้งหมด')
  const [toast, setToast] = useState('ระบบเชื่อมต่อ Cloudflare + Neon สำเร็จ')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [memberLibrary, setMemberLibrary] = useState<MemberLibrary | null>(null)
  const [memberLibraryLoading, setMemberLibraryLoading] = useState(false)
  const [memberLibraryRefresh, setMemberLibraryRefresh] = useState(0)

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
          fetch(currentUser?.role === 'superadmin' || currentUser?.role === 'admin' ? '/api/media?status=all' : '/api/media'),
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

        const nextMedia = mediaJson.media ?? []
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
        setMediaRecords([])
        setTopicOptions(topics)
        setSiteSettings(defaultSiteSettings)
        setDataStatus('fallback')
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [currentUser?.role, refreshToken])

  useEffect(() => {
    let active = true
    if (!currentUser) {
      return
    }

    async function loadMemberLibrary() {
      setMemberLibraryLoading(true)
      try {
        const response = await fetch('/api/member/library', { credentials: 'include' })
        const result = await readJson<MemberLibrary & { ok?: boolean; error?: string }>(response)
        if (!response.ok) throw new Error(result.error || 'โหลดคลังของฉันไม่สำเร็จ')
        if (active) setMemberLibrary(result)
      } catch {
        if (active) setMemberLibrary(null)
      } finally {
        if (active) setMemberLibraryLoading(false)
      }
    }

    void loadMemberLibrary()
    return () => {
      active = false
    }
  }, [currentUser, memberLibraryRefresh])

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

  const favoriteIds = useMemo(
    () => new Set(memberLibrary?.favorites.map((item) => item.media.id) ?? []),
    [memberLibrary],
  )

  const openDetail = (item: MediaItem) => {
    setSelected(item)
    setView('detail')
    trackMediaEvent(item.id, 'view')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const notifySuccess = (message: string) => {
    setToast(message)
    setShowSuccess(true)
  }

  const toggleFavorite = async (item: MediaItem) => {
    if (!currentUser) {
      setToast('กรุณาเข้าสู่ระบบก่อนบันทึกรายการโปรด')
      setView('login')
      return
    }

    const favorite = !favoriteIds.has(item.id)
    setLoading(true)
    try {
      const response = await fetch('/api/member/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mediaId: item.id, favorite }),
      })
      const result = await readJson<{ ok?: boolean; error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'บันทึกรายการโปรดไม่สำเร็จ')
      setMemberLibraryRefresh((value) => value + 1)
      setToast(favorite ? 'เก็บสื่อไว้ในคลังของฉันแล้ว' : 'นำสื่อออกจากรายการโปรดแล้ว')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'บันทึกรายการโปรดไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (user: CurrentUser) => {
    setCurrentUser(user)
    setToast(`เข้าสู่ระบบแล้ว: ${user.name}`)
    setView(canAccessAdmin(user) ? 'admin' : 'media')
  }

  const logout = () => {
    void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setCurrentUser(null)
    setMemberLibrary(null)
    setToast('ออกจากระบบแล้ว')
    setView('home')
  }

  const showMaintenance =
    siteSettings.maintenanceEnabled && !canAccessAdmin(currentUser)

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
          {showMaintenance && (
            <MaintenanceScreen settings={siteSettings} setView={setView} />
          )}
          {!showMaintenance && (
          <>
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
              currentUser={currentUser}
              isFavorite={favoriteIds.has(selected.id)}
              onBack={() => setView('media')}
              onFavorite={() => void toggleFavorite(selected)}
              onDownloaded={() => {
                setMemberLibraryRefresh((value) => value + 1)
                setToast('เปิดลิงก์สื่อและบันทึกประวัติแล้ว')
              }}
              onError={() => setShowError(true)}
            />
          )}
          {view === 'account' && currentUser && (
            <MemberLibraryPanel
              currentUser={currentUser}
              favoriteIds={favoriteIds}
              library={memberLibrary}
              loading={memberLibraryLoading}
              onLogout={logout}
              onOpenDetail={openDetail}
              onToggleFavorite={(item) => void toggleFavorite(item)}
              onUserUpdated={setCurrentUser}
              setView={setView}
            />
          )}
          {view === 'account' && !currentUser && (
            <LoginPanel onLogin={handleLogin} setView={setView} />
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
          {view === 'forgot' && <ForgotPasswordPanel setView={setView} />}
          {view === 'reset' && (
            <ResetPasswordPanel
              onDone={() => {
                window.history.replaceState({}, '', window.location.pathname)
                setView('login')
              }}
              token={new URLSearchParams(window.location.search).get('reset') ?? ''}
            />
          )}
          {view === 'admin' && canAccessAdmin(currentUser) && currentUser && (
            <AdminPanel
              currentUser={currentUser}
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
          {view === 'admin' && !canAccessAdmin(currentUser) && (
            <LoginPanel onLogin={handleLogin} setView={setView} />
          )}
          </>
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
  const memberNav = currentUser
    ? [...nav, { label: 'คลังของฉัน', value: 'account' as View }]
    : nav
  const visibleNav = canAccessAdmin(currentUser)
    ? [...memberNav, { label: 'หลังบ้าน', value: 'admin' as View }]
    : memberNav

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
              onClick={() => setView('account')}
              type="button"
            >
              <UserCircle2 className="mr-2" size={18} />
              {currentUser.name}
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
          {settings.announcementText && (
            <div className="mb-5 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
              {settings.announcementText}
            </div>
          )}
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

function MaintenanceScreen({
  setView,
  settings,
}: {
  setView: (view: View) => void
  settings: SiteSettings
}) {
  return (
    <section className="mx-auto grid min-h-[64vh] max-w-4xl place-items-center px-4 py-16 text-center sm:px-6">
      <div className="rounded-[2rem] border border-cyan-200/70 bg-white/82 p-8 shadow-2xl shadow-sky-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.07]">
        <img
          alt="MIKPURINUT logo"
          className="mx-auto h-20 w-20 rounded-3xl border border-cyan-200/50 object-cover shadow-xl shadow-cyan-500/10"
          src={LOGO_URL}
        />
        <p className="mt-6 text-sm font-black text-cyan-700 dark:text-cyan-200">MIKPURINUT Maintenance Mode</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl dark:text-white">
          {settings.maintenanceTitle}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-600 dark:text-slate-300">
          {settings.maintenanceMessage}
        </p>
        <button
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-6 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950"
          onClick={() => setView('login')}
          type="button"
        >
          เข้าสู่ระบบผู้ดูแล
        </button>
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
  isFavorite,
  item,
  openDetail,
  onToggleFavorite,
}: {
  isFavorite?: boolean
  item: MediaItem
  openDetail: (item: MediaItem) => void
  onToggleFavorite?: (item: MediaItem) => void
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
        {onToggleFavorite && (
          <button
            aria-label={isFavorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
            className={`absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-xl border border-white/40 shadow-lg backdrop-blur transition hover:scale-105 ${
              isFavorite ? 'bg-rose-500 text-white' : 'bg-white/85 text-slate-700'
            }`}
            onClick={() => onToggleFavorite(item)}
            type="button"
          >
            <Heart className={isFavorite ? 'fill-current' : ''} size={19} />
          </button>
        )}
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
        {item.tags && item.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-100"
                key={tag}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
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

function MemberLibraryPanel({
  currentUser,
  favoriteIds,
  library,
  loading,
  onLogout,
  onOpenDetail,
  onToggleFavorite,
  onUserUpdated,
  setView,
}: {
  currentUser: CurrentUser
  favoriteIds: Set<number>
  library: MemberLibrary | null
  loading: boolean
  onLogout: () => void
  onOpenDetail: (item: MediaItem) => void
  onToggleFavorite: (item: MediaItem) => void
  onUserUpdated: (user: CurrentUser) => void
  setView: (view: View) => void
}) {
  const formatDate = (value?: string) =>
    value
      ? new Intl.DateTimeFormat('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '-'
  const favorites = library?.favorites ?? []
  const history = library?.history ?? []

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-2xl shadow-sky-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06]">
        <div className="grid gap-6 bg-[linear-gradient(125deg,#081427,#0d2941_60%,#0e7490)] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100">
              <BookmarkCheck size={18} />
              Member Library
            </p>
            <h1 className="mt-5 text-3xl font-black sm:text-4xl">คลังของฉัน</h1>
            <p className="mt-3 max-w-2xl font-semibold leading-7 text-sky-100/75">
              รวมสื่อที่บันทึกไว้และประวัติดาวน์โหลดของบัญชีเดียว ค้นของที่เคยใช้ต่อได้ทันที
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-black text-slate-950"
              onClick={() => setView('media')}
              type="button"
            >
              <Search size={19} />
              เลือกดูสื่อเพิ่ม
            </button>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 font-black text-white"
              onClick={onLogout}
              type="button"
            >
              <LogOut size={19} />
              ออกจากระบบ
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-black/20">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950 text-cyan-200 dark:bg-cyan-300 dark:text-slate-950">
                <UserCircle2 size={30} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-black text-slate-950 dark:text-white">
                  {library?.profile.name ?? currentUser.name}
                </p>
                <p className="truncate text-sm font-bold text-slate-500 dark:text-slate-400">
                  {library?.profile.email ?? currentUser.email}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                ['สิทธิ์', currentUser.access],
                ['รายการโปรด', `${favorites.length} รายการ`],
                ['เคยดาวน์โหลด', `${history.length} สื่อ`],
              ].map(([label, value]) => (
                <div
                  className="rounded-2xl bg-slate-100/80 p-4 dark:bg-white/[0.06]"
                  key={label}
                >
                  <p className="text-xs font-black uppercase text-slate-400">{label}</p>
                  <p className="mt-1 font-black text-slate-950 dark:text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white/75 p-5 dark:border-white/10 dark:bg-black/20">
            <h2 className="inline-flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white">
              <Clock3 className="text-cyan-600 dark:text-cyan-300" />
              ดาวน์โหลดล่าสุด
            </h2>
            {loading ? (
              <div className="mt-5 flex min-h-32 items-center justify-center gap-3 font-bold text-slate-500">
                <Loader2 className="animate-spin" />
                กำลังโหลดประวัติ
              </div>
            ) : history.length ? (
              <div className="mt-4 space-y-3">
                {history.slice(0, 4).map((entry) => (
                  <button
                    className="grid min-h-20 w-full grid-cols-[64px_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-2 text-left transition hover:border-cyan-300 dark:border-white/10 dark:bg-white/[0.04]"
                    key={entry.media.id}
                    onClick={() => onOpenDetail(entry.media)}
                    type="button"
                  >
                    <img
                      alt=""
                      className="h-16 w-16 rounded-xl object-cover"
                      src={entry.media.cover}
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 font-black text-slate-950 dark:text-white">
                        {entry.media.title}
                      </span>
                      <span className="mt-1 block text-xs font-bold text-slate-400">
                        {formatDate(entry.lastDownloadedAt)}
                      </span>
                    </span>
                    <span className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">
                      {entry.downloadCount} ครั้ง
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-5 grid min-h-32 place-items-center rounded-2xl border border-dashed border-slate-300 p-5 text-center font-bold text-slate-500 dark:border-white/10">
                ยังไม่มีประวัติดาวน์โหลด
              </div>
            )}
          </div>
        </div>
      </div>

      <AccountSecurity
        currentUser={currentUser}
        onLogout={onLogout}
        onUserUpdated={onUserUpdated}
      />

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black text-cyan-700 dark:text-cyan-200">
            <Heart className="fill-current" size={17} />
            SAVED MEDIA
          </p>
          <h2 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">สื่อที่บันทึกไว้</h2>
        </div>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
          กดหัวใจบนการ์ดเพื่อนำออกจากรายการโปรด
        </p>
      </div>

      {loading ? (
        <div className="mt-6 grid min-h-56 place-items-center rounded-3xl border border-white/70 bg-white/70 font-bold text-slate-500 dark:border-white/10 dark:bg-white/[0.05]">
          <Loader2 className="mb-3 animate-spin text-cyan-500" size={28} />
          กำลังโหลดคลังของฉัน
        </div>
      ) : favorites.length ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {favorites.map(({ media }) => (
            <MediaCard
              isFavorite={favoriteIds.has(media.id)}
              item={media}
              key={media.id}
              onToggleFavorite={onToggleFavorite}
              openDetail={onOpenDetail}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid min-h-56 place-items-center rounded-3xl border border-dashed border-cyan-300 bg-white/65 p-6 text-center dark:border-cyan-300/20 dark:bg-white/[0.04]">
          <div>
            <Heart className="mx-auto text-cyan-500" size={36} />
            <h3 className="mt-4 text-xl font-black text-slate-950 dark:text-white">
              ยังไม่มีสื่อที่บันทึกไว้
            </h3>
            <p className="mt-2 font-semibold text-slate-500 dark:text-slate-400">
              เปิดรายละเอียดสื่อแล้วกด “เก็บไว้ในคลังของฉัน”
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

function AccountSecurity({
  currentUser,
  onLogout,
  onUserUpdated,
}: {
  currentUser: CurrentUser
  onLogout: () => void
  onUserUpdated: (user: CurrentUser) => void
}) {
  const [name, setName] = useState(currentUser.name)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const updateAccount = async (body: Record<string, string>) => {
    setBusy(true)
    setNotice('')
    try {
      const response = await fetch('/api/member/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const result = await readJson<{ user?: CurrentUser; signedOut?: boolean; error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'จัดการบัญชีไม่สำเร็จ')
      if (result.user) onUserUpdated(result.user)
      if (result.signedOut) {
        onLogout()
        return
      }
      setNotice('บันทึกข้อมูลบัญชีเรียบร้อย')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'จัดการบัญชีไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-2">
      <form
        className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
        onSubmit={(event) => {
          event.preventDefault()
          void updateAccount({ action: 'profile', name })
        }}
      >
        <h2 className="text-xl font-black text-slate-950 dark:text-white">ข้อมูลบัญชี</h2>
        <label className="mt-4 block text-sm font-black text-slate-600 dark:text-slate-300">
          ชื่อที่แสดง
          <input className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setName(event.target.value)} value={name} />
        </label>
        <button className="mt-4 min-h-12 rounded-2xl bg-cyan-400 px-5 font-black text-slate-950 disabled:opacity-60" disabled={busy} type="submit">
          บันทึกชื่อ
        </button>
      </form>
      <form
        className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/[0.05]"
        onSubmit={(event) => {
          event.preventDefault()
          void updateAccount({ action: 'password', currentPassword, newPassword })
        }}
      >
        <h2 className="text-xl font-black text-slate-950 dark:text-white">ความปลอดภัย</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setCurrentPassword(event.target.value)} placeholder="รหัสผ่านปัจจุบัน" type="password" value={currentPassword} />
          <input className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setNewPassword(event.target.value)} placeholder="รหัสผ่านใหม่ 10 ตัวขึ้นไป" type="password" value={newPassword} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="min-h-12 rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 disabled:opacity-60 dark:bg-cyan-300 dark:text-slate-950" disabled={busy} type="submit">เปลี่ยนรหัสผ่าน</button>
          <button className="min-h-12 rounded-2xl border border-red-200 px-5 font-black text-red-600 dark:border-red-400/20 dark:text-red-300" onClick={() => void updateAccount({ action: 'logoutAll' })} type="button">ออกจากระบบทุกอุปกรณ์</button>
        </div>
      </form>
      {notice && <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 font-bold text-cyan-900 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100 lg:col-span-2">{notice}</div>}
    </section>
  )
}

function MediaDetail({
  canDownload,
  currentUser,
  isFavorite,
  item,
  onBack,
  onDownloaded,
  onError,
  onFavorite,
}: {
  canDownload: boolean
  currentUser: CurrentUser | null
  isFavorite: boolean
  item: MediaItem
  onBack: () => void
  onDownloaded: () => void
  onError: () => void
  onFavorite: () => void
}) {
  const previewUrl = getPreviewUrl(item)
  const primaryLink = item.links?.find((link) => canViewAccess(currentUser, link.access) && link.url) ?? item.links?.[0]
  const openResource = async (linkId?: number, allowed = canDownload) => {
    if (!allowed) {
      onError()
      return
    }

    try {
      const response = await fetch('/api/media/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mediaId: item.id, linkId }),
      })
      const result = await readJson<{ url?: string; error?: string }>(response)
      if (!response.ok || !result.url) throw new Error(result.error || 'เปิดลิงก์ไม่สำเร็จ')
      window.open(result.url, '_blank', 'noopener,noreferrer')
      onDownloaded()
    } catch {
      onError()
    }
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
            {item.tags?.slice(0, 4).map((tag) => (
              <span
                className="rounded-xl bg-sky-50 px-3 py-1 text-sm font-black text-sky-800 dark:bg-sky-400/10 dark:text-sky-200"
                key={tag}
              >
                #{tag}
              </span>
            ))}
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
              onClick={() => void openResource(primaryLink?.id, canDownload && (!primaryLink || canViewAccess(currentUser, primaryLink.access)))}
              type="button"
            >
              <Download size={20} />
              ดาวน์โหลด / เปิดลิงก์
            </button>
            <button
              className={`inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl px-5 font-black shadow-lg transition ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-slate-950 text-cyan-200 shadow-slate-900/10 dark:bg-cyan-300 dark:text-slate-950'
              }`}
              onClick={onFavorite}
              type="button"
            >
              <Heart className={isFavorite ? 'fill-current' : ''} size={20} />
              {isFavorite ? 'บันทึกในคลังของฉันแล้ว' : 'เก็บไว้ในคลังของฉัน'}
            </button>
          </div>
        </div>
      </div>

      {Boolean(item.links?.length) && (
        <section className="mt-6 rounded-3xl border border-white/70 bg-white/76 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-xl font-black text-slate-950 dark:text-white">ไฟล์และบทเรียนในชุดนี้</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">เลือกเปิดเอกสาร วิดีโอ หรือลิงก์ที่ต้องการได้โดยตรง</p>
            </div>
            <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-800 dark:bg-cyan-300/10 dark:text-cyan-200">
              {item.links?.length ?? 0} รายการ
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {item.links?.map((link, index) => {
              const allowed = canDownload && canViewAccess(currentUser, link.access)
              return (
                <button
                  className={`flex min-h-16 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                    allowed
                      ? 'border-cyan-200 bg-cyan-50 hover:border-cyan-400 hover:bg-cyan-100 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:hover:bg-cyan-300/15'
                      : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400'
                  }`}
                  key={link.id ?? `${link.label}-${index}`}
                  onClick={() => void openResource(link.id, allowed)}
                  type="button"
                >
                  {allowed ? <ExternalLink className="shrink-0 text-cyan-600 dark:text-cyan-300" size={21} /> : <LockKeyhole className="shrink-0" size={21} />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-black text-slate-900 dark:text-white">{link.label}</span>
                    <span className="mt-0.5 block text-xs font-bold">{link.type} · {link.access}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

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
      <ReviewPanel currentUser={currentUser} mediaId={item.id} />
    </section>
  )
}

type MediaReview = { id: number; rating: number; comment: string; name: string; updatedAt: string }

function ReviewPanel({ currentUser, mediaId }: { currentUser: CurrentUser | null; mediaId: number }) {
  const [reviews, setReviews] = useState<MediaReview[]>([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [notice, setNotice] = useState('')
  const refreshReviews = () => {
    void fetch(`/api/media/reviews?mediaId=${mediaId}`)
      .then((response) => readJson<{ reviews?: MediaReview[] }>(response))
      .then((result) => setReviews(result.reviews ?? []))
      .catch(() => setReviews([]))
  }
  useEffect(() => {
    void fetch(`/api/media/reviews?mediaId=${mediaId}`)
      .then((response) => readJson<{ reviews?: MediaReview[] }>(response))
      .then((result) => setReviews(result.reviews ?? []))
      .catch(() => undefined)
  }, [mediaId])

  return (
    <section className="mt-6 rounded-3xl border border-white/70 bg-white/76 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06] sm:p-6">
      <h3 className="flex items-center gap-2 text-xl font-black text-slate-950 dark:text-white"><Star className="fill-amber-400 text-amber-400" /> คะแนนและความคิดเห็น</h3>
      {currentUser ? (
        <form
          className="mt-5 grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault()
            const response = await fetch('/api/media/reviews', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
              body: JSON.stringify({ mediaId, rating, comment }),
            })
            const result = await readJson<{ error?: string }>(response)
            setNotice(response.ok ? 'บันทึกคะแนนแล้ว' : result.error || 'บันทึกไม่สำเร็จ')
            if (response.ok) { setComment(''); refreshReviews() }
          }}
        >
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button aria-label={`${value} ดาว`} className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 dark:bg-amber-300/10" key={value} onClick={() => setRating(value)} type="button">
                <Star className={value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} size={21} />
              </button>
            ))}
          </div>
          <textarea className="min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" maxLength={500} onChange={(event) => setComment(event.target.value)} placeholder="ความคิดเห็นเพิ่มเติม (ไม่บังคับ)" value={comment} />
          <button className="min-h-12 justify-self-start rounded-2xl bg-slate-950 px-5 font-black text-cyan-200 dark:bg-cyan-300 dark:text-slate-950" type="submit">ส่งคะแนน</button>
        </form>
      ) : <p className="mt-4 font-bold text-slate-500 dark:text-slate-400">เข้าสู่ระบบเพื่อให้คะแนนสื่อนี้</p>}
      {notice && <p className="mt-3 text-sm font-bold text-cyan-700 dark:text-cyan-200">{notice}</p>}
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {reviews.map((review) => (
          <article className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.04]" key={review.id}>
            <div className="flex items-center justify-between gap-3"><strong>{review.name}</strong><span className="font-black text-amber-500">{review.rating}/5</span></div>
            {review.comment && <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>}
          </article>
        ))}
        {!reviews.length && <p className="text-sm font-bold text-slate-500">ยังไม่มีความคิดเห็น เป็นคนแรกที่ให้คะแนนได้เลย</p>}
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

function AuthBotCheck({
  botVerified,
  setBotVerified,
  setTurnstileToken,
}: {
  botVerified: boolean
  setBotVerified: (value: boolean) => void
  setTurnstileToken: (value: string) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const [siteKey, setSiteKey] = useState('')

  useEffect(() => {
    void fetch('/api/auth/config')
      .then((response) => response.json() as Promise<{ turnstileSiteKey?: string }>)
      .then((config) => setSiteKey(config.turnstileSiteKey ?? ''))
      .catch(() => setSiteKey(''))
  }, [])

  useEffect(() => {
    if (!siteKey || !container.current) return
    const render = () => {
      if (!window.turnstile || !container.current || container.current.childElementCount) return
      window.turnstile.render(container.current, {
        sitekey: siteKey,
        callback: (token) => {
          setTurnstileToken(token)
          setBotVerified(true)
        },
        'expired-callback': () => {
          setTurnstileToken('')
          setBotVerified(false)
        },
      })
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-mik-turnstile]')
    if (existing) {
      existing.addEventListener('load', render)
      render()
      return () => existing.removeEventListener('load', render)
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.mikTurnstile = 'true'
    script.addEventListener('load', render)
    document.head.appendChild(script)
    return () => script.removeEventListener('load', render)
  }, [setBotVerified, setTurnstileToken, siteKey])

  if (siteKey) return <div className="mt-4 flex min-h-16 items-center justify-center" ref={container} />
  return (
    <label className="mt-4 flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200">
      <input checked={botVerified} className="h-4 w-4" onChange={(event) => setBotVerified(event.target.checked)} type="checkbox" />
      ฉันไม่ใช่โปรแกรมอัตโนมัติ
    </label>
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
  const [turnstileToken, setTurnstileToken] = useState('')
  const [botTrap, setBotTrap] = useState('')
  const [botStartedAt] = useState(() => Date.now())
  const [socialLogin, setSocialLogin] = useState({ googleEnabled: false, facebookEnabled: false })

  useEffect(() => {
    void fetch('/api/auth/config')
      .then((response) => response.json() as Promise<{ googleEnabled?: boolean; facebookEnabled?: boolean }>)
      .then((config) => setSocialLogin({
        googleEnabled: Boolean(config.googleEnabled),
        facebookEnabled: Boolean(config.facebookEnabled),
      }))
      .catch(() => undefined)
  }, [])

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
          turnstileToken,
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
          <button className="text-blue-600 hover:text-blue-700" onClick={() => setView('forgot')} type="button">
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
        <AuthBotCheck botVerified={botVerified} setBotVerified={setBotVerified} setTurnstileToken={setTurnstileToken} />

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

        {(socialLogin.googleEnabled || socialLogin.facebookEnabled) && <div className="my-8 flex items-center gap-3 text-xs font-black text-slate-400">
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          หรือเข้าสู่ระบบด้วย
          <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        </div>}

        {(socialLogin.googleEnabled || socialLogin.facebookEnabled) && <div className="grid gap-3 sm:grid-cols-2">
          {socialLogin.googleEnabled && (
          <button
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 font-black text-white shadow-lg shadow-red-500/20"
            onClick={() => { window.location.href = '/api/auth/google' }}
            type="button"
          >
            <span className="text-xl">G</span>
            Google
          </button>
          )}
          {socialLogin.facebookEnabled && (
          <button
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 font-black text-white shadow-lg shadow-blue-700/20"
            onClick={() => { window.location.href = '/api/auth/facebook' }}
            type="button"
          >
            <span className="text-xl">f</span>
            Facebook
          </button>
          )}
        </div>}

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

function ForgotPasswordPanel({ setView }: { setView: (view: View) => void }) {
  const [email, setEmail] = useState('')
  const [botVerified, setBotVerified] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [message, setMessage] = useState('')
  const [startedAt] = useState(() => Date.now())
  return (
    <AuthActionPanel title="ลืมรหัสผ่าน" detail="ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลที่ลงทะเบียน">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, botVerified, botStartedAt: startedAt, turnstileToken, website: '' }),
          })
          const result = await readJson<{ message?: string; error?: string }>(response)
          setMessage(result.message || result.error || 'ส่งคำขอแล้ว')
        }}
      >
        <input className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setEmail(event.target.value)} placeholder="อีเมลของคุณ" type="email" value={email} />
        <AuthBotCheck botVerified={botVerified} setBotVerified={setBotVerified} setTurnstileToken={setTurnstileToken} />
        {message && <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100">{message}</p>}
        <button className="mt-5 min-h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-slate-950" type="submit">ส่งลิงก์ตั้งรหัสผ่านใหม่</button>
        <button className="mt-3 min-h-12 w-full font-black text-blue-600" onClick={() => setView('login')} type="button">กลับไปเข้าสู่ระบบ</button>
      </form>
    </AuthActionPanel>
  )
}

function ResetPasswordPanel({ onDone, token }: { onDone: () => void; token: string }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  return (
    <AuthActionPanel title="ตั้งรหัสผ่านใหม่" detail="ตั้งรหัสผ่านใหม่อย่างน้อย 10 ตัวอักษร และไม่ใช้รหัสเดิมซ้ำ">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          if (password !== confirm) return setMessage('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
          const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
          })
          const result = await readJson<{ ok?: boolean; error?: string }>(response)
          if (!response.ok) return setMessage(result.error || 'ตั้งรหัสผ่านไม่สำเร็จ')
          onDone()
        }}
      >
        <div className="grid gap-3">
          <input className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setPassword(event.target.value)} placeholder="รหัสผ่านใหม่" type="password" value={password} />
          <input className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" onChange={(event) => setConfirm(event.target.value)} placeholder="ยืนยันรหัสผ่านใหม่" type="password" value={confirm} />
        </div>
        {message && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 dark:bg-red-400/10 dark:text-red-200">{message}</p>}
        <button className="mt-5 min-h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-slate-950" type="submit">บันทึกรหัสผ่านใหม่</button>
      </form>
    </AuthActionPanel>
  )
}

function AuthActionPanel({ children, detail, title }: { children: ReactNode; detail: string; title: string }) {
  return (
    <section className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-12">
      <div className="w-full rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 sm:p-8">
        <img alt="MIKPURINUT" className="h-16 w-16 rounded-2xl object-cover" src={LOGO_URL} />
        <h1 className="mt-5 text-3xl font-black text-slate-950 dark:text-white">{title}</h1>
        <p className="mb-6 mt-2 font-semibold leading-7 text-slate-500 dark:text-slate-400">{detail}</p>
        {children}
      </div>
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
  const [turnstileToken, setTurnstileToken] = useState('')
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
          turnstileToken,
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

        <div className="mx-auto max-w-xs">
          <AuthBotCheck botVerified={botVerified} setBotVerified={setBotVerified} setTurnstileToken={setTurnstileToken} />
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
  currentUser,
  mediaItems,
  onCreated,
  onSettingsSaved,
  settings,
  topics,
}: {
  currentUser: CurrentUser
  mediaItems: MediaItem[]
  onCreated: () => void
  onSettingsSaved: (settings: SiteSettings) => void
  settings: SiteSettings
  topics: string[]
}) {
  const [form, setForm] = useState<MediaFormState>(() =>
    createEmptyMediaForm(topics[0]),
  )
  const [adminSection, setAdminSection] = useState<AdminSection>('dashboard')
  const [adminToken, setAdminToken] = useState('')
  const [adminMediaQuery, setAdminMediaQuery] = useState('')
  const [adminMediaAccess, setAdminMediaAccess] = useState<AccessLevel | 'ทั้งหมด'>('ทั้งหมด')
  const [adminMediaStatus, setAdminMediaStatus] = useState<MediaStatus | 'ทั้งหมด'>('ทั้งหมด')
  const [adminMediaTopic, setAdminMediaTopic] = useState('ทั้งหมด')
  const [adminMediaTagQuery, setAdminMediaTagQuery] = useState('')
  const [adminMediaDate, setAdminMediaDate] = useState<AdminDateFilter>('ทั้งหมด')
  const [adminMediaSort, setAdminMediaSort] = useState<AdminMediaSort>('ล่าสุด')
  const [filterNow] = useState(() => Date.now())
  const [newTopicName, setNewTopicName] = useState('')
  const [editingTopic, setEditingTopic] = useState<{ original: string; name: string } | null>(null)
  const [settingsForm, setSettingsForm] = useState({
    ...settings,
    vipPrice: String(settings.vipPrice),
  })
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [memberQuery, setMemberQuery] = useState('')
  const [memberPage, setMemberPage] = useState(1)
  const [memberTotal, setMemberTotal] = useState(0)
  const [vipRequests, setVipRequests] = useState<VipRequest[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null)
  const [linkChecks, setLinkChecks] = useState<LinkCheckResult[]>([])
  const [restoreText, setRestoreText] = useState('')
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge')
  const [restoreReplaceTables, setRestoreReplaceTables] = useState<string[]>([])
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null)
  const [activityQuery, setActivityQuery] = useState('')
  const [activityDate, setActivityDate] = useState<AdminDateFilter>('ทั้งหมด')
  const [activityAction, setActivityAction] = useState('ทั้งหมด')
  const [activityTarget, setActivityTarget] = useState('ทั้งหมด')
  const [errorQuery, setErrorQuery] = useState('')
  const [errorDate, setErrorDate] = useState<AdminDateFilter>('ทั้งหมด')
  const [errorSeverity, setErrorSeverity] = useState<'ทั้งหมด' | 'Auth' | 'Bot' | 'API' | 'Telegram'>('ทั้งหมด')
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [loadingOps, setLoadingOps] = useState(false)
  const [error, setError] = useState('')
  const [settingsError, setSettingsError] = useState('')
  const [settingsNotice, setSettingsNotice] = useState('')
  const [memberError, setMemberError] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [opsError, setOpsError] = useState('')
  const isSuperAdmin = currentUser.role === 'superadmin'

  const pendingVipRequests = vipRequests.filter((request) => request.status === 'pending')
  const linkedMedia = mediaItems.filter((item) => item.resourceUrl || item.previewUrl || item.links?.some((link) => link.url || link.previewUrl))
  const publishedMediaCount = mediaItems.filter((item) => normalizeMediaStatus(item.status) === 'เผยแพร่แล้ว').length
  const tagStats = Array.from(
    mediaItems.reduce((map, item) => {
      item.tags?.forEach((tag) => map.set(tag, (map.get(tag) ?? 0) + 1))
      return map
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th'))
  const adminFilteredMedia = [...mediaItems].filter((item) => {
    const linkText = item.links?.map((link) => `${link.label} ${link.type} ${link.url}`).join(' ') ?? ''
    const tagText = item.tags?.join(' ') ?? ''
    const text = `${item.title} ${item.topic} ${item.description} ${linkText} ${tagText}`.toLowerCase()
    const matchQuery = text.includes(adminMediaQuery.trim().toLowerCase())
    const matchTag = !adminMediaTagQuery.trim() || text.includes(adminMediaTagQuery.trim().toLowerCase())
    const matchTopic = adminMediaTopic === 'ทั้งหมด' || item.topic === adminMediaTopic
    const matchAccess = adminMediaAccess === 'ทั้งหมด' || item.access === adminMediaAccess
    const matchStatus = adminMediaStatus === 'ทั้งหมด' || normalizeMediaStatus(item.status) === adminMediaStatus
    const createdAt = item.createdAt ? Date.parse(item.createdAt) : 0
    const ageDays = createdAt ? (filterNow - createdAt) / 86400000 : Number.POSITIVE_INFINITY
    const matchDate =
      adminMediaDate === 'ทั้งหมด' ||
      (adminMediaDate === 'วันนี้' && ageDays <= 1) ||
      (adminMediaDate === '7 วัน' && ageDays <= 7) ||
      (adminMediaDate === '30 วัน' && ageDays <= 30)
    return matchQuery && matchTag && matchTopic && matchAccess && matchStatus && matchDate
  }).sort((a, b) => {
    if (adminMediaSort === 'ดาวน์โหลดมากสุด') return b.downloads - a.downloads
    if (adminMediaSort === 'เข้าชมมากสุด') return b.views - a.views
    if (adminMediaSort === 'ชื่อ A-Z') return a.title.localeCompare(b.title, 'th')
    return Date.parse(b.updatedAt ?? b.createdAt ?? '') - Date.parse(a.updatedAt ?? a.createdAt ?? '')
  })
  const topDownloadedMedia = [...mediaItems]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5)
  const categoryStats = topics
    .map((topic) => ({
      topic,
      count: mediaItems.filter((item) => item.topic === topic).length,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxDownloads = Math.max(1, ...(analytics?.topDownloads.length ? analytics.topDownloads.map((item) => item.value) : topDownloadedMedia.map((item) => item.downloads)))
  const maxCategoryCount = Math.max(1, ...categoryStats.map((item) => item.count))
  const downloadConversion = analytics?.engagement.views30d
    ? (analytics.engagement.downloads30d / analytics.engagement.views30d) * 100
    : 0
  const vipMemberRate = analytics?.engagement.activeUsers
    ? (analytics.engagement.vipUsers / analytics.engagement.activeUsers) * 100
    : 0
  const unreadNotifications = notifications.filter((notice) => !notice.readAt).length
  const activityActions = Array.from(new Set(auditLogs.map((log) => log.action).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th'))
  const activityTargets = Array.from(new Set(auditLogs.map((log) => log.targetType).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th'))
  const filteredAuditLogs = auditLogs.filter((log) => {
    const query = activityQuery.trim().toLowerCase()
    const createdAt = Date.parse(log.createdAt)
    const ageDays = Number.isFinite(createdAt) ? (filterNow - createdAt) / 86400000 : Number.POSITIVE_INFINITY
    const matchDate =
      activityDate === 'ทั้งหมด' ||
      (activityDate === 'วันนี้' && ageDays <= 1) ||
      (activityDate === '7 วัน' && ageDays <= 7) ||
      (activityDate === '30 วัน' && ageDays <= 30)
    const matchQuery =
      !query ||
      `${log.actor} ${log.action} ${log.targetType} ${log.targetId ?? ''}`.toLowerCase().includes(query)
    const matchAction = activityAction === 'ทั้งหมด' || log.action === activityAction
    const matchTarget = activityTarget === 'ทั้งหมด' || log.targetType === activityTarget
    return matchDate && matchQuery && matchAction && matchTarget
  })
  const filteredErrorLogs = errorLogs.filter((log) => {
    const query = errorQuery.trim().toLowerCase()
    const createdAt = Date.parse(log.createdAt)
    const ageDays = Number.isFinite(createdAt) ? (filterNow - createdAt) / 86400000 : Number.POSITIVE_INFINITY
    const text = `${log.source} ${log.message}`.toLowerCase()
    const matchDate =
      errorDate === 'ทั้งหมด' ||
      (errorDate === 'วันนี้' && ageDays <= 1) ||
      (errorDate === '7 วัน' && ageDays <= 7) ||
      (errorDate === '30 วัน' && ageDays <= 30)
    const matchSeverity =
      errorSeverity === 'ทั้งหมด' ||
      (errorSeverity === 'Auth' && text.includes('auth')) ||
      (errorSeverity === 'Bot' && text.includes('bot')) ||
      (errorSeverity === 'API' && (text.includes('api') || text.includes('database') || text.includes('media'))) ||
      (errorSeverity === 'Telegram' && text.includes('telegram'))
    const matchQuery = !query || text.includes(query)
    return matchDate && matchSeverity && matchQuery
  })
  const allAdminMenu: Array<{ id: AdminSection; label: string; icon: typeof BarChart3; detail: string; ownerOnly?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, detail: 'ภาพรวมระบบ' },
    { id: 'media', label: 'จัดการสื่อ', icon: Layers3, detail: 'เพิ่ม แก้ไข ลบ' },
    { id: 'members', label: 'สมาชิกและ VIP', icon: Users, detail: `${pendingVipRequests.length} รอตรวจ`, ownerOnly: true },
    { id: 'taxonomy', label: 'หมวดหมู่และแท็ก', icon: Tag, detail: `${topics.length} หมวด / ${tagStats.length} แท็ก` },
    { id: 'links', label: 'ลิงก์ภายนอก', icon: Link2, detail: `${linkedMedia.length} ลิงก์` },
    { id: 'activity', label: 'Activity Log', icon: FileText, detail: `${auditLogs.length} รายการ`, ownerOnly: true },
    { id: 'health', label: 'System Health', icon: Gauge, detail: systemHealth ? `${systemHealth.responseTimeMs} ms` : 'ตรวจระบบ' },
    { id: 'backup', label: 'Backup', icon: Database, detail: 'JSON / CSV', ownerOnly: true },
    { id: 'errors', label: 'Error Log', icon: AlertCircle, detail: `${errorLogs.length} รายการ`, ownerOnly: true },
    { id: 'settings', label: 'ตั้งค่าเว็บ', icon: Settings, detail: 'หน้าแรกและ VIP', ownerOnly: true },
  ]
  const adminMenu = allAdminMenu.filter((item) => isSuperAdmin || !item.ownerOnly)
  const adminMetrics = [
    { label: 'สมาชิกทั้งหมด', value: memberTotal.toLocaleString('th-TH'), icon: Users },
    { label: 'สื่อเผยแพร่', value: publishedMediaCount.toLocaleString('th-TH'), icon: Layers3 },
    {
      label: 'ดาวน์โหลดรวม',
      value: mediaItems.reduce((sum, item) => sum + item.downloads, 0).toLocaleString('th-TH'),
      icon: Download,
    },
    { label: 'แจ้งเตือนใหม่', value: unreadNotifications.toLocaleString('th-TH'), icon: AlertCircle },
  ]
  const restoreTableOptions = [
    ['media', 'สื่อ'],
    ['mediaLinks', 'ลิงก์สื่อ'],
    ['mediaEvents', 'Event สื่อ'],
    ['mediaReviews', 'รีวิวสื่อ'],
    ['userFavorites', 'รายการโปรดสมาชิก'],
    ['tags', 'แท็ก'],
    ['mediaTags', 'แท็กของสื่อ'],
    ['categories', 'หมวดหมู่'],
    ['vipRequests', 'คำขอ VIP'],
    ['notifications', 'แจ้งเตือน'],
    ['settings', 'Settings'],
  ] as const

  const loadMembers = async (page = memberPage, query = memberQuery) => {
    setLoadingMembers(true)
    setMemberError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' })
      if (query.trim()) params.set('query', query.trim())
      const response = await fetch(`/api/admin/users?${params}`, { credentials: 'include' })
      const result = await readJson<{
        users?: AdminUser[]
        vipRequests?: VipRequest[]
        total?: number
        page?: number
        error?: string
      }>(response)

      if (!response.ok) throw new Error(result.error ?? 'โหลดข้อมูลสมาชิกไม่สำเร็จ')
      setAdminUsers(result.users ?? [])
      setVipRequests(result.vipRequests ?? [])
      setMemberTotal(result.total ?? 0)
      setMemberPage(result.page ?? page)
    } catch (loadError) {
      setMemberError(
        loadError instanceof Error ? loadError.message : 'โหลดข้อมูลสมาชิกไม่สำเร็จ',
      )
    } finally {
      setLoadingMembers(false)
    }
  }

  const formatAdminDate = (value?: string | null) =>
    value
      ? new Intl.DateTimeFormat('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(value))
      : '-'

  const loadNotifications = async () => {
    const response = await fetch('/api/admin/notifications', { credentials: 'include' })
    const result = await readJson<{ notifications?: AdminNotification[]; error?: string }>(response)
    if (!response.ok) throw new Error(result.error ?? 'โหลด Notification Center ไม่สำเร็จ')
    setNotifications(result.notifications ?? [])
  }

  const loadAnalytics = async () => {
    const response = await fetch('/api/admin/analytics', { credentials: 'include' })
    const result = await readJson<{ analytics?: AdminAnalytics; error?: string }>(response)
    if (!response.ok) throw new Error(result.error ?? 'โหลด Analytics ไม่สำเร็จ')
    setAnalytics(result.analytics ?? null)
  }

  const loadOpsData = async () => {
    setLoadingOps(true)
    setOpsError('')
    try {
      const [healthResponse] = await Promise.all([
        fetch('/api/admin/health', { credentials: 'include' }),
        loadNotifications(),
        loadAnalytics(),
      ])
      const health = await readJson<{ health?: SystemHealth; error?: string }>(healthResponse)
      if (!healthResponse.ok) throw new Error(health.error ?? 'โหลด System Health ไม่สำเร็จ')

      if (isSuperAdmin) {
        const [activityResponse, errorsResponse, telegramResponse] = await Promise.all([
          fetch('/api/admin/activity', { credentials: 'include' }),
          fetch('/api/admin/errors', { credentials: 'include' }),
          fetch('/api/admin/telegram', { credentials: 'include' }),
        ])
        const [activity, errors, telegram] = await Promise.all([
          readJson<{ logs?: AuditLog[]; error?: string }>(activityResponse),
          readJson<{ logs?: ErrorLog[]; error?: string }>(errorsResponse),
          readJson<{ telegram?: TelegramStatus; error?: string }>(telegramResponse),
        ])
        if (!activityResponse.ok) throw new Error(activity.error ?? 'โหลด Activity Log ไม่สำเร็จ')
        if (!errorsResponse.ok) throw new Error(errors.error ?? 'โหลด Error Log ไม่สำเร็จ')
        if (!telegramResponse.ok) throw new Error(telegram.error ?? 'โหลดสถานะ Telegram ไม่สำเร็จ')
        setAuditLogs(activity.logs ?? [])
        setErrorLogs(errors.logs ?? [])
        setTelegramStatus(telegram.telegram ?? null)
      } else {
        setAuditLogs([])
        setErrorLogs([])
        setTelegramStatus(null)
      }
      setSystemHealth(health.health ?? null)
    } catch (opsLoadError) {
      setOpsError(opsLoadError instanceof Error ? opsLoadError.message : 'โหลดข้อมูลหลังบ้านไม่สำเร็จ')
    } finally {
      setLoadingOps(false)
    }
  }

  const jumpFromNotification = (notice: AdminNotification) => {
    if (notice.targetType === 'vip_request' && isSuperAdmin) setAdminSection('members')
    else if (notice.targetType === 'media') setAdminSection('media')
    else if (notice.targetType === 'media_links') setAdminSection('links')
    else if (notice.targetType === 'error_logs' && isSuperAdmin) setAdminSection('errors')
    else if (notice.targetType === 'app_settings' && isSuperAdmin) setAdminSection('settings')
  }

  const submitNotificationAction = async (payload: { action: 'mark-read' | 'mark-unread' | 'mark-all-read'; id?: number }) => {
    setOpsError('')
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'อัปเดตแจ้งเตือนไม่สำเร็จ')
      await loadNotifications()
    } catch (notificationError) {
      setOpsError(notificationError instanceof Error ? notificationError.message : 'อัปเดตแจ้งเตือนไม่สำเร็จ')
    }
  }

  const clearOldErrors = async () => {
    if (!window.confirm('ลบ Error Log ที่เก่ากว่า 30 วันใช่ไหม? ข้อมูลใหม่จะยังอยู่')) return
    setOpsError('')
    try {
      const response = await fetch('/api/admin/errors?days=30', {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await readJson<{ deleted?: number; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'ลบ Error Log ไม่สำเร็จ')
      await loadOpsData()
    } catch (clearError) {
      setOpsError(clearError instanceof Error ? clearError.message : 'ลบ Error Log ไม่สำเร็จ')
    }
  }

  const runLinkCheck = async () => {
    setLoadingOps(true)
    setOpsError('')
    try {
      const response = await fetch('/api/admin/link-checks', {
        method: 'POST',
        credentials: 'include',
      })
      const result = await readJson<{ results?: LinkCheckResult[]; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'ตรวจสุขภาพลิงก์ไม่สำเร็จ')
      setLinkChecks(result.results ?? [])
      await loadOpsData()
    } catch (linkError) {
      setOpsError(linkError instanceof Error ? linkError.message : 'ตรวจสุขภาพลิงก์ไม่สำเร็จ')
    } finally {
      setLoadingOps(false)
    }
  }

  const downloadBackup = async (format: 'json' | 'csv', table = 'media') => {
    setLoadingOps(true)
    setOpsError('')
    try {
      const query = format === 'json' ? '?format=json' : `?format=csv&table=${encodeURIComponent(table)}`
      const response = await fetch(`/api/admin/backup${query}`, { credentials: 'include' })
      if (!response.ok) {
        const result = await readJson<{ error?: string }>(response)
        throw new Error(result.error ?? 'ดาวน์โหลดสำรองข้อมูลไม่สำเร็จ')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mikpurinut-backup-${format === 'json' ? 'full.json' : `${table}.csv`}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      await loadOpsData()
    } catch (backupError) {
      setOpsError(backupError instanceof Error ? backupError.message : 'ดาวน์โหลดสำรองข้อมูลไม่สำเร็จ')
    } finally {
      setLoadingOps(false)
    }
  }

  const downloadCsv = (filename: string, rows: Array<Record<string, unknown>>) => {
    const columns = Object.keys(rows[0] ?? { empty: '' })
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const csv = [columns.join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const readRestoreBackup = () => {
    try {
      return JSON.parse(restoreText) as Record<string, unknown>
    } catch {
      throw new Error('ไฟล์ backup ต้องเป็น JSON ที่ถูกต้อง')
    }
  }

  const previewRestore = async () => {
    setLoadingOps(true)
    setOpsError('')
    try {
      const backup = readRestoreBackup()
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'preview',
          backup,
          mode: restoreMode,
          replaceTables: restoreMode === 'replace' ? restoreReplaceTables : [],
        }),
      })
      const result = await readJson<{ preview?: RestorePreview; error?: string }>(response)
      if (!response.ok || !result.preview) throw new Error(result.error ?? 'Preview restore ไม่สำเร็จ')
      setRestorePreview(result.preview)
    } catch (restoreError) {
      setRestorePreview(null)
      setOpsError(restoreError instanceof Error ? restoreError.message : 'Preview restore ไม่สำเร็จ')
    } finally {
      setLoadingOps(false)
    }
  }

  const commitRestore = async () => {
    if (!restorePreview) {
      setOpsError('กรุณา preview ไฟล์ backup ก่อนนำเข้า')
      return
    }
    if (restoreMode === 'replace' && restoreReplaceTables.length === 0) {
      setOpsError('โหมด replace ต้องเลือกตารางที่ต้องการล้างก่อน')
      return
    }
    const confirmText =
      restoreMode === 'replace'
        ? `ยืนยันนำเข้าแบบ replace ใช่ไหม? ระบบจะล้างเฉพาะ: ${restoreReplaceTables.join(', ')}`
        : 'ยืนยันนำเข้า backup แบบ merge ใช่ไหม? ระบบจะไม่ลบข้อมูลเดิม'
    if (!window.confirm(confirmText)) return
    setLoadingOps(true)
    setOpsError('')
    try {
      const backup = readRestoreBackup()
      const response = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'commit',
          confirm: true,
          backup,
          mode: restoreMode,
          replaceTables: restoreMode === 'replace' ? restoreReplaceTables : [],
        }),
      })
      const result = await readJson<{ restored?: RestorePreview; error?: string }>(response)
      if (!response.ok || !result.restored) throw new Error(result.error ?? 'Restore ไม่สำเร็จ')
      setRestorePreview(result.restored)
      await Promise.all([onCreated(), loadMembers(), loadOpsData()])
    } catch (restoreError) {
      setOpsError(restoreError instanceof Error ? restoreError.message : 'Restore ไม่สำเร็จ')
    } finally {
      setLoadingOps(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      if (isSuperAdmin) void loadMembers()
      void loadOpsData()
    })
    // Initial admin data load only; later refreshes are triggered by explicit actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCategoryError('')
    const name = newTopicName.trim()
    if (!name) return

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      const result = await readJson<{ error?: string }>(response)

      if (!response.ok) throw new Error(result.error ?? 'เพิ่มหมวดหมู่ไม่สำเร็จ')
      setNewTopicName('')
      onCreated()
    } catch (categorySaveError) {
      setCategoryError(
        categorySaveError instanceof Error ? categorySaveError.message : 'เพิ่มหมวดหมู่ไม่สำเร็จ',
      )
    }
  }

  const deleteCategory = async (name: string) => {
    if (!window.confirm(`ลบหมวดหมู่ "${name}" ใช่ไหม? ระบบจะไม่อนุญาตหากยังมีสื่ออยู่ในหมวดนี้`)) return
    setCategoryError('')
    try {
      const response = await fetch(`/api/categories?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await readJson<{ error?: string }>(response)

      if (!response.ok) throw new Error(result.error ?? 'ลบหมวดหมู่ไม่สำเร็จ')
      onCreated()
    } catch (categoryDeleteError) {
      setCategoryError(
        categoryDeleteError instanceof Error ? categoryDeleteError.message : 'ลบหมวดหมู่ไม่สำเร็จ',
      )
    }
  }

  const updateCategory = async (
    payload: { action: 'rename'; name: string; newName: string } | { action: 'move'; name: string; direction: 'up' | 'down' },
  ) => {
    setCategoryError('')
    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const result = await readJson<{ error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'แก้ไขหมวดหมู่ไม่สำเร็จ')
      setEditingTopic(null)
      onCreated()
    } catch (categoryUpdateError) {
      setCategoryError(
        categoryUpdateError instanceof Error ? categoryUpdateError.message : 'แก้ไขหมวดหมู่ไม่สำเร็จ',
      )
    }
  }

  const updateForm = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const updateMediaLink = (index: number, key: keyof MediaLink, value: string) => {
    setForm((current) => ({
      ...current,
      links: current.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [key]: value } : link,
      ),
    }))
  }

  const addMediaLink = () => {
    setForm((current) => ({
      ...current,
      links: [...current.links, { ...createEmptyMediaLink(), access: current.access }],
    }))
  }

  const removeMediaLink = (index: number) => {
    setForm((current) => ({
      ...current,
      links: current.links.length > 1 ? current.links.filter((_, linkIndex) => linkIndex !== index) : current.links,
    }))
  }

  const startEditMedia = (item: MediaItem) => {
    setAdminSection('media')
    setEditingMediaId(item.id)
    setForm({
      title: item.title,
      topic: item.topic,
      access: item.access,
      status: normalizeMediaStatus(item.status),
      price: String(item.price ?? 0),
      source: item.source,
      cover: item.cover,
      resourceUrl: item.resourceUrl ?? '',
      previewUrl: item.previewUrl ?? '',
      links: item.links?.length
        ? item.links.map((link) => ({
            label: link.label || 'ไฟล์หลัก',
            type: link.type,
            url: link.url,
            previewUrl: link.previewUrl ?? '',
            access: link.access ?? item.access,
          }))
        : [
            {
              label: 'ไฟล์หลัก',
              type: item.source,
              url: item.resourceUrl ?? '',
              previewUrl: item.previewUrl ?? '',
              access: item.access,
            },
          ],
      tags: item.tags?.join(', ') ?? '',
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
      const cleanLinks = form.links
        .map((link) => ({
          ...link,
          label: link.label.trim() || 'ไฟล์หลัก',
          url: link.url.trim(),
          previewUrl: link.previewUrl.trim(),
        }))
        .filter((link) => link.url || link.previewUrl)
      const primaryLink = cleanLinks[0]
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
          source: primaryLink?.type ?? form.source,
          resourceUrl: primaryLink?.url ?? form.resourceUrl,
          previewUrl: primaryLink?.previewUrl ?? form.previewUrl,
          links: cleanLinks.length ? cleanLinks : form.links,
          tags: form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean),
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
    setSettingsNotice('')
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
      setSettingsNotice('บันทึกการตั้งค่าเรียบร้อยแล้ว')
    } catch (saveError) {
      setSettingsError(
        saveError instanceof Error ? saveError.message : 'บันทึกการตั้งค่าไม่สำเร็จ',
      )
    } finally {
      setSavingSettings(false)
    }
  }

  const testTelegram = async () => {
    setSettingsError('')
    setSettingsNotice('')
    setLoadingOps(true)
    try {
      const response = await fetch('/api/admin/telegram', {
        method: 'POST',
        credentials: 'include',
      })
      const result = await readJson<{ telegram?: TelegramStatus; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'ส่งข้อความทดสอบ Telegram ไม่สำเร็จ')
      setTelegramStatus(result.telegram ?? null)
      setSettingsNotice('ส่งข้อความทดสอบ Telegram สำเร็จแล้ว')
      await loadOpsData()
    } catch (telegramError) {
      setSettingsError(
        telegramError instanceof Error ? telegramError.message : 'ส่งข้อความทดสอบ Telegram ไม่สำเร็จ',
      )
    } finally {
      setLoadingOps(false)
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
              MIKPURINUT Media Command Center
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-slate-400">
              ศูนย์ควบคุมคลังสื่อ สิทธิ์สมาชิก VIP และข้อความหน้าเว็บ ใช้ตรวจงาน อนุมัติสื่อ และดูแลระบบจากพื้นที่เดียว
            </p>
          </div>
          <a
            onClick={() => setAdminSection('media')}
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
            {adminMenu.map((item) => {
              const MenuIcon = item.icon
              const isActive = adminSection === item.id
              return (
                <button
                  className={`mb-1 flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition ${
                    isActive
                      ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/15'
                      : 'text-slate-300 hover:bg-cyan-300/10 hover:text-cyan-100'
                  }`}
                  key={item.id}
                  onClick={() => setAdminSection(item.id)}
                  type="button"
                >
                  <MenuIcon size={19} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{item.label}</span>
                    <span className={`block truncate text-xs ${isActive ? 'text-slate-700' : 'text-slate-500'}`}>
                      {item.detail}
                    </span>
                  </span>
                </button>
              )
            })}
          </aside>

          <div className="grid gap-6">
          {adminSection === 'dashboard' && (
            <section className="rounded-2xl border border-cyan-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
              <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm font-black text-cyan-200">งานที่ควรดูวันนี้</p>
                  <h3 className="mt-2 text-2xl font-black">ศูนย์ควบคุมระบบสื่อ</h3>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {adminMenu.slice(1).map((item) => (
                      <button
                        className="flex min-h-20 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40"
                        key={item.id}
                        onClick={() => setAdminSection(item.id)}
                        type="button"
                      >
                        <item.icon className="text-cyan-300" size={22} />
                        <span>
                          <span className="block font-black text-white">{item.label}</span>
                          <span className="text-sm font-semibold text-slate-400">{item.detail}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-sm font-black text-cyan-200">สถานะระบบ</p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-emerald-300/10 p-4">
                      <p className="font-black text-emerald-200">ฐานข้อมูลพร้อมใช้งาน</p>
                      <p className="text-sm font-semibold text-slate-400">Neon เชื่อมต่อกับ Cloudflare แล้ว</p>
                    </div>
                    <div className="rounded-2xl bg-sky-300/10 p-4">
                      <p className="font-black text-sky-200">จัดการสื่อผ่านเว็บได้แล้ว</p>
                      <p className="text-sm font-semibold text-slate-400">เพิ่ม แก้ไข ลบ และแปะลิงก์สื่อได้โดยไม่แก้โค้ด</p>
                    </div>
                    <div className="rounded-2xl bg-amber-300/10 p-4">
                      <p className="font-black text-amber-200">คำขอ VIP</p>
                      <p className="text-sm font-semibold text-slate-400">{pendingVipRequests.length} รายการรอตรวจ</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['เข้าชม 30 วัน', analytics?.engagement.views30d ?? 0, 'text-sky-200'],
                  ['ดาวน์โหลด 30 วัน', analytics?.engagement.downloads30d ?? 0, 'text-cyan-200'],
                  ['เข้าชม → ดาวน์โหลด', `${downloadConversion.toFixed(1)}%`, 'text-emerald-200'],
                  ['สมาชิก VIP', `${vipMemberRate.toFixed(1)}%`, 'text-amber-200'],
                ].map(([label, value, tone]) => (
                  <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={label as string}>
                    <p className="text-sm font-bold text-slate-400">{label as string}</p>
                    <p className={`mt-2 text-2xl font-black ${tone as string}`}>
                      {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <AnalyticsBreakdown points={analytics?.accessBreakdown ?? []} title="สัดส่วนสิทธิ์สื่อ" tone="cyan" />
                <AnalyticsBreakdown points={analytics?.statusBreakdown ?? []} title="สถานะ Workflow สื่อ" tone="emerald" />
                <AnalyticsBreakdown points={analytics?.sourceBreakdown ?? []} title="แหล่งสื่อที่ใช้งาน" tone="violet" />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <AnalyticsBars
                  color="cyan"
                  points={analytics?.downloadsDaily ?? []}
                  title="ดาวน์โหลดรายวัน 14 วัน"
                />
                <AnalyticsBars
                  color="sky"
                  points={analytics?.viewsDaily ?? []}
                  title="การเข้าชมรายวัน 14 วัน"
                />
                <AnalyticsBars
                  color="emerald"
                  points={analytics?.membersMonthly ?? []}
                  title="สมาชิกใหม่รายเดือน"
                />
                <AnalyticsBars
                  color="amber"
                  points={analytics?.vipWeekly ?? []}
                  title="คำขอ VIP รายสัปดาห์"
                />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="mb-4 font-black text-white">สื่อยอดดาวน์โหลดจริง 10 อันดับ</p>
                  <div className="grid gap-3">
                    {(analytics?.topDownloads.length ? analytics.topDownloads : topDownloadedMedia.map((item) => ({ label: item.title, value: item.downloads }))).map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-bold text-slate-200">{item.label}</span>
                          <span className="font-black text-cyan-200">{item.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400"
                            style={{ width: `${Math.max(8, (item.value / maxDownloads) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="mb-4 font-black text-white">หมวดหมู่ที่มีสื่อมากสุด</p>
                  <div className="grid gap-3">
                    {categoryStats.length === 0 && (
                      <p className="text-sm font-bold text-slate-500">ยังไม่มีข้อมูลหมวดหมู่</p>
                    )}
                    {categoryStats.map((item) => (
                      <div key={item.topic}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                          <span className="truncate font-bold text-slate-200">{item.topic}</span>
                          <span className="font-black text-emerald-200">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-cyan-300"
                            style={{ width: `${Math.max(8, (item.count / maxCategoryCount) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-black text-white">Notification Center</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {unreadNotifications.toLocaleString('th-TH')} รายการยังไม่อ่าน
                      </p>
                    </div>
                    <button
                      className="min-h-10 rounded-xl bg-white/10 px-3 text-xs font-black text-cyan-100 disabled:opacity-40"
                      disabled={unreadNotifications === 0}
                      onClick={() => void submitNotificationAction({ action: 'mark-all-read' })}
                      type="button"
                    >
                      อ่านทั้งหมดแล้ว
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {notifications.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm font-bold text-slate-400">
                        ตอนนี้ไม่มีแจ้งเตือนสำคัญ
                      </div>
                    )}
                    {notifications.slice(0, 8).map((notice) => (
                      <article
                        className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                          notice.readAt ? 'opacity-55' : ''
                        } ${
                          notice.tone === 'red'
                            ? 'border-red-300/15 bg-red-400/10 text-red-100'
                            : notice.tone === 'amber'
                              ? 'border-amber-300/15 bg-amber-300/10 text-amber-100'
                              : notice.tone === 'emerald'
                                ? 'border-emerald-300/15 bg-emerald-300/10 text-emerald-100'
                                : 'border-sky-300/15 bg-sky-300/10 text-sky-100'
                        }`}
                        key={notice.id}
                      >
                        <button
                          className="block w-full text-left"
                          onClick={() => jumpFromNotification(notice)}
                          type="button"
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className="font-black">{notice.title}</span>
                            {!notice.readAt && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />}
                          </span>
                          <span className="mt-1 block text-sm font-semibold opacity-75">{notice.detail}</span>
                          <span className="mt-2 block text-xs font-bold opacity-55">{formatAdminDate(notice.createdAt)}</span>
                        </button>
                        <div className="mt-3 flex justify-end">
                          <button
                            className="rounded-lg bg-black/20 px-3 py-2 text-xs font-black"
                            onClick={() =>
                              void submitNotificationAction({
                                action: notice.readAt ? 'mark-unread' : 'mark-read',
                                id: notice.id,
                              })
                            }
                            type="button"
                          >
                            {notice.readAt ? 'ทำเป็นยังไม่อ่าน' : 'อ่านแล้ว'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {adminSection === 'members' && (
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
                onClick={() => void loadMembers()}
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
                <div className="mb-3 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-white">สมาชิกทั้งหมด</p>
                    <span className="text-xs font-bold text-slate-400">
                      {memberTotal.toLocaleString('th-TH')} บัญชี
                    </span>
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      void loadMembers(1, memberQuery)
                    }}
                  >
                    <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3">
                      <Search size={17} className="text-cyan-300" />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
                        onChange={(event) => setMemberQuery(event.target.value)}
                        placeholder="ค้นหาชื่อหรืออีเมล"
                        value={memberQuery}
                      />
                    </label>
                    <button className="min-h-11 rounded-xl bg-cyan-300 px-4 font-black text-slate-950" type="submit">
                      ค้นหา
                    </button>
                  </form>
                </div>
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
                            className="min-h-10 rounded-xl bg-violet-300/10 px-3 text-sm font-black text-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={loadingMembers || isSuperAdmin}
                            onClick={() =>
                              submitMemberAction({
                                action: 'set-role',
                                userId: user.id,
                                role: user.role === 'admin' ? 'member' : 'admin',
                              })
                            }
                            type="button"
                          >
                            {user.role === 'admin' ? 'ลดเป็นสมาชิกทั่วไป' : 'ตั้งเป็น Admin'}
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
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <button
                    className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:opacity-35"
                    disabled={loadingMembers || memberPage <= 1}
                    onClick={() => void loadMembers(memberPage - 1, memberQuery)}
                    type="button"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="text-xs font-bold text-slate-400">
                    หน้า {memberPage.toLocaleString('th-TH')} / {Math.max(1, Math.ceil(memberTotal / 50)).toLocaleString('th-TH')}
                  </span>
                  <button
                    className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:opacity-35"
                    disabled={loadingMembers || memberPage * 50 >= memberTotal}
                    onClick={() => void loadMembers(memberPage + 1, memberQuery)}
                    type="button"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            </div>
          </section>
          )}

          {adminSection === 'settings' && (
          <>
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
              <label className="md:col-span-2">
                <span className="text-sm font-black text-slate-200">ข้อความประกาศหน้าแรก</span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
                  onChange={(event) => updateSettings('announcementText', event.target.value)}
                  placeholder="เช่น เปิดรับสื่ออบรมรุ่นใหม่ หรือแจ้งข่าวสำคัญ"
                  value={settingsForm.announcementText}
                />
              </label>
              <div className="md:col-span-2 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                <label className="inline-flex min-h-11 items-center gap-3 font-black text-amber-100">
                  <input
                    checked={settingsForm.maintenanceEnabled}
                    onChange={(event) => updateSettings('maintenanceEnabled', event.target.checked)}
                    type="checkbox"
                  />
                  เปิดโหมดปิดปรับปรุงระบบสำหรับผู้ใช้ทั่วไป
                </label>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <AdminField
                    label="หัวข้อหน้าปิดปรับปรุง"
                    name="maintenanceTitle"
                    onChange={updateSettings}
                    placeholder="ระบบกำลังปรับปรุง"
                    value={settingsForm.maintenanceTitle}
                  />
                  <AdminField
                    label="ข้อความหน้าปิดปรับปรุง"
                    name="maintenanceMessage"
                    onChange={updateSettings}
                    placeholder="กรุณากลับมาใหม่ภายหลัง"
                    value={settingsForm.maintenanceMessage}
                  />
                </div>
              </div>
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

          <section className="rounded-2xl border border-violet-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <Mail className="text-violet-300" size={22} />
                  Telegram Notification
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  ตรวจสถานะและส่งข้อความทดสอบ โดยไม่แสดง token หรือ chat id จริงบนหน้าเว็บ
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 font-black text-white disabled:opacity-60"
                  disabled={loadingOps}
                  onClick={loadOpsData}
                  type="button"
                >
                  {loadingOps ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                  รีเฟรช
                </button>
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-violet-300 px-4 font-black text-slate-950 disabled:opacity-60"
                  disabled={loadingOps || !telegramStatus?.ready}
                  onClick={testTelegram}
                  type="button"
                >
                  {loadingOps ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                  ส่งทดสอบ
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Bot Token', telegramStatus?.botTokenConfigured],
                ['Chat ID', telegramStatus?.chatIdConfigured],
                ['พร้อมแจ้งเตือน', telegramStatus?.ready],
              ].map(([label, enabled]) => (
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={label as string}>
                  <p className="text-sm font-bold text-slate-400">{label as string}</p>
                  <p className={`mt-2 text-lg font-black ${enabled ? 'text-emerald-200' : 'text-amber-200'}`}>
                    {telegramStatus ? (enabled ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า') : 'รอโหลดสถานะ'}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold leading-6 text-slate-300">
              ตั้งค่าใน Cloudflare เป็น Secret ชื่อ <code className="font-black text-violet-100">TELEGRAM_BOT_TOKEN</code> และ{' '}
              <code className="font-black text-violet-100">TELEGRAM_CHAT_ID</code> แล้วกดรีเฟรช/ส่งทดสอบได้ทันที
            </div>
            {settingsNotice && (
              <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-bold text-emerald-100">
                {settingsNotice}
              </div>
            )}
            {settingsError && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {settingsError}
              </div>
            )}
          </section>
          </>
          )}

          {adminSection === 'taxonomy' && (
          <section className="rounded-2xl border border-violet-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-xl font-black">
                <Tag className="text-violet-300" size={22} />
                หมวดหมู่และแท็ก
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                เพิ่มหมวดหลักสำหรับการ์ดสื่อ และดูแท็กจริงที่ผูกกับสื่อจากช่องแท็กในหน้าจัดการสื่อ
              </p>
            </div>
            <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={submitCategory}>
              <input
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-violet-300 focus:ring-4 focus:ring-violet-300/10"
                onChange={(event) => setNewTopicName(event.target.value)}
                placeholder="เช่น AI สำหรับครู, งานทะเบียน, คู่มืออบรม"
                value={newTopicName}
              />
              <button className="min-h-12 rounded-2xl bg-violet-300 px-5 font-black text-slate-950" type="submit">
                เพิ่มหมวด
              </button>
            </form>
            {categoryError && (
              <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {categoryError}
              </div>
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topics.map((topicName, topicIndex) => {
                const count = mediaItems.filter((item) => item.topic === topicName).length
                return (
                  <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={topicName}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {editingTopic?.original === topicName ? (
                          <input
                            autoFocus
                            className="min-h-10 w-full rounded-xl border border-violet-300/30 bg-black/30 px-3 font-bold text-white outline-none focus:border-violet-300"
                            maxLength={80}
                            onChange={(event) => setEditingTopic({ ...editingTopic, name: event.target.value })}
                            value={editingTopic.name}
                          />
                        ) : (
                          <p className="truncate font-black text-white">{topicName}</p>
                        )}
                        <p className="mt-1 text-sm font-semibold text-slate-400">{count} สื่อในหมวดนี้</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          aria-label={`เลื่อน ${topicName} ขึ้น`}
                          className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-300 disabled:opacity-30"
                          disabled={topicIndex === 0}
                          onClick={() => updateCategory({ action: 'move', name: topicName, direction: 'up' })}
                          type="button"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          aria-label={`เลื่อน ${topicName} ลง`}
                          className="grid size-10 place-items-center rounded-xl bg-white/5 text-slate-300 disabled:opacity-30"
                          disabled={topicIndex === topics.length - 1}
                          onClick={() => updateCategory({ action: 'move', name: topicName, direction: 'down' })}
                          type="button"
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                      {editingTopic?.original === topicName ? (
                        <>
                          <button
                            className="min-h-10 rounded-xl bg-violet-300 px-4 text-sm font-black text-slate-950"
                            onClick={() => updateCategory({ action: 'rename', name: topicName, newName: editingTopic.name })}
                            type="button"
                          >
                            บันทึกชื่อ
                          </button>
                          <button className="min-h-10 rounded-xl bg-white/5 px-4 text-sm font-black text-slate-300" onClick={() => setEditingTopic(null)} type="button">
                            ยกเลิก
                          </button>
                        </>
                      ) : (
                        <button
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-300/10 px-4 text-sm font-black text-violet-200"
                          onClick={() => setEditingTopic({ original: topicName, name: topicName })}
                          type="button"
                        >
                          <Pencil size={15} />
                          เปลี่ยนชื่อ
                        </button>
                      )}
                      {count === 0 && editingTopic?.original !== topicName && (
                        <button
                          className="min-h-10 rounded-xl bg-red-400/10 px-4 text-sm font-black text-red-200"
                          onClick={() => deleteCategory(topicName)}
                          type="button"
                        >
                          ลบหมวด
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-sky-300/20 bg-black/20 p-4">
              <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="font-black text-sky-100">แท็กที่ใช้งานจริง</p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    ระบบดึงจาก media_tags โดยอัตโนมัติเมื่อบันทึกสื่อ ไม่ต้องสร้างแท็กซ้ำด้วยมือ
                  </p>
                </div>
                <span className="rounded-xl bg-sky-300/10 px-3 py-1 text-sm font-black text-sky-200">
                  {tagStats.length.toLocaleString('th-TH')} แท็ก
                </span>
              </div>
              {tagStats.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm font-bold text-slate-400">
                  ยังไม่มีแท็ก เพิ่มแท็กจากฟอร์มสื่อ เช่น AI, อบรม, โรงเรียน
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tagStats.map(([tag, count]) => (
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-sm font-black text-sky-100"
                      key={tag}
                    >
                      #{tag}
                      <span className="rounded-full bg-black/30 px-2 py-0.5 text-xs text-sky-200">
                        {count.toLocaleString('th-TH')}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
          )}

          {adminSection === 'links' && (
          <section className="rounded-2xl border border-cyan-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-xl font-black">
                <Link2 className="text-cyan-300" size={22} />
                ลิงก์ภายนอก
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                รวมสื่อที่เชื่อม Google Drive, Google Sheet, YouTube หรือเว็บภายนอก กดแก้ไขเพื่อเปลี่ยนลิงก์ได้ทันที
              </p>
            </div>
            <div className="grid gap-3">
              {linkedMedia.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                  ยังไม่มีสื่อที่แปะลิงก์ภายนอก
                </div>
              )}
              {linkedMedia.map((item) => (
                <article className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto]" key={item.id}>
                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{item.title}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-400">{item.source} · {item.resourceUrl || item.previewUrl}</p>
                  </div>
                  <button
                    className="min-h-11 rounded-xl bg-cyan-300 px-4 font-black text-slate-950"
                    onClick={() => startEditMedia(item)}
                    type="button"
                  >
                    แก้ไขลิงก์
                  </button>
                </article>
              ))}
            </div>
          </section>
          )}

          {adminSection === 'links' && (
          <section className="rounded-2xl border border-cyan-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <Gauge className="text-cyan-300" size={22} />
                  ตรวจสุขภาพลิงก์
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  ตรวจว่า Drive, Sheet, YouTube และลิงก์ภายนอกยังเปิดได้หรือไม่
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 font-black text-slate-950 disabled:opacity-60"
                disabled={loadingOps}
                onClick={runLinkCheck}
                type="button"
              >
                {loadingOps ? <Loader2 className="animate-spin" size={18} /> : <Link2 size={18} />}
                ตรวจลิงก์ตอนนี้
              </button>
            </div>
            {opsError && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {opsError}
              </div>
            )}
            <div className="grid gap-3">
              {linkChecks.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                  ยังไม่มีผลตรวจล่าสุด กดปุ่มตรวจลิงก์เพื่อเริ่มตรวจสุขภาพลิงก์ทั้งหมด
                </div>
              )}
              {linkChecks.map((result) => (
                <article className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-[1fr_auto]" key={`${result.mediaId}-${result.linkId}-${result.url}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-black text-white">{result.mediaTitle}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ${
                          result.status === 'ok'
                            ? 'bg-emerald-300/15 text-emerald-200'
                            : result.status === 'warning'
                              ? 'bg-amber-300/15 text-amber-200'
                              : 'bg-red-400/15 text-red-200'
                        }`}
                      >
                        {result.status === 'ok' ? 'ปกติ' : result.status === 'warning' ? 'ควรตรวจ' : 'มีปัญหา'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-slate-400">
                      {result.label} · {result.type} · {result.message}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{result.url}</p>
                  </div>
                  <a
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-4 font-black text-cyan-100"
                    href={result.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    เปิดดู
                    <ExternalLink size={16} />
                  </a>
                </article>
              ))}
            </div>
          </section>
          )}

          {adminSection === 'health' && (
          <section className="rounded-2xl border border-emerald-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <Gauge className="text-emerald-300" size={22} />
                  System Health
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  ดูสถานะ Cloudflare, Neon, API, Error ล่าสุด และข้อมูลสำรองล่าสุด
                </p>
              </div>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 font-black text-slate-950 disabled:opacity-60"
                disabled={loadingOps}
                onClick={loadOpsData}
                type="button"
              >
                {loadingOps ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                รีเฟรชสถานะ
              </button>
            </div>
            {opsError && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {opsError}
              </div>
            )}
            {!systemHealth ? (
              <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                กำลังรอข้อมูลสถานะระบบ
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ['Cloudflare', systemHealth.cloudflare],
                  ['Neon Database', systemHealth.neon],
                  ['API', systemHealth.api],
                  ['Storage', systemHealth.storage],
                  ['Response Time', `${systemHealth.responseTimeMs} ms`],
                  ['Last Backup', formatAdminDate(systemHealth.lastBackupAt)],
                  ['Last Link Check', formatAdminDate(systemHealth.lastLinkCheckAt)],
                  ['สื่อทั้งหมด', systemHealth.counts.media.toLocaleString('th-TH')],
                  ['Error 24 ชม.', systemHealth.counts.errors24h.toLocaleString('th-TH')],
                  ['แจ้งเตือนยังไม่อ่าน', (systemHealth.counts.unreadNotifications ?? unreadNotifications).toLocaleString('th-TH')],
                  ['การป้องกันคำขอที่กำลังบล็อก', (systemHealth.counts.activeRateLimits ?? 0).toLocaleString('th-TH')],
                ].map(([label, value]) => (
                  <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={label}>
                    <p className="text-sm font-bold text-slate-400">{label}</p>
                    <p className="mt-2 break-words text-xl font-black text-white">{value}</p>
                  </article>
                ))}
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2 xl:col-span-4">
                  <p className="text-sm font-bold text-slate-400">Error ล่าสุด</p>
                  <p className="mt-2 text-base font-black text-white">
                    {systemHealth.lastError
                      ? `${systemHealth.lastError.source}: ${systemHealth.lastError.message}`
                      : 'ยังไม่พบ error ล่าสุด'}
                  </p>
                  {systemHealth.lastError && (
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatAdminDate(systemHealth.lastError.createdAt)}
                    </p>
                  )}
                </article>
                <article className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-4 md:col-span-2">
                  <p className="text-sm font-bold text-cyan-100">ตั้งค่า Cron ตรวจลิงก์อัตโนมัติ</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                    ตั้ง `CRON_SECRET` ใน Cloudflare Variables and Secrets แล้วให้ scheduler เรียก endpoint นี้ตามรอบที่ต้องการ
                  </p>
                  <code className="mt-3 block overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs font-bold text-cyan-100">
                    POST /api/cron/link-checks
                  </code>
                  <p className="mt-3 text-xs font-bold leading-5 text-slate-400">
                    ส่ง header เป็น `Authorization: Bearer ...` หรือ `x-cron-secret` ระบบจะไม่แสดงค่า secret บนหน้าเว็บ
                  </p>
                </article>
                <article className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4 md:col-span-2">
                  <p className="text-sm font-bold text-violet-100">Telegram แจ้งเตือนแบบปลอดภัย</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
                    หากต้องการแจ้งเตือนคำขอ VIP หรือลิงก์เสีย ให้ตั้งค่า env ด้านล่างใน Cloudflare โดยไม่ต้องแก้โค้ด
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'].map((name) => (
                      <code className="rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-xs font-bold text-violet-100" key={name}>
                        {name}
                      </code>
                    ))}
                  </div>
                  <p className="mt-3 text-xs font-bold leading-5 text-slate-400">
                    แนะนำให้เก็บ token เป็น Secret เสมอ และไม่วางค่าจริงไว้ในหน้าเว็บหรือ GitHub
                  </p>
                </article>
              </div>
            )}
          </section>
          )}

          {adminSection === 'activity' && (
          <section className="rounded-2xl border border-sky-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <FileText className="text-sky-300" size={22} />
                  Activity Log
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  บันทึกว่าใครทำอะไรกับระบบ เพื่อไล่ตรวจย้อนหลังได้เร็วขึ้น
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-11 rounded-2xl bg-white/10 px-4 font-black text-white" onClick={() => downloadCsv('activity-log.csv', filteredAuditLogs)} type="button">
                  Export CSV
                </button>
                <button className="min-h-11 rounded-2xl bg-sky-300 px-4 font-black text-slate-950" onClick={loadOpsData} type="button">
                  รีเฟรช
                </button>
              </div>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_170px_180px_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/24 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
                  onChange={(event) => setActivityQuery(event.target.value)}
                  placeholder="ค้นหา actor, action, target"
                  value={activityQuery}
                />
              </label>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
                onChange={(event) => setActivityDate(event.target.value as AdminDateFilter)}
                value={activityDate}
              >
                {(['ทั้งหมด', 'วันนี้', '7 วัน', '30 วัน'] as const).map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
                onChange={(event) => setActivityAction(event.target.value)}
                value={activityAction}
              >
                {['ทั้งหมด', ...activityActions].map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-300/10"
                onChange={(event) => setActivityTarget(event.target.value)}
                value={activityTarget}
              >
                {['ทั้งหมด', ...activityTargets].map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3">
              {filteredAuditLogs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                  ไม่พบ Activity Log ตามเงื่อนไข
                </div>
              )}
              {filteredAuditLogs.map((log) => (
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={log.id}>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="font-black text-white">{log.action}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-400">
                        {log.actor} · {log.targetType}{log.targetId ? ` #${log.targetId}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-slate-500">{formatAdminDate(log.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
          )}

          {adminSection === 'errors' && (
          <section className="rounded-2xl border border-red-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <AlertCircle className="text-red-300" size={22} />
                  Error Log
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  รวม API error, database error และเหตุการณ์ที่ควรตรวจแก้
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="min-h-11 rounded-2xl bg-white/10 px-4 font-black text-white" onClick={() => downloadCsv('error-log.csv', filteredErrorLogs)} type="button">
                  Export CSV
                </button>
                <button className="min-h-11 rounded-2xl bg-red-400/15 px-4 font-black text-red-100" onClick={clearOldErrors} type="button">
                  ลบเก่ากว่า 30 วัน
                </button>
                <button className="min-h-11 rounded-2xl bg-red-300 px-4 font-black text-slate-950" onClick={loadOpsData} type="button">
                  รีเฟรช
                </button>
              </div>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/24 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-red-300 focus:ring-4 focus:ring-red-300/10"
                  onChange={(event) => setErrorQuery(event.target.value)}
                  placeholder="ค้นหา source หรือข้อความ error"
                  value={errorQuery}
                />
              </label>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-red-300 focus:ring-4 focus:ring-red-300/10"
                onChange={(event) => setErrorDate(event.target.value as AdminDateFilter)}
                value={errorDate}
              >
                {(['ทั้งหมด', 'วันนี้', '7 วัน', '30 วัน'] as const).map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-red-300 focus:ring-4 focus:ring-red-300/10"
                onChange={(event) => setErrorSeverity(event.target.value as typeof errorSeverity)}
                value={errorSeverity}
              >
                {(['ทั้งหมด', 'Auth', 'Bot', 'API', 'Telegram'] as const).map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-3">
              {filteredErrorLogs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                  ไม่พบ Error Log ตามเงื่อนไข
                </div>
              )}
              {filteredErrorLogs.map((log) => (
                <article className="rounded-2xl border border-red-300/10 bg-red-400/10 p-4" key={log.id}>
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="font-black text-red-100">{log.source}</p>
                      <p className="mt-1 break-words text-sm font-semibold text-red-100/80">{log.message}</p>
                    </div>
                    <span className="text-sm font-bold text-red-100/60">{formatAdminDate(log.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
          )}

          {adminSection === 'backup' && (
          <section className="rounded-2xl border border-violet-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4">
              <h3 className="flex items-center gap-2 text-xl font-black">
                <Database className="text-violet-300" size={22} />
                Backup Export
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                สำรองข้อมูลเป็น JSON เต็มระบบ หรือ CSV แยกตาราง สำหรับตรวจสอบและย้ายข้อมูลในอนาคต
              </p>
            </div>
            {opsError && (
              <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-bold text-red-200">
                {opsError}
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <button
                className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-violet-300 px-5 font-black text-slate-950 disabled:opacity-60"
                disabled={loadingOps}
                onClick={() => downloadBackup('json')}
                type="button"
              >
                <Archive size={20} />
                ดาวน์โหลด JSON ทั้งระบบ
              </button>
              {['media', 'media_links', 'media_events', 'media_reviews', 'user_favorites', 'tags', 'media_tags', 'categories', 'users', 'vip_requests', 'notifications', 'app_settings'].map((table) => (
                <button
                  className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-5 font-black text-white disabled:opacity-60"
                  disabled={loadingOps}
                  key={table}
                  onClick={() => downloadBackup('csv', table)}
                  type="button"
                >
                  <Download size={18} />
                  CSV: {table}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
              Export เหมาะสำหรับสำรองข้อมูลก่อนแก้ชุดใหญ่ หรือย้ายระบบไปเครื่อง/บัญชีใหม่
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-black/20 p-4">
              <div className="mb-4">
                <h4 className="text-lg font-black text-white">Restore Import แบบปลอดภัย</h4>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  นำเข้าไฟล์ JSON จาก backup แบบ merge ไม่ลบข้อมูลเดิม และต้อง preview ก่อนยืนยันทุกครั้ง
                </p>
              </div>
              <div className="grid gap-3">
                <input
                  accept="application/json,.json"
                  className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-bold text-slate-200 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-300 file:px-4 file:py-2 file:font-black file:text-slate-950"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setRestoreText(await file.text())
                    setRestorePreview(null)
                    setOpsError('')
                  }}
                  type="file"
                />
                <textarea
                  className="min-h-36 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/10"
                  onChange={(event) => {
                    setRestoreText(event.target.value)
                    setRestorePreview(null)
                  }}
                  placeholder="วาง JSON backup ที่ export จากระบบนี้"
                  value={restoreText}
                />
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 font-black text-white">โหมดนำเข้า</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(['merge', 'replace'] as const).map((mode) => (
                      <button
                        className={`min-h-12 rounded-2xl border px-4 font-black transition disabled:cursor-not-allowed disabled:opacity-45 ${
                          restoreMode === mode
                            ? 'border-emerald-300 bg-emerald-300 text-slate-950'
                            : 'border-white/10 bg-white/[0.04] text-slate-200'
                        }`}
                        key={mode}
                        onClick={() => {
                          if (mode === 'merge') {
                            setRestoreMode(mode)
                            setRestorePreview(null)
                          }
                        }}
                        disabled={mode === 'replace'}
                        type="button"
                      >
                        {mode === 'merge' ? 'Merge ไม่ลบข้อมูลเดิม' : 'Replace ปิดเพื่อป้องกันข้อมูลหาย'}
                      </button>
                    ))}
                  </div>
                  {restoreMode === 'replace' && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-bold text-amber-100">
                        เลือกเฉพาะตารางที่จะล้างก่อนนำเข้า ผู้ใช้จะไม่ถูกล้างเพื่อความปลอดภัย
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {restoreTableOptions.map(([value, label]) => (
                          <label
                            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-slate-200"
                            key={value}
                          >
                            <input
                              checked={restoreReplaceTables.includes(value)}
                              onChange={(event) => {
                                setRestorePreview(null)
                                setRestoreReplaceTables((items) =>
                                  event.target.checked
                                    ? [...items, value]
                                    : items.filter((item) => item !== value),
                                )
                              }}
                              type="checkbox"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 font-black text-slate-950 disabled:opacity-60"
                    disabled={loadingOps || !restoreText.trim()}
                    onClick={previewRestore}
                    type="button"
                  >
                    {loadingOps ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />}
                    Preview Restore
                  </button>
                  <button
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 font-black text-slate-950 disabled:opacity-50"
                    disabled={loadingOps || !restorePreview}
                    onClick={commitRestore}
                    type="button"
                  >
                    <Archive size={18} />
                    ยืนยันนำเข้าแบบ Merge
                  </button>
                </div>
                {restorePreview && (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
                    <p className="font-black text-emerald-100">Preview ล่าสุด</p>
                    <p className="mt-1 text-sm font-bold text-emerald-100/75">
                      โหมด: {restorePreview.mode === 'replace' ? `Replace (${restorePreview.replaceTables?.join(', ') || '-'})` : 'Merge'}
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        ['หมวดหมู่', restorePreview.categories],
                        ['สื่อ', restorePreview.media],
                        ['ลิงก์สื่อ', restorePreview.mediaLinks],
                        ['Event สื่อ', restorePreview.mediaEvents],
                        ['รีวิวสื่อ', restorePreview.mediaReviews],
                        ['รายการโปรดสมาชิก', restorePreview.userFavorites],
                        ['แท็ก', restorePreview.tags],
                        ['แท็กของสื่อ', restorePreview.mediaTags],
                        ['ผู้ใช้', restorePreview.users],
                        ['คำขอ VIP', restorePreview.vipRequests],
                        ['แจ้งเตือน', restorePreview.notifications],
                        ['Settings', restorePreview.settings],
                      ].map(([label, value]) => (
                        <div className="rounded-xl bg-black/20 p-3" key={label}>
                          <p className="text-xs font-bold text-slate-400">{label}</p>
                          <p className="text-2xl font-black text-white">{Number(value).toLocaleString('th-TH')}</p>
                        </div>
                      ))}
                    </div>
                    {typeof restorePreview.skippedUsers === 'number' && restorePreview.skippedUsers > 0 && (
                      <p className="mt-3 rounded-xl bg-amber-300/10 p-3 text-sm font-bold text-amber-100">
                        ข้ามผู้ใช้ใหม่ {restorePreview.skippedUsers} รายการ เพราะไม่มี password hash ใน backup
                      </p>
                    )}
                    <ul className="mt-3 grid gap-2 text-sm font-semibold text-emerald-100/80">
                      {restorePreview.warnings.map((warning) => (
                        <li key={warning}>- {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
          )}

          {adminSection === 'media' && (
          <>
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
                label="แท็ก"
                name="tags"
                onChange={updateForm}
                placeholder="AI, อบรม, โรงเรียน"
                value={form.tags}
              />
              <div className="md:col-span-2">
                <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-black text-slate-200">ชุดลิงก์ไฟล์และวิดีโอ</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      เพิ่ม Drive, Sheet, YouTube หรือ preview ได้หลายรายการในสื่อเดียว
                    </p>
                  </div>
                  <button
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-cyan-300/10 px-4 text-sm font-black text-cyan-200 ring-1 ring-cyan-300/20 transition hover:bg-cyan-300/20"
                    onClick={addMediaLink}
                    type="button"
                  >
                    <Plus size={16} />
                    เพิ่มลิงก์
                  </button>
                </div>
                <div className="grid gap-3">
                  {form.links.map((link, index) => (
                    <div
                      className="rounded-2xl border border-white/10 bg-black/20 p-3 ring-1 ring-white/[0.03]"
                      key={`${index}-${link.type}`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                          ลิงก์ที่ {index + 1}
                        </span>
                        {form.links.length > 1 && (
                          <button
                            className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-red-400/10 px-3 text-xs font-black text-red-200"
                            onClick={() => removeMediaLink(index)}
                            type="button"
                          >
                            <Trash2 size={14} />
                            ลบ
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 lg:grid-cols-[1fr_160px_160px]">
                        <label>
                          <span className="text-xs font-black text-slate-300">ชื่อปุ่ม/ไฟล์</span>
                          <input
                            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                            onChange={(event) => updateMediaLink(index, 'label', event.target.value)}
                            placeholder="เช่น ดาวน์โหลดไฟล์, ดูวิดีโอสอนใช้"
                            value={link.label}
                          />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-300">ชนิดลิงก์</span>
                          <select
                            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                            onChange={(event) => updateMediaLink(index, 'type', event.target.value)}
                            value={link.type}
                          >
                            {sourceOptions.map((option) => (
                              <option className="bg-slate-950" key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-300">สิทธิ์ลิงก์</span>
                          <select
                            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                            onChange={(event) => updateMediaLink(index, 'access', event.target.value)}
                            value={link.access}
                          >
                            {accessOptions.map((option) => (
                              <option className="bg-slate-950" key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="lg:col-span-2">
                          <span className="text-xs font-black text-slate-300">URL ไฟล์/วิดีโอ</span>
                          <input
                            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                            onChange={(event) => updateMediaLink(index, 'url', event.target.value)}
                            placeholder="Google Drive / Google Sheet / YouTube / External URL"
                            value={link.url}
                          />
                        </label>
                        <label>
                          <span className="text-xs font-black text-slate-300">Preview URL</span>
                          <input
                            className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-black/24 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                            onChange={(event) => updateMediaLink(index, 'previewUrl', event.target.value)}
                            placeholder="ปล่อยว่างได้"
                            value={link.previewUrl}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              <div>
                <h3 className="text-xl font-black">รายการสื่อ</h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  ค้นหาและกรองสื่อก่อนแก้ไขหรือลบ
                </p>
              </div>
              <span className="rounded-xl bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">
                {adminFilteredMedia.length.toLocaleString('th-TH')} รายการ
              </span>
            </div>

            <div className="mb-4 grid gap-3 lg:grid-cols-[1.35fr_0.85fr_180px_180px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/24 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  onChange={(event) => setAdminMediaQuery(event.target.value)}
                  placeholder="ค้นหาชื่อสื่อ หมวดหมู่ หรือคำอธิบาย"
                  value={adminMediaQuery}
                />
              </label>
              <label className="relative">
                <Tag className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  className="min-h-12 w-full rounded-2xl border border-white/10 bg-black/24 pl-11 pr-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  onChange={(event) => setAdminMediaTagQuery(event.target.value)}
                  placeholder="แท็กหรือคำค้นเฉพาะ"
                  value={adminMediaTagQuery}
                />
              </label>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                onChange={(event) => setAdminMediaTopic(event.target.value)}
                value={adminMediaTopic}
              >
                {['ทั้งหมด', ...topics.filter((topic) => topic !== 'ทั้งหมด')].map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                onChange={(event) => setAdminMediaAccess(event.target.value as AccessLevel | 'ทั้งหมด')}
                value={adminMediaAccess}
              >
                {['ทั้งหมด', ...accessOptions].map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                onChange={(event) => setAdminMediaDate(event.target.value as AdminDateFilter)}
                value={adminMediaDate}
              >
                {(['ทั้งหมด', 'วันนี้', '7 วัน', '30 วัน'] as const).map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                onChange={(event) => setAdminMediaStatus(event.target.value as MediaStatus | 'ทั้งหมด')}
                value={adminMediaStatus}
              >
                {['ทั้งหมด', ...statusOptions].map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
              <select
                className="min-h-12 rounded-2xl border border-white/10 bg-black/24 px-4 text-base font-bold text-white outline-none focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10 lg:col-span-2"
                onChange={(event) => setAdminMediaSort(event.target.value as AdminMediaSort)}
                value={adminMediaSort}
              >
                {(['ล่าสุด', 'ดาวน์โหลดมากสุด', 'เข้าชมมากสุด', 'ชื่อ A-Z'] as const).map((item) => (
                  <option className="bg-slate-950" key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              {adminFilteredMedia.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-slate-400">
                  ไม่พบสื่อตามเงื่อนไขที่เลือก
                </div>
              ) : (
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
                  {adminFilteredMedia.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <p className="truncate font-black text-white">{item.title}</p>
                        <p className="text-sm text-slate-400">{item.topic}</p>
                        {item.tags && item.tags.length > 0 && (
                          <p className="mt-1 truncate text-xs font-bold text-sky-200/80">
                            {item.tags.map((tag) => `#${tag}`).join(' ')}
                          </p>
                        )}
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
              )}
            </div>

            <div className="grid gap-3 md:hidden">
              {adminFilteredMedia.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm font-bold text-slate-400">
                  ไม่พบสื่อตามเงื่อนไขที่เลือก
                </div>
              )}
              {adminFilteredMedia.map((item) => (
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={item.id}>
                  <p className="font-black text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.topic} · {item.access} · {item.status}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <p className="mt-2 text-xs font-bold text-sky-200/80">
                      {item.tags.map((tag) => `#${tag}`).join(' ')}
                    </p>
                  )}
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
          </>
          )}
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

function AnalyticsBreakdown({
  points,
  title,
  tone,
}: {
  points: AnalyticsPoint[]
  title: string
  tone: 'cyan' | 'emerald' | 'violet'
}) {
  const total = Math.max(1, points.reduce((sum, point) => sum + point.value, 0))
  const fill = {
    cyan: 'from-cyan-300 to-sky-400 text-cyan-200',
    emerald: 'from-emerald-300 to-cyan-300 text-emerald-200',
    violet: 'from-violet-300 to-pink-300 text-violet-200',
  }[tone]

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-black text-white">{title}</p>
        <span className={`text-sm font-black ${fill.split(' ').at(-1)}`}>
          {points.reduce((sum, point) => sum + point.value, 0).toLocaleString('th-TH')}
        </span>
      </div>
      {points.length === 0 ? (
        <p className="text-sm font-bold text-slate-500">ยังไม่มีข้อมูล</p>
      ) : (
        <div className="grid gap-3">
          {points.map((point) => (
            <div key={point.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-bold text-slate-200">{point.label}</span>
                <span className="font-black text-slate-300">
                  {point.value.toLocaleString('th-TH')} · {((point.value / total) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${fill}`}
                  style={{ width: `${Math.max(6, (point.value / total) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function AnalyticsBars({
  color,
  points,
  title,
}: {
  color: 'cyan' | 'sky' | 'emerald' | 'amber'
  points: AnalyticsPoint[]
  title: string
}) {
  const max = Math.max(1, ...points.map((point) => point.value))
  const fill = {
    cyan: 'from-cyan-300 to-violet-400 text-cyan-200',
    sky: 'from-sky-300 to-cyan-300 text-sky-200',
    emerald: 'from-emerald-300 to-cyan-300 text-emerald-200',
    amber: 'from-amber-300 to-orange-300 text-amber-200',
  }[color]

  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-black text-white">{title}</p>
        <span className={`text-sm font-black ${fill.split(' ').at(-1)}`}>
          {points.reduce((sum, point) => sum + point.value, 0).toLocaleString('th-TH')}
        </span>
      </div>
      {points.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-4 text-sm font-bold text-slate-400">
          ยังไม่มีข้อมูล analytics
        </div>
      ) : (
        <div className="flex h-36 items-end gap-1.5">
          {points.map((point) => (
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2" key={point.label}>
              <div className="flex h-28 w-full items-end rounded-t-xl bg-white/5">
                <div
                  aria-label={`${point.label}: ${point.value}`}
                  className={`w-full rounded-t-xl bg-gradient-to-t ${fill}`}
                  style={{ height: `${Math.max(4, (point.value / max) * 100)}%` }}
                  title={`${point.label}: ${point.value}`}
                />
              </div>
              <span className="w-full truncate text-center text-[10px] font-bold text-slate-500">
                {point.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </article>
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
