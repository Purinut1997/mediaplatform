import { lazy, Suspense, type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  Database,
  Download,
  Eye,
  EyeOff,
  FileUp,
  Heart,
  ListFilter,
  Loader2,
  LockKeyhole,
  Mail,
  Search,
  ShieldCheck,
  Star,
  Tag,
  UserPlus,
  Users,
} from 'lucide-react'
import type {
  CurrentUser,
  MediaItem,
  MemberLibrary,
  SiteSettings,
  Theme,
  View,
} from './types'
import { readJson } from './lib/api'
import { canAccessAdmin, canViewMedia } from './lib/media'
import { paymentProofAccept, paymentProofHelpText, readPaymentProof } from './lib/payment-proof'
import { LOGO_URL } from './brand'
import { TechBackground } from './components/TechBackground'
import { CreditBadge, EmptyState, Footer, LoadingOverlay, Popup, Toast } from './components/SharedUI'
import { PortalTiles } from './components/PortalTiles'
import { AuthBotCheck } from './components/AuthBotCheck'
import { Header, Hero, HomeJourney, MaintenanceScreen } from './components/PublicShell'
import { MemberLibraryPanel } from './components/MemberLibrary'
import { MediaDetail } from './components/MediaDetail'
import { VipTermsDialog } from './components/VipTermsDialog'
import { DiscoverySpotlight, SmartSearchDialog } from './components/HomeExperience'
import { defaultSiteSettings, mediaItems, topics } from './defaults'
import './App.css'

