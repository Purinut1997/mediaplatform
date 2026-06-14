import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Copy,
  Crown,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Gauge,
  Heart,
  Layers3,
  Link2,
  ListFilter,
  Loader2,
  LockKeyhole,
  Mail,
  PlayCircle,
  Plus,
  Pencil,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type {
  AccessLevel,
  AdminAnalytics,
  AdminDateFilter,
  AdminMediaSort,
  AdminNotification,
  AdminSection,
  AdminUser,
  AnalyticsPoint,
  AuditLog,
  CurrentUser,
  EmailStatus,
  ErrorLog,
  LinkCheckResult,
  MediaFormState,
  MediaItem,
  MediaLink,
  MediaSource,
  MediaStatus,
  MemberLibrary,
  RestorePreview,
  SiteSettings,
  SystemHealth,
  TelegramStatus,
  Theme,
  View,
  VipRequest,
} from './types'
import { readJson } from './lib/api'
import {
  canAccessAdmin,
  canViewMedia,
  createEmptyMediaForm,
  createEmptyMediaLink,
  moveMediaLink,
  normalizeMediaStatus,
} from './lib/media'
import { LOGO_URL } from './brand'
import { TechBackground } from './components/TechBackground'
import { CreditBadge, EmptyState, Footer, LoadingOverlay, Popup, Toast } from './components/SharedUI'
import { PortalTiles } from './components/PortalTiles'
import { AuthBotCheck } from './components/AuthBotCheck'
import { Header, Hero, MaintenanceScreen } from './components/PublicShell'
import { MemberLibraryPanel } from './components/MemberLibrary'
import { MediaDetail } from './components/MediaDetail'
import { accessOptions, defaultSiteSettings, mediaItems, sourceOptions, statusOptions, topics } from './defaults'
import './App.css'

function trackMediaEvent(mediaId: number, eventType: 'view') {
  void fetch('/api/media/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ mediaId, eventType }),
  }).catch(() => undefined)
}

