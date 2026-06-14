export type Theme = 'light' | 'dark'
export type View = 'home' | 'media' | 'detail' | 'account' | 'admin' | 'login' | 'register' | 'forgot' | 'reset'
export type AdminSection =
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

export type AccessLevel = 'สาธารณะ' | 'สมาชิก' | 'VIP' | 'ซื้อแยก'
export type MediaStatus = 'ฉบับร่าง' | 'รอตรวจสอบ' | 'เผยแพร่แล้ว' | 'ซ่อนชั่วคราว' | 'ถูกปฏิเสธ'
export type MediaSource = 'Google Drive' | 'Google Sheet' | 'YouTube' | 'External Link'
export type AdminDateFilter = 'ทั้งหมด' | 'วันนี้' | '7 วัน' | '30 วัน'
export type AdminMediaSort = 'ล่าสุด' | 'ดาวน์โหลดมากสุด' | 'เข้าชมมากสุด' | 'ชื่อ A-Z'

export type MediaLink = {
  id?: number
  label: string
  type: MediaSource
  url: string
  previewUrl: string
  access: AccessLevel
}

export type MediaItem = {
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

export type CurrentUser = {
  name: string
  email: string
  role: 'superadmin' | 'admin' | 'member'
  access: 'VIP' | 'สมาชิก'
  vipExpiresAt?: string | null
}

export type MemberLibrary = {
  profile: CurrentUser & { createdAt: string }
  favorites: Array<{ media: MediaItem; savedAt: string }>
  history: Array<{ media: MediaItem; lastDownloadedAt: string; downloadCount: number }>
  purchases: Array<{ media: MediaItem; purchasedAt: string; amount: number }>
}

export type AdminUser = {
  id: number
  name: string
  email: string
  role: CurrentUser['role']
  access: CurrentUser['access']
  status: 'active' | 'disabled'
  vipExpiresAt?: string | null
  createdAt: string
}

export type VipMemberSummary = {
  active: number
  expiringSoon: number
  expired: number
}

export type VipRequest = {
  id: number
  userId: number | null
  name: string
  email: string
  phone: string
  slipName: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export type PurchaseRequest = {
  id: number
  userId: number
  mediaId: number
  name: string
  email: string
  mediaTitle: string
  amount: number
  slipName: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
  createdAt: string
}

export type AuditLog = {
  id: number
  actor: string
  action: string
  targetType: string
  targetId: string | null
  detail: Record<string, unknown>
  createdAt: string
}

export type ErrorLog = {
  id: number
  source: string
  message: string
  stack: string
  detail: Record<string, unknown>
  createdAt: string
}

export type SystemHealth = {
  cloudflare: string
  neon: string
  api: string
  storage: string
  responseTimeMs: number
  lastBackupAt: string | null
  lastLinkCheckAt?: string | null
  lastError: { source: string; message: string; createdAt: string } | null
  integrations?: {
    passwordResetEmail: boolean
    turnstile: boolean
    cron: boolean
    telegram: boolean
    googleLogin?: boolean
  }
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

export type TelegramStatus = {
  botTokenConfigured: boolean
  chatIdConfigured: boolean
  ready: boolean
}

export type EmailStatus = {
  configured: boolean
  apiKeyConfigured: boolean
  fromConfigured: boolean
  appUrlConfigured: boolean
}

export type AdminNotification = {
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

export type AnalyticsPoint = {
  label: string
  value: number
}

export type AdminAnalytics = {
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

export type LinkCheckResult = {
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

export type RestorePreview = {
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
  purchaseRequests: number
  mediaPurchases: number
  notifications: number
  settings: number
  mode?: 'merge' | 'replace'
  replaceTables?: string[]
  skippedUsers?: number
  warnings: string[]
}

export type MediaFormState = {
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

export type SiteSettings = {
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  heroImageUrl: string
  heroPrimaryLabel: string
  heroSecondaryLabel: string
  announcementText: string
  footerBrandName: string
  footerDescription: string
  footerSystemTitle: string
  footerSystemText: string
  maintenanceEnabled: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  vipRegistrationEnabled: boolean
  vipPrice: number
  vipDurationDays: number
  vipRefundDays: number
  purchaseEnabled: boolean
  purchaseRefundDays: number
  orderExpiryHours: number
  paymentReviewHours: number
  commercePolicyText: string
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