const AdminPanel = lazy(() =>
  import('./components/AdminPanel').then((module) => ({ default: module.AdminPanel })),
)

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
  const [mediaAccess, setMediaAccess] = useState('ทั้งหมด')
  const [mediaSource, setMediaSource] = useState('ทั้งหมด')
  const [mediaSort, setMediaSort] = useState('latest')
  const [mediaDays, setMediaDays] = useState('0')
  const [mediaTag, setMediaTag] = useState('')
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
  const [smartSearchOpen, setSmartSearchOpen] = useState(false)
  const [memberLibrary, setMemberLibrary] = useState<MemberLibrary | null>(null)
  const [memberLibraryLoading, setMemberLibraryLoading] = useState(false)
  const [memberLibraryRefresh, setMemberLibraryRefresh] = useState(0)

  useEffect(() => {
    const handleSmartSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSmartSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleSmartSearch)
    return () => window.removeEventListener('keydown', handleSmartSearch)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.dataset.theme = theme
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
        }
        if (query.trim()) mediaParams.set('query', query.trim())
        if (topic !== 'ทั้งหมด') mediaParams.set('topic', topic)
        if (mediaAccess !== 'ทั้งหมด') mediaParams.set('access', mediaAccess)
        if (mediaSource !== 'ทั้งหมด') mediaParams.set('source', mediaSource)
        if (mediaSort !== 'latest') mediaParams.set('sort', mediaSort)
        if (mediaDays !== '0') mediaParams.set('days', mediaDays)
        if (mediaTag.trim()) mediaParams.set('tag', mediaTag.trim())
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
  }, [currentUser?.role, mediaAccess, mediaDays, mediaSort, mediaSource, mediaTag, query, refreshToken, topic])

  const loadMoreMedia = async () => {
    if (loadingMoreMedia || mediaRecords.length >= mediaTotal) return
    setLoadingMoreMedia(true)
    try {
      const nextPage = mediaPage + 1
      const mediaParams = new URLSearchParams({ page: String(nextPage), pageSize: '40' })
      if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') mediaParams.set('status', 'all')
      if (query.trim()) mediaParams.set('query', query.trim())
      if (topic !== 'ทั้งหมด') mediaParams.set('topic', topic)
      if (mediaAccess !== 'ทั้งหมด') mediaParams.set('access', mediaAccess)
      if (mediaSource !== 'ทั้งหมด') mediaParams.set('source', mediaSource)
      if (mediaSort !== 'latest') mediaParams.set('sort', mediaSort)
      if (mediaDays !== '0') mediaParams.set('days', mediaDays)
      if (mediaTag.trim()) mediaParams.set('tag', mediaTag.trim())
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
        const text = `${item.title} ${item.description} ${item.topic} ${item.source} ${(item.tags ?? []).join(' ')}`.toLowerCase()
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
    <div className="theme-shell relative min-h-screen overflow-hidden text-slate-900 transition-colors duration-300 dark:text-slate-100">
      <TechBackground />
      {(loading || !sessionReady) && <LoadingOverlay />}

      <div className="relative z-10">
        <Header
          currentUser={currentUser}
          menuOpen={menuOpen}
          onLogout={logout}
          onOpenSearch={() => setSmartSearchOpen(true)}
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
              <Hero
                mediaCount={mediaTotal || mediaRecords.length || mediaItems.length}
                settings={siteSettings}
                setView={setView}
                totalDownloads={(mediaRecords.length ? mediaRecords : mediaItems).reduce((sum, item) => sum + item.downloads, 0)}
              />
              <PortalTiles setView={setView} />
              <DiscoverySpotlight mediaItems={mediaRecords.length ? mediaRecords : mediaItems} openDetail={openDetail} openSearch={() => setSmartSearchOpen(true)} />
              <HomeJourney currentUser={currentUser} setView={setView} />
              <MediaSection
                currentUser={currentUser}
                dataStatus={dataStatus}
                filteredMedia={filteredMedia}
                lockedPreviewMedia={lockedPreviewMedia}
                loadingMore={loadingMoreMedia}
                mediaLoadedCount={mediaRecords.length}
                mediaTotal={mediaTotal}
                mediaAccess={mediaAccess}
                mediaDays={mediaDays}
                mediaSort={mediaSort}
                mediaSource={mediaSource}
                mediaTag={mediaTag}
                onLoadMore={() => void loadMoreMedia()}
                openDetail={openDetail}
                query={query}
                setQuery={setQuery}
                setMediaAccess={setMediaAccess}
                setMediaDays={setMediaDays}
                setMediaSort={setMediaSort}
                setMediaSource={setMediaSource}
                setMediaTag={setMediaTag}
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
              mediaAccess={mediaAccess}
              mediaDays={mediaDays}
              mediaSort={mediaSort}
              mediaSource={mediaSource}
              mediaTag={mediaTag}
              onLoadMore={() => void loadMoreMedia()}
              openDetail={openDetail}
              query={query}
              setQuery={setQuery}
              setMediaAccess={setMediaAccess}
              setMediaDays={setMediaDays}
              setMediaSort={setMediaSort}
              setMediaSource={setMediaSource}
              setMediaTag={setMediaTag}
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
              settings={siteSettings}
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
              onLibraryRefresh={() => setMemberLibraryRefresh((value) => value + 1)}
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
              settings={siteSettings}
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
            <Suspense fallback={<div className="mx-auto min-h-96 max-w-7xl px-5 py-12 text-center font-black text-slate-500">กำลังเปิดศูนย์ควบคุม...</div>}>
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
            </Suspense>
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
      <SmartSearchDialog
        mediaItems={mediaRecords.length ? mediaRecords : mediaItems}
        onClose={() => setSmartSearchOpen(false)}
        open={smartSearchOpen}
        openDetail={openDetail}
      />
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
  mediaAccess,
  mediaDays,
  mediaSort,
  mediaSource,
  mediaTag,
  onLoadMore,
  query,
  setQuery,
  setMediaAccess,
  setMediaDays,
  setMediaSort,
  setMediaSource,
  setMediaTag,
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
  mediaAccess: string
  mediaDays: string
  mediaSort: string
  mediaSource: string
  mediaTag: string
  onLoadMore: () => void
  query: string
  setQuery: (value: string) => void
  setMediaAccess: (value: string) => void
  setMediaDays: (value: string) => void
  setMediaSort: (value: string) => void
  setMediaSource: (value: string) => void
  setMediaTag: (value: string) => void
  setTopic: (value: string) => void
  topic: string
  topics: string[]
  openDetail: (item: MediaItem) => void
  expanded?: boolean
}) {
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(window.localStorage.getItem('media-recent-searches') ?? '[]') as string[] } catch { return [] }
  })
  useEffect(() => {
    const value = query.trim()
    if (value.length < 2) return
    const timer = window.setTimeout(() => {
      setRecentSearches((current) => {
        const next = [value, ...current.filter((item) => item !== value)].slice(0, 6)
        window.localStorage.setItem('media-recent-searches', JSON.stringify(next))
        return next
      })
    }, 900)
    return () => window.clearTimeout(timer)
  }, [query])
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
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/78 px-5 font-black text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-white" onClick={() => setShowFilters((value) => !value)} type="button">
            <ListFilter size={18} />
            ตัวกรอง{showFilters ? ' ▲' : ' ▼'}
          </button>
        </div>
      </div>

      {recentSearches.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500"><span>ค้นหาล่าสุด:</span>{recentSearches.map((item) => <button className="rounded-full bg-slate-100 px-3 py-1 dark:bg-white/10" key={item} onClick={() => setQuery(item)} type="button">{item}</button>)}</div>}
      {showFilters && (
        <div className="mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-5">
          <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900" onChange={(event) => setMediaAccess(event.target.value)} value={mediaAccess}><option>ทั้งหมด</option><option>สาธารณะ</option><option>สมาชิก</option><option>VIP</option><option>ซื้อแยก</option></select>
          <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900" onChange={(event) => setMediaSource(event.target.value)} value={mediaSource}><option>ทั้งหมด</option><option>Google Drive</option><option>Google Sheet</option><option>YouTube</option><option>External Link</option></select>
          <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900" onChange={(event) => setMediaDays(event.target.value)} value={mediaDays}><option value="0">ทุกช่วงเวลา</option><option value="7">7 วันล่าสุด</option><option value="30">30 วันล่าสุด</option><option value="365">1 ปีล่าสุด</option></select>
          <select className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900" onChange={(event) => setMediaSort(event.target.value)} value={mediaSort}><option value="latest">ล่าสุด</option><option value="downloads">ดาวน์โหลดมากสุด</option><option value="views">เข้าชมมากสุด</option><option value="rating">คะแนนสูงสุด</option><option value="title">ชื่อ A-Z</option></select>
          <input className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900" onChange={(event) => setMediaTag(event.target.value)} placeholder="กรองด้วยแท็ก" value={mediaTag} />
        </div>
      )}

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
    <article className="nexus-card group grid overflow-hidden rounded-3xl border backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:grid-cols-[210px_1fr]">
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
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
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
      <div className="nexus-glass w-full rounded-[2rem] border p-6 backdrop-blur-2xl sm:p-8">
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
  const [slipDataUrl, setSlipDataUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [botVerified, setBotVerified] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [botTrap, setBotTrap] = useState('')
  const [botStartedAt] = useState(() => Date.now())

  const updateForm = (name: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [name]: value }))
  }

  const vipDurationText = settings.vipLifetimeEnabled
    ? 'ตลอดชีพ'
    : `${settings.vipDurationDays.toLocaleString('th-TH')} วัน`
  const slipLabel = settings.vipSlipLabel || 'แนบหลักฐานการโอน'

  const selectSlip = async (file?: File) => {
    setError('')
    setSlipName('')
    setSlipDataUrl('')
    if (!file) return
    try {
      const proof = await readPaymentProof(file)
      setSlipName(proof.name)
      setSlipDataUrl(proof.dataUrl)
    } catch (proofError) {
      setError(proofError instanceof Error ? proofError.message : 'แนบหลักฐานไม่สำเร็จ')
    }
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

    if (form.membership === 'vip' && !slipDataUrl) {
      setError('กรุณาแนบหลักฐานการชำระเงินก่อนสมัคร VIP')
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
          slipDataUrl,
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
                <h1 className="text-3xl font-black sm:text-4xl">
                  เลือกสิทธิ์ แล้วเริ่มใช้งานคลังสื่อ
                </h1>
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
        className="nexus-glass mt-6 rounded-[2rem] border p-5 backdrop-blur-xl sm:p-8 lg:p-10"
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
              settings.vipRegistrationEnabled
                ? settings.vipPrice > 0
                  ? `${settings.vipPrice.toLocaleString('th-TH')} บาท / ${vipDurationText}`
                  : 'ยังไม่ได้กำหนดราคา VIP'
                : 'รอเปิดรับจากผู้ดูแล'
            }
            disabled={!settings.vipRegistrationEnabled || settings.vipPrice <= 0}
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
                <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-100">
                  อายุสิทธิ์: {vipDurationText} หลังอนุมัติ
                </p>
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 font-black">
                    <FileUp size={18} />
                    {settings.vipSlipLabel}
                  </span>
                  <input
                    accept={paymentProofAccept()}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-white/10"
                    onChange={(event) => void selectSlip(event.target.files?.[0])}
                    type="file"
                  />
                  <span className="mt-2 block text-xs font-bold text-slate-500 dark:text-slate-400">
                    {slipName || `${slipLabel} (${paymentProofHelpText()})`}
                  </span>
                  <span className={`mt-2 block text-xs font-black ${slipDataUrl ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                    {slipDataUrl ? `แนบหลักฐานแล้ว: ${slipName}` : 'จำเป็นต้องแนบหลักฐานก่อนสมัคร VIP'}
                  </span>
                </label>
              </div>
            </div>
            {settings.commercePolicyText && (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm font-semibold leading-6 text-slate-600 dark:border-white/10 dark:bg-white/[0.05] dark:text-slate-300">
                {settings.commercePolicyText}
              </p>
            )}
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
          <span>
            {vipSelected ? settings.vipAgreementLabel : 'ข้อมูลสมัครสมาชิกถูกต้อง'}{' '}
            {vipSelected && <VipTermsDialog settings={settings} />}
          </span>
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


export default App