function App() {
  const oauthResult =
    typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('oauth') ?? ''
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    return (window.localStorage.getItem('theme') as Theme | null) ?? 'light'
  })
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [mediaRecords, setMediaRecords] = useState<MediaItem[]>(mediaItems)
  const [mediaPage, setMediaPage] = useState(1)
  const [mediaTotal, setMediaTotal] = useState(0)
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false)
  const [topicOptions, setTopicOptions] = useState(topics)
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'fallback'>(
    'loading',
  )
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings)
  const [refreshToken, setRefreshToken] = useState(0)
  const [view, setView] = useState<View>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset')
      ? 'reset'
      : oauthResult && oauthResult !== 'success'
        ? 'login'
        : 'home',
  )
  const [selected, setSelected] = useState<MediaItem>(mediaItems[0])
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('ทั้งหมด')
  const [toast, setToast] = useState(() => {
    if (oauthResult === 'success') return 'เข้าสู่ระบบด้วย Google สำเร็จ'
    if (oauthResult === 'not_configured') return 'Google Login ยังไม่ได้ตั้งค่าครบ'
    if (oauthResult) return 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่'
    return ''
  })
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
    if (!oauthResult) return
    window.history.replaceState({}, '', window.location.pathname)
  }, [oauthResult])

  useEffect(() => {
    let active = true

    async function loadCurrentUser() {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' })
        if (!response.ok) throw new Error('Session request failed')
        const result = (await response.json()) as { user?: CurrentUser | null }
        if (!active) return
        setCurrentUser(result.user ?? null)
      } catch {
        if (!active) return
        setCurrentUser(null)
      } finally {
        if (active) setSessionReady(true)
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
        const mediaParams = new URLSearchParams({ page: '1', pageSize: '40' })
        if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') {
          mediaParams.set('status', 'all')
        } else {
          if (query.trim()) mediaParams.set('query', query.trim())
          if (topic !== 'ทั้งหมด') mediaParams.set('topic', topic)
        }
        const [mediaResponse, categoriesResponse, settingsResponse] = await Promise.all([
          fetch(`/api/media?${mediaParams}`),
          fetch('/api/categories'),
          fetch('/api/settings'),
        ])

        if (!mediaResponse.ok || !categoriesResponse.ok || !settingsResponse.ok) {
          throw new Error('API response was not ok')
        }

        const mediaJson = (await mediaResponse.json()) as {
          media?: MediaItem[]
          page?: number
          total?: number
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
        setMediaPage(mediaJson.page ?? 1)
        setMediaTotal(mediaJson.total ?? nextMedia.length)
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
        setMediaPage(1)
        setMediaTotal(0)
        setTopicOptions(topics)
        setSiteSettings(defaultSiteSettings)
        setDataStatus('fallback')
      }
    }

    const timer = window.setTimeout(() => void loadData(), 250)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [currentUser?.role, query, refreshToken, topic])

  const loadMoreMedia = async () => {
    if (loadingMoreMedia || mediaRecords.length >= mediaTotal) return
    setLoadingMoreMedia(true)
    try {
      const nextPage = mediaPage + 1
      const mediaParams = new URLSearchParams({ page: String(nextPage), pageSize: '40' })
      if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') mediaParams.set('status', 'all')
      else {
        if (query.trim()) mediaParams.set('query', query.trim())
        if (topic !== 'ทั้งหมด') mediaParams.set('topic', topic)
      }
      const response = await fetch(`/api/media?${mediaParams}`)
      const result = await readJson<{ media?: MediaItem[]; page?: number; total?: number; error?: string }>(response)
      if (!response.ok) throw new Error(result.error || 'โหลดสื่อเพิ่มเติมไม่สำเร็จ')
      setMediaRecords((items) => {
        const known = new Set(items.map((item) => item.id))
        return [...items, ...(result.media ?? []).filter((item) => !known.has(item.id))]
      })
      setMediaPage(result.page ?? nextPage)
      setMediaTotal(result.total ?? mediaTotal)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'โหลดสื่อเพิ่มเติมไม่สำเร็จ')
    } finally {
      setLoadingMoreMedia(false)
    }
  }

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

  const maintenanceAuthViews: View[] = ['login', 'forgot', 'reset']
  const showMaintenance =
    sessionReady &&
    siteSettings.maintenanceEnabled &&
    !canAccessAdmin(currentUser) &&
    !maintenanceAuthViews.includes(view)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f2fbff] text-slate-900 transition-colors duration-300 dark:bg-[#06111d] dark:text-slate-100">
      <TechBackground />
      {(loading || !sessionReady) && <LoadingOverlay />}

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
                loadingMore={loadingMoreMedia}
                mediaLoadedCount={mediaRecords.length}
                mediaTotal={mediaTotal}
                onLoadMore={() => void loadMoreMedia()}
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
              loadingMore={loadingMoreMedia}
              mediaLoadedCount={mediaRecords.length}
              mediaTotal={mediaTotal}
              onLoadMore={() => void loadMoreMedia()}
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
              library={memberLibrary}
              loading={memberLibraryLoading}
              onLogout={logout}
              onOpenDetail={openDetail}
              onUserUpdated={setCurrentUser}
              renderFavorite={(media) => (
                <MediaCard
                  isFavorite={favoriteIds.has(media.id)}
                  item={media}
                  key={media.id}
                  onToggleFavorite={(item) => void toggleFavorite(item)}
                  openDetail={openDetail}
                />
              )}
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
                notifySuccess('บันทึกการตั้งค่าเว็บไซต์แล้ว')
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

        <Footer settings={siteSettings} />
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

function MediaSection({
  currentUser,
  dataStatus,
  filteredMedia,
  lockedPreviewMedia,
  loadingMore,
  mediaLoadedCount,
  mediaTotal,
  onLoadMore,
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
  loadingMore: boolean
  mediaLoadedCount: number
  mediaTotal: number
  onLoadMore: () => void
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
                ? 'เชื่อมต่อ API ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
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
      {mediaLoadedCount < mediaTotal && (
        <div className="mt-7 flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            โหลดแล้ว {mediaLoadedCount.toLocaleString('th-TH')} จาก {mediaTotal.toLocaleString('th-TH')} รายการ
          </p>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-6 font-black text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            disabled={loadingMore}
            onClick={onLoadMore}
            type="button"
          >
            {loadingMore ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            โหลดสื่อเพิ่มเติม
          </button>
        </div>
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
              autoComplete="email"
              className="min-w-0 bg-transparent px-4 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              onChange={(event) => setEmail(event.target.value)}
              inputMode="email"
              name="email"
              placeholder="กรอกอีเมล"
              type="email"
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
              autoComplete="current-password"
              className="min-w-0 bg-transparent px-4 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
              name="password"
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

        <div className="mt-5 flex min-h-10 items-center justify-end text-sm font-bold">
          <button className="text-blue-600 hover:text-blue-700" onClick={() => setView('forgot')} type="button">
            ลืมรหัสผ่าน?
          </button>
        </div>

        <input
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          name="website"
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
  const [passwordResetEnabled, setPasswordResetEnabled] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [startedAt] = useState(() => Date.now())

  useEffect(() => {
    void fetch('/api/auth/config')
      .then((response) => response.json() as Promise<{ passwordResetEnabled?: boolean }>)
      .then((config) => setPasswordResetEnabled(Boolean(config.passwordResetEnabled)))
      .catch(() => setPasswordResetEnabled(false))
  }, [])

  return (
    <AuthActionPanel title="ลืมรหัสผ่าน" detail="ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมลที่ลงทะเบียน">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setSubmitting(true)
          setMessage('')
          try {
            const response = await fetch('/api/auth/forgot-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, botVerified, botStartedAt: startedAt, turnstileToken, website: '' }),
            })
            const result = await readJson<{ message?: string; error?: string }>(response)
            setMessage(result.message || result.error || 'ส่งคำขอแล้ว')
          } finally {
            setSubmitting(false)
          }
        }}
      >
        <input autoComplete="email" className="min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="อีเมลของคุณ" type="email" value={email} />
        <AuthBotCheck botVerified={botVerified} setBotVerified={setBotVerified} setTurnstileToken={setTurnstileToken} />
        {passwordResetEnabled === false && (
          <p className="mt-4 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm font-bold text-amber-800 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
            ระบบส่งอีเมลยังไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ
          </p>
        )}
        {message && <p className="mt-4 rounded-2xl bg-cyan-50 p-4 text-sm font-bold text-cyan-900 dark:bg-cyan-300/10 dark:text-cyan-100">{message}</p>}
        <button className="mt-5 min-h-14 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={passwordResetEnabled !== true || submitting} type="submit">
          {submitting ? 'กำลังส่งอีเมล...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}
        </button>
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
          <input autoComplete="new-password" className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" name="new-password" onChange={(event) => setPassword(event.target.value)} placeholder="รหัสผ่านใหม่" type="password" value={password} />
          <input autoComplete="new-password" className="min-h-14 rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-400 dark:border-white/10 dark:bg-white/10" name="confirm-password" onChange={(event) => setConfirm(event.target.value)} placeholder="ยืนยันรหัสผ่านใหม่" type="password" value={confirm} />
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
            autoComplete="name"
            label="ชื่อ-นามสกุล"
            name="name"
            onChange={(value) => updateForm('name', value)}
            placeholder="เช่น สมชาย ใจดี"
            value={form.name}
          />
          <RegisterField
            autoComplete="tel"
            label="เบอร์โทรศัพท์"
            name="tel"
            onChange={(value) => updateForm('phone', value)}
            placeholder="08xxxxxxxx"
            value={form.phone}
          />
          <RegisterField
            autoComplete="email"
            className="md:col-span-2"
            label="อีเมล"
            name="email"
            onChange={(value) => updateForm('email', value)}
            placeholder="name@example.com"
            type="email"
            value={form.email}
          />
          <RegisterField
            autoComplete="new-password"
            label="รหัสผ่าน"
            name="new-password"
            onChange={(value) => updateForm('password', value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            type="password"
            value={form.password}
          />
          <RegisterField
            autoComplete="new-password"
            label="ยืนยันรหัสผ่าน"
            name="confirm-password"
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
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
          name="website"
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
  autoComplete,
  className = '',
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}: {
  autoComplete?: string
  className?: string
  label: string
  name?: string
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
        autoComplete={autoComplete}
        className="mt-2 min-h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-white/10"
        name={name}
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
  const [adminMediaResults, setAdminMediaResults] = useState<MediaItem[]>(mediaItems)
  const [adminMediaPage, setAdminMediaPage] = useState(1)
  const [adminMediaPageSize, setAdminMediaPageSize] = useState(10)
  const [adminMediaTotal, setAdminMediaTotal] = useState(mediaItems.length)
  const [loadingAdminMedia, setLoadingAdminMedia] = useState(false)
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(() => new Set())
  const [bulkMediaStatus, setBulkMediaStatus] = useState<MediaStatus>('ฉบับร่าง')
  const [bulkMediaTopic, setBulkMediaTopic] = useState(topics[0] ?? 'โรงเรียน')
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
  const [activityPage, setActivityPage] = useState(1)
  const [activityTotal, setActivityTotal] = useState(0)
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([])
  const [errorPage, setErrorPage] = useState(1)
  const [errorTotal, setErrorTotal] = useState(0)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [notificationUnread, setNotificationUnread] = useState(0)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatus | null>(null)
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null)
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
  const adminFilteredMedia = [...adminMediaResults].filter((item) => {
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
  const adminMediaPageCount = Math.max(1, Math.ceil(adminMediaTotal / adminMediaPageSize))
  const adminMediaRangeStart = adminMediaTotal ? (adminMediaPage - 1) * adminMediaPageSize + 1 : 0
  const adminMediaRangeEnd = Math.min(adminMediaPage * adminMediaPageSize, adminMediaTotal)
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
  const unreadNotifications = notificationUnread
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
  type AdminMenuGroup = 'ภาพรวม' | 'เนื้อหาและคลังสื่อ' | 'สมาชิกและสิทธิ์' | 'ระบบและการตั้งค่า'
  const allAdminMenu: Array<{ id: AdminSection; label: string; icon: typeof BarChart3; detail: string; group: AdminMenuGroup; ownerOnly?: boolean }> = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, detail: 'ภาพรวมและงานสำคัญ', group: 'ภาพรวม' },
    { id: 'media', label: 'จัดการสื่อ', icon: Layers3, detail: 'เพิ่ม แก้ไข และ workflow', group: 'เนื้อหาและคลังสื่อ' },
    { id: 'taxonomy', label: 'หมวดหมู่และแท็ก', icon: Tag, detail: `${topics.length} หมวด / ${tagStats.length} แท็ก`, group: 'เนื้อหาและคลังสื่อ' },
    { id: 'links', label: 'ตรวจสุขภาพลิงก์', icon: Link2, detail: `${linkedMedia.length} ลิงก์`, group: 'เนื้อหาและคลังสื่อ' },
    { id: 'members', label: 'สมาชิกและ VIP', icon: Users, detail: `${pendingVipRequests.length} รอตรวจ`, group: 'สมาชิกและสิทธิ์', ownerOnly: true },
    { id: 'activity', label: 'ประวัติการทำงาน', icon: FileText, detail: `${activityTotal} รายการ`, group: 'ระบบและการตั้งค่า', ownerOnly: true },
    { id: 'health', label: 'สถานะระบบ', icon: Gauge, detail: systemHealth ? `${systemHealth.responseTimeMs} ms` : 'ตรวจระบบ', group: 'ระบบและการตั้งค่า' },
    { id: 'errors', label: 'บันทึกข้อผิดพลาด', icon: AlertCircle, detail: `${errorTotal} รายการ`, group: 'ระบบและการตั้งค่า', ownerOnly: true },
    { id: 'backup', label: 'สำรองและกู้คืน', icon: Database, detail: 'JSON / CSV', group: 'ระบบและการตั้งค่า', ownerOnly: true },
    { id: 'settings', label: 'ตั้งค่าหน้าเว็บ', icon: Settings, detail: 'หน้าแรก Footer และ VIP', group: 'ระบบและการตั้งค่า', ownerOnly: true },
  ]
  const adminMenu = allAdminMenu.filter((item) => isSuperAdmin || !item.ownerOnly)
  const adminMenuGroups = Array.from(new Set(adminMenu.map((item) => item.group))).map((group) => ({
    group,
    items: adminMenu.filter((item) => item.group === group),
  }))
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

  const loadAdminMediaPage = async (page: number) => {
    setLoadingAdminMedia(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(adminMediaPageSize) })
      params.set('status', adminMediaStatus === 'ทั้งหมด' ? 'all' : adminMediaStatus)
      if (adminMediaQuery.trim()) params.set('query', adminMediaQuery.trim())
      if (adminMediaTagQuery.trim()) params.set('tag', adminMediaTagQuery.trim())
      if (adminMediaTopic !== 'ทั้งหมด') params.set('topic', adminMediaTopic)
      if (adminMediaAccess !== 'ทั้งหมด') params.set('access', adminMediaAccess)
      if (adminMediaDate !== 'ทั้งหมด') params.set('days', adminMediaDate === 'วันนี้' ? '1' : adminMediaDate === '7 วัน' ? '7' : '30')
      if (adminMediaSort !== 'ล่าสุด') {
        params.set('sort', adminMediaSort === 'ดาวน์โหลดมากสุด' ? 'downloads' : adminMediaSort === 'เข้าชมมากสุด' ? 'views' : 'title')
      }
      const response = await fetch(`/api/media?${params}`, { credentials: 'include' })
      const result = await readJson<{ media?: MediaItem[]; page?: number; total?: number; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'โหลดรายการสื่อไม่สำเร็จ')
      setAdminMediaResults(result.media ?? [])
      setAdminMediaPage(result.page ?? page)
      setAdminMediaTotal(result.total ?? 0)
      setSelectedMediaIds(new Set())
    } catch (mediaLoadError) {
      setError(mediaLoadError instanceof Error ? mediaLoadError.message : 'โหลดรายการสื่อไม่สำเร็จ')
    } finally {
      setLoadingAdminMedia(false)
    }
  }

  const loadNotifications = async () => {
    const response = await fetch('/api/admin/notifications', { credentials: 'include' })
    const result = await readJson<{ notifications?: AdminNotification[]; unread?: number; error?: string }>(response)
    if (!response.ok) throw new Error(result.error ?? 'โหลด Notification Center ไม่สำเร็จ')
    setNotifications(result.notifications ?? [])
    setNotificationUnread(result.unread ?? 0)
  }

  const loadAnalytics = async () => {
    const response = await fetch('/api/admin/analytics', { credentials: 'include' })
    const result = await readJson<{ analytics?: AdminAnalytics; error?: string }>(response)
    if (!response.ok) throw new Error(result.error ?? 'โหลด Analytics ไม่สำเร็จ')
    setAnalytics(result.analytics ?? null)
  }

  const loadActivity = async (page = activityPage) => {
    const response = await fetch(`/api/admin/activity?page=${page}&pageSize=50`, { credentials: 'include' })
    const result = await readJson<{ logs?: AuditLog[]; total?: number; page?: number; error?: string }>(response)
    if (!response.ok) throw new Error(result.error ?? 'โหลด Activity Log ไม่สำเร็จ')
    setAuditLogs(result.logs ?? [])
    setActivityTotal(result.total ?? 0)
    setActivityPage(result.page ?? page)
  }

  const loadErrors = async (page = errorPage) => {
    const response = await fetch(`/api/admin/errors?page=${page}&pageSize=50`, { credentials: 'include' })
    const result = await readJson<{ errors?: ErrorLog[]; total?: number; page?: number; error?: string }>(response)
    if (!response.ok) throw new Error(result.error ?? 'โหลด Error Log ไม่สำเร็จ')
    setErrorLogs(result.errors ?? [])
    setErrorTotal(result.total ?? 0)
    setErrorPage(result.page ?? page)
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
        const [, , telegramResponse, emailResponse] = await Promise.all([
          loadActivity(),
          loadErrors(),
          fetch('/api/admin/telegram', { credentials: 'include' }),
          fetch('/api/admin/email', { credentials: 'include' }),
        ])
        const telegram = await readJson<{ telegram?: TelegramStatus; error?: string }>(telegramResponse)
        if (!telegramResponse.ok) throw new Error(telegram.error ?? 'โหลดสถานะ Telegram ไม่สำเร็จ')
        const email = await readJson<{ email?: EmailStatus; error?: string }>(emailResponse)
        if (!emailResponse.ok) throw new Error(email.error ?? 'โหลดสถานะอีเมลไม่สำเร็จ')
        setTelegramStatus(telegram.telegram ?? null)
        setEmailStatus(email.email ?? null)
      } else {
        setAuditLogs([])
        setActivityTotal(0)
        setErrorLogs([])
        setErrorTotal(0)
        setTelegramStatus(null)
        setEmailStatus(null)
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

  const downloadBackup = async (format: 'json' | 'csv', table = 'media', scope: 'full' | 'core' = 'full') => {
    setLoadingOps(true)
    setOpsError('')
    try {
      const query = format === 'json' ? `?format=json&scope=${scope}` : `?format=csv&table=${encodeURIComponent(table)}`
      const response = await fetch(`/api/admin/backup${query}`, { credentials: 'include' })
      if (!response.ok) {
        const result = await readJson<{ error?: string }>(response)
        throw new Error(result.error ?? 'ดาวน์โหลดสำรองข้อมูลไม่สำเร็จ')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mikpurinut-backup-${format === 'json' ? `${scope}.json` : `${table}.csv`}`
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

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAdminMediaPage(1), 250)
    return () => window.clearTimeout(timer)
    // Reload media from Neon whenever an advanced filter or the parent media set changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adminMediaAccess,
    adminMediaDate,
    adminMediaQuery,
    adminMediaSort,
    adminMediaStatus,
    adminMediaTagQuery,
    adminMediaTopic,
    adminMediaPageSize,
    mediaItems.length,
  ])

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

  const addMediaLink = (type: MediaSource = 'Google Drive') => {
    const labels: Record<MediaSource, string> = {
      'Google Drive': 'ดาวน์โหลดไฟล์',
      'Google Sheet': 'เปิด Google Sheet',
      YouTube: 'ดูวิดีโอสอน',
      'External Link': 'เปิดลิงก์เพิ่มเติม',
    }
    setForm((current) => ({
      ...current,
      links: current.links.length >= 20
        ? current.links
        : [...current.links, { ...createEmptyMediaLink(), type, label: labels[type], access: current.access }],
    }))
  }

  const removeMediaLink = (index: number) => {
    setForm((current) => ({
      ...current,
      links: current.links.length > 1 ? current.links.filter((_, linkIndex) => linkIndex !== index) : current.links,
    }))
  }

  const reorderMediaLink = (index: number, direction: 'up' | 'down') => {
    setForm((current) => ({ ...current, links: moveMediaLink(current.links, index, direction) }))
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

  const duplicateMedia = async (item: MediaItem) => {
    setError('')
    setSaving(true)
    try {
      const response = await fetch('/api/media/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: item.id }),
      })
      const result = await readJson<{ media?: { id: number; title: string }; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'สร้างสำเนาสื่อไม่สำเร็จ')
      await loadAdminMediaPage(1)
      onCreated()
    } catch (duplicateError) {
      setError(duplicateError instanceof Error ? duplicateError.message : 'สร้างสำเนาสื่อไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const toggleSelectedMedia = (id: number) => {
    setSelectedMediaIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisibleMedia = () => {
    const visibleIds = adminFilteredMedia.map((item) => item.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMediaIds.has(id))
    setSelectedMediaIds(allSelected ? new Set() : new Set(visibleIds))
  }

  const runBulkMediaAction = async (action: 'status' | 'topic' | 'delete', value = '') => {
    const ids = Array.from(selectedMediaIds)
    if (!ids.length) return
    if (action === 'delete' && !window.confirm(`ลบสื่อที่เลือก ${ids.length} รายการใช่ไหม? การดำเนินการนี้ย้อนกลับไม่ได้`)) return

    setError('')
    setSaving(true)
    try {
      const response = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ids, value }),
      })
      const result = await readJson<{ updated?: number; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'จัดการสื่อหลายรายการไม่สำเร็จ')
      setSelectedMediaIds(new Set())
      await loadAdminMediaPage(adminMediaPage)
      onCreated()
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'จัดการสื่อหลายรายการไม่สำเร็จ')
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
      setSettingsForm({
        ...result.settings,
        vipPrice: String(result.settings.vipPrice),
      })
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

  const testEmail = async () => {
    setLoadingOps(true)
    setSettingsError('')
    setSettingsNotice('')
    try {
      const response = await fetch('/api/admin/email', { method: 'POST', credentials: 'include' })
      const result = await readJson<{ email?: EmailStatus; recipient?: string; error?: string }>(response)
      if (!response.ok) throw new Error(result.error ?? 'ส่งอีเมลทดสอบไม่สำเร็จ')
      setEmailStatus(result.email ?? null)
      setSettingsNotice(`ส่งอีเมลทดสอบไปยัง ${result.recipient ?? currentUser.email} แล้ว`)
    } catch (emailError) {
      setSettingsError(emailError instanceof Error ? emailError.message : 'ส่งอีเมลทดสอบไม่สำเร็จ')
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
            {adminMenuGroups.map(({ group, items }, groupIndex) => (
              <div className={groupIndex ? 'mt-4 border-t border-white/10 pt-4' : ''} key={group}>
                <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-widest text-cyan-200/60">{group}</p>
                {items.map((item) => {
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
              </div>
            ))}
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
            className="rounded-2xl border border-cyan-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]"
            onSubmit={submitSettings}
          >
            <div className="mb-4">
              <h3 className="text-xl font-black">ตั้งค่า Footer และข้อมูลท้ายเว็บไซต์</h3>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                แก้ชื่อแบรนด์ คำอธิบาย และข้อความระบบด้านล่างเว็บ โดยเครดิตผู้จัดทำจะคงอยู่เสมอ
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField
                label="ชื่อแบรนด์ใน Footer"
                name="footerBrandName"
                onChange={updateSettings}
                placeholder="MIKPURINUT Nexus"
                value={settingsForm.footerBrandName}
              />
              <AdminField
                label="หัวข้อคอลัมน์ระบบ"
                name="footerSystemTitle"
                onChange={updateSettings}
                placeholder="ระบบ"
                value={settingsForm.footerSystemTitle}
              />
              <label className="md:col-span-2">
                <span className="text-sm font-black text-slate-200">คำอธิบาย Footer</span>
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  onChange={(event) => updateSettings('footerDescription', event.target.value)}
                  placeholder="อธิบายหน้าที่ของเว็บไซต์โดยย่อ"
                  value={settingsForm.footerDescription}
                />
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-black text-slate-200">ข้อความคอลัมน์ระบบ</span>
                <textarea
                  className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
                  onChange={(event) => updateSettings('footerSystemText', event.target.value)}
                  placeholder="Public · Member · VIP · Admin"
                  value={settingsForm.footerSystemText}
                />
              </label>
              <div className="md:col-span-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-semibold leading-6 text-emerald-100">
                เครดิต <strong>Created by MIKPURINUT</strong> และโลโก้ระบบถูกล็อกไว้ตามข้อกำหนด จึงไม่สามารถลบผ่านหลังบ้านได้
              </div>
            </div>
            <button
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 font-black text-slate-950 shadow-lg shadow-cyan-500/20 disabled:opacity-60 sm:w-auto"
              disabled={savingSettings}
              type="submit"
            >
              {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Settings size={20} />}
              {savingSettings ? 'กำลังบันทึก...' : 'บันทึก Footer'}
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

          <section className="rounded-2xl border border-sky-300/20 bg-white/[0.07] p-4 ring-1 ring-white/[0.03]">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="flex items-center gap-2 text-xl font-black">
                  <Mail className="text-sky-300" size={22} />
                  อีเมลลืมรหัสผ่าน
                </h3>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  ตรวจความพร้อม Resend และส่งอีเมลทดสอบไปยังบัญชี Super Admin ที่กำลังใช้งาน
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
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-sky-300 px-4 font-black text-slate-950 disabled:opacity-60"
                  disabled={loadingOps || !emailStatus?.configured}
                  onClick={testEmail}
                  type="button"
                >
                  {loadingOps ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                  ส่งอีเมลทดสอบ
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['Resend API Key', emailStatus?.apiKeyConfigured],
                ['อีเมลผู้ส่ง', emailStatus?.fromConfigured],
                ['URL เว็บไซต์', emailStatus?.appUrlConfigured],
              ].map(([label, enabled]) => (
                <article className="rounded-2xl border border-white/10 bg-black/20 p-4" key={label as string}>
                  <p className="text-sm font-bold text-slate-400">{label as string}</p>
                  <p className={`mt-2 text-lg font-black ${enabled ? 'text-emerald-200' : 'text-amber-200'}`}>
                    {emailStatus ? (enabled ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า') : 'รอโหลดสถานะ'}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold leading-6 text-slate-300">
              ตั้งค่า <code className="font-black text-sky-100">RESEND_API_KEY</code>,{' '}
              <code className="font-black text-sky-100">EMAIL_FROM</code> และ{' '}
              <code className="font-black text-sky-100">APP_URL</code> ใน Cloudflare แล้วกดรีเฟรช/ส่งทดสอบได้ทันที
            </div>
          </section>

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
                  ['Turnstile', systemHealth.integrations?.turnstile ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม'],
                  ['อีเมลลืมรหัสผ่าน', systemHealth.integrations?.passwordResetEmail ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม'],
                  ['Cron ตรวจลิงก์', systemHealth.integrations?.cron ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม'],
                  ['Telegram', systemHealth.integrations?.telegram ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม'],
                  ['Google Login', systemHealth.integrations?.googleLogin ? 'พร้อมใช้งาน' : 'ยังไม่พร้อม'],
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
                <button className="min-h-11 rounded-2xl bg-sky-300 px-4 font-black text-slate-950" onClick={() => void loadActivity()} type="button">
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
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:opacity-35"
                disabled={loadingOps || activityPage <= 1}
                onClick={() => void loadActivity(activityPage - 1)}
                type="button"
              >
                ก่อนหน้า
              </button>
              <span className="text-xs font-bold text-slate-400">
                หน้า {activityPage.toLocaleString('th-TH')} / {Math.max(1, Math.ceil(activityTotal / 50)).toLocaleString('th-TH')}
                {' · '}{activityTotal.toLocaleString('th-TH')} รายการ
              </span>
              <button
                className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:opacity-35"
                disabled={loadingOps || activityPage * 50 >= activityTotal}
                onClick={() => void loadActivity(activityPage + 1)}
                type="button"
              >
                ถัดไป
              </button>
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
                <button className="min-h-11 rounded-2xl bg-red-300 px-4 font-black text-slate-950" onClick={() => void loadErrors()} type="button">
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
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <button
                className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:opacity-35"
                disabled={loadingOps || errorPage <= 1}
                onClick={() => void loadErrors(errorPage - 1)}
                type="button"
              >
                ก่อนหน้า
              </button>
              <span className="text-xs font-bold text-slate-400">
                หน้า {errorPage.toLocaleString('th-TH')} / {Math.max(1, Math.ceil(errorTotal / 50)).toLocaleString('th-TH')}
                {' · '}{errorTotal.toLocaleString('th-TH')} รายการ
              </span>
              <button
                className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:opacity-35"
                disabled={loadingOps || errorPage * 50 >= errorTotal}
                onClick={() => void loadErrors(errorPage + 1)}
                type="button"
              >
                ถัดไป
              </button>
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
                className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 font-black text-slate-950 disabled:opacity-60"
                disabled={loadingOps}
                onClick={() => downloadBackup('json', 'media', 'core')}
                type="button"
              >
                <Archive size={20} />
                JSON ข้อมูลหลัก
              </button>
              <button
                className="inline-flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-violet-300 px-5 font-black text-slate-950 disabled:opacity-60"
                disabled={loadingOps}
                onClick={() => downloadBackup('json', 'media', 'full')}
                type="button"
              >
                <Archive size={20} />
                JSON ทั้งระบบ
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
              แนะนำ JSON ข้อมูลหลักสำหรับสำรองประจำวัน ส่วน JSON ทั้งระบบจะรวมประวัติและแจ้งเตือนซึ่งมีขนาดใหญ่กว่า
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
                      เพิ่ม Drive, Sheet, YouTube หรือ preview ได้หลายรายการ และจัดลำดับรายการหลักได้
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">
                    {form.links.length} / 20 รายการ
                  </span>
                </div>
                <div className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {([
                    ['Google Drive', 'เพิ่มไฟล์ Drive', FileText],
                    ['Google Sheet', 'เพิ่ม Google Sheet', Database],
                    ['YouTube', 'เพิ่มวิดีโอ YouTube', PlayCircle],
                    ['External Link', 'เพิ่มลิงก์เว็บ', ExternalLink],
                  ] as const).map(([type, label, Icon]) => (
                    <button
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-sm font-black text-slate-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={form.links.length >= 20}
                      key={type}
                      onClick={() => addMediaLink(type)}
                      type="button"
                    >
                      <Icon size={17} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3">
                  {form.links.map((link, index) => (
                    <div
                      className="rounded-2xl border border-white/10 bg-black/20 p-3 ring-1 ring-white/[0.03]"
                      key={`${index}-${link.type}`}
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-xl bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                            รายการที่ {index + 1} · {link.type}
                          </span>
                          {index === 0 && (
                            <span className="rounded-xl bg-cyan-300/15 px-3 py-1 text-xs font-black text-cyan-100">
                              รายการหลัก
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            aria-label={`เลื่อน ${link.label || `รายการที่ ${index + 1}`} ขึ้น`}
                            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                            disabled={index === 0}
                            onClick={() => reorderMediaLink(index, 'up')}
                            title="เลื่อนขึ้น"
                            type="button"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            aria-label={`เลื่อน ${link.label || `รายการที่ ${index + 1}`} ลง`}
                            className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
                            disabled={index === form.links.length - 1}
                            onClick={() => reorderMediaLink(index, 'down')}
                            title="เลื่อนลง"
                            type="button"
                          >
                            <ArrowDown size={15} />
                          </button>
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
                {loadingAdminMedia ? 'กำลังค้นหา...' : `${adminMediaTotal.toLocaleString('th-TH')} รายการ`}
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

            {selectedMediaIds.size > 0 && (
              <div className="mb-4 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08] p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-cyan-100">
                    เลือกแล้ว {selectedMediaIds.size.toLocaleString('th-TH')} รายการ
                  </p>
                  <button
                    className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white"
                    onClick={() => setSelectedMediaIds(new Set())}
                    type="button"
                  >
                    ยกเลิกการเลือก
                  </button>
                </div>
                <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_auto]">
                  <select
                    className="min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 font-bold text-white outline-none focus:border-cyan-300"
                    onChange={(event) => setBulkMediaStatus(event.target.value as MediaStatus)}
                    value={bulkMediaStatus}
                  >
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <button
                    className="min-h-11 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950 disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void runBulkMediaAction('status', bulkMediaStatus)}
                    type="button"
                  >
                    เปลี่ยนสถานะ
                  </button>
                  <select
                    className="min-h-11 rounded-xl border border-white/10 bg-slate-950 px-3 font-bold text-white outline-none focus:border-cyan-300"
                    onChange={(event) => setBulkMediaTopic(event.target.value)}
                    value={bulkMediaTopic}
                  >
                    {topics.filter((topic) => topic !== 'ทั้งหมด').map((topic) => <option key={topic}>{topic}</option>)}
                  </select>
                  <button
                    className="min-h-11 rounded-xl bg-sky-400/20 px-4 text-sm font-black text-sky-100 disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void runBulkMediaAction('topic', bulkMediaTopic)}
                    type="button"
                  >
                    ย้ายหมวดหมู่
                  </button>
                  <button
                    className="min-h-11 rounded-xl bg-red-400/15 px-4 text-sm font-black text-red-100 disabled:opacity-50"
                    disabled={saving}
                    onClick={() => void runBulkMediaAction('delete')}
                    type="button"
                  >
                    ลบที่เลือก
                  </button>
                </div>
              </div>
            )}

            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
              {adminFilteredMedia.length === 0 ? (
                <div className="p-6 text-center text-sm font-bold text-slate-400">
                  ไม่พบสื่อตามเงื่อนไขที่เลือก
                </div>
              ) : (
              <table className="w-full table-fixed text-left">
                <thead className="bg-black/32 text-sm text-cyan-200">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        aria-label="เลือกสื่อทั้งหมดในหน้านี้"
                        checked={adminFilteredMedia.length > 0 && adminFilteredMedia.every((item) => selectedMediaIds.has(item.id))}
                        className="h-5 w-5 accent-cyan-300"
                        onChange={toggleAllVisibleMedia}
                        type="checkbox"
                      />
                    </th>
                    <th className="w-[30%] px-4 py-3">สื่อ</th>
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
                        <input
                          aria-label={`เลือก ${item.title}`}
                          checked={selectedMediaIds.has(item.id)}
                          className="h-5 w-5 accent-cyan-300"
                          onChange={() => toggleSelectedMedia(item.id)}
                          type="checkbox"
                        />
                      </td>
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
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-400/10 px-3 text-sm font-black text-sky-100 disabled:opacity-50"
                            disabled={saving}
                            onClick={() => void duplicateMedia(item)}
                            type="button"
                          >
                            <Copy size={15} />
                            ทำสำเนา
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
                  <div className="flex items-start gap-3">
                    <input
                      aria-label={`เลือก ${item.title}`}
                      checked={selectedMediaIds.has(item.id)}
                      className="mt-1 h-5 w-5 shrink-0 accent-cyan-300"
                      onChange={() => toggleSelectedMedia(item.id)}
                      type="checkbox"
                    />
                    <p className="font-black text-white">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {item.topic} · {item.access} · {item.status}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <p className="mt-2 text-xs font-bold text-sky-200/80">
                      {item.tags.map((tag) => `#${tag}`).join(' ')}
                    </p>
                  )}
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <button
                      className="min-h-11 rounded-xl bg-cyan-300 px-4 font-black text-slate-950"
                      onClick={() => startEditMedia(item)}
                      type="button"
                    >
                      แก้ไข
                    </button>
                    <button
                      className="min-h-11 rounded-xl bg-sky-400/15 px-4 font-black text-sky-100 disabled:opacity-50"
                      disabled={saving}
                      onClick={() => void duplicateMedia(item)}
                      type="button"
                    >
                      ทำสำเนา
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
            <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-bold text-slate-400">
                  แสดง {adminMediaRangeStart.toLocaleString('th-TH')}–{adminMediaRangeEnd.toLocaleString('th-TH')} จาก {adminMediaTotal.toLocaleString('th-TH')} รายการ
                </p>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                  ต่อหน้า
                  <select
                    className="min-h-10 rounded-xl border border-white/10 bg-black/24 px-3 font-black text-white outline-none focus:border-cyan-300"
                    onChange={(event) => setAdminMediaPageSize(Number(event.target.value))}
                    value={adminMediaPageSize}
                  >
                    {[10, 20, 50].map((size) => <option className="bg-slate-950" key={size} value={size}>{size}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  className="min-h-10 rounded-xl bg-white/10 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-35"
                  disabled={loadingAdminMedia || adminMediaPage <= 1}
                  onClick={() => void loadAdminMediaPage(adminMediaPage - 1)}
                  type="button"
                >
                  ก่อนหน้า
                </button>
                <span className="min-w-20 text-center text-xs font-black text-cyan-200">
                  หน้า {adminMediaPage.toLocaleString('th-TH')} / {adminMediaPageCount.toLocaleString('th-TH')}
                </span>
                <button
                  className="min-h-10 rounded-xl bg-cyan-300 px-4 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-35"
                  disabled={loadingAdminMedia || adminMediaPage >= adminMediaPageCount}
                  onClick={() => void loadAdminMediaPage(adminMediaPage + 1)}
                  type="button"
                >
                  ถัดไป
                </button>
              </div>
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

export default App
