import type { CSSProperties } from 'react'

type CodeLine = {
  text: string
  color: string
}

type CodeColumn = {
  left: string
  duration: string
  delay: string
  className?: string
  lines: CodeLine[]
}

const developerColumns: CodeColumn[] = [
  {
    left: '2%',
    duration: '38s',
    delay: '0s',
    lines: [
      { text: '// Cloudflare Serverless Edge API v2.4', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: 'export const onRequestGet = async ({ env, request }) => {', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '  const user = await auth.getCurrentUser(env, request);', color: 'text-slate-600 dark:text-slate-300' },
      { text: '  const sql = getSql(env);', color: 'text-slate-600 dark:text-slate-300' },
      { text: '  const isVip = user?.role === "superadmin" || user?.access === "VIP";', color: 'text-cyan-600 dark:text-cyan-400' },
      { text: '  const catalog = await sql`', color: 'text-sky-600 dark:text-sky-300' },
      { text: '    SELECT id, title, access_level, downloads', color: 'text-sky-600 dark:text-sky-300' },
      { text: '    FROM media WHERE status = "active"', color: 'text-sky-600 dark:text-sky-300' },
      { text: '    ORDER BY created_at DESC LIMIT 50;', color: 'text-sky-600 dark:text-sky-300' },
      { text: '  `;', color: 'text-sky-600 dark:text-sky-300' },
      { text: '  return Response.json({ ok: true, catalog }, {', color: 'text-slate-600 dark:text-slate-300' },
      { text: '    headers: { "Cache-Control": "public, max-age=60" }', color: 'text-sky-600 dark:text-sky-300' },
      { text: '  });', color: 'text-slate-600 dark:text-slate-300' },
      { text: '};', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '// Request latency: 12ms | Edge cache: HIT', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    ],
  },
  {
    left: '21%',
    duration: '32s',
    delay: '-9s',
    lines: [
      { text: '$ npm run build', color: 'text-amber-600 dark:text-amber-300 font-semibold' },
      { text: 'vite v8.0.16 building for production...', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: '✓ 1,761 modules transformed.', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
      { text: 'dist/index.html                     1.89 kB', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: 'dist/assets/index-C2Xo35tu.js     356.73 kB', color: 'text-slate-600 dark:text-slate-300' },
      { text: '✓ built in 156ms [GPU OPTIMIZED]', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
      { text: '$ git commit -m "perf: zero-gpu code stream"', color: 'text-amber-600 dark:text-amber-300 font-semibold' },
      { text: '$ git push origin main', color: 'text-amber-600 dark:text-amber-300 font-semibold' },
      { text: '⚡ Deploying to Cloudflare Pages: mediaplatform', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '✨ Deployment live: https://mediaplatform.pages.dev', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
      { text: '● 28/28 PRODUCTION SMOKE CHECKS PASS [200 OK]', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    ],
  },
  {
    left: '42%',
    duration: '45s',
    delay: '-18s',
    className: 'hidden md:block',
    lines: [
      { text: '-- Neon Serverless PostgreSQL Pool (us-east-1)', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: 'CREATE TABLE media_purchases (', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '  id SERIAL PRIMARY KEY,', color: 'text-slate-600 dark:text-slate-300' },
      { text: '  user_id INT REFERENCES users(id),', color: 'text-slate-600 dark:text-slate-300' },
      { text: '  media_id INT REFERENCES media(id),', color: 'text-slate-600 dark:text-slate-300' },
      { text: '  access_level VARCHAR(20) DEFAULT "VIP",', color: 'text-sky-600 dark:text-sky-300' },
      { text: '  granted_at TIMESTAMPTZ DEFAULT NOW()', color: 'text-slate-600 dark:text-slate-300' },
      { text: ');', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: 'CREATE INDEX idx_vip_expiry ON users(vip_expires_at);', color: 'text-slate-600 dark:text-slate-300' },
      { text: '-- Query plan: Index Scan using idx_vip_expiry', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: '-- Pool: 10/10 active | Query latency: 8.4ms [FAST]', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    ],
  },
  {
    left: '63%',
    duration: '36s',
    delay: '-6s',
    className: 'hidden lg:block',
    lines: [
      { text: '// Web Crypto Subtle & Role-Based Access Control', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: 'const key = await crypto.subtle.importKey(', color: 'text-slate-600 dark:text-slate-300' },
      { text: '  "raw", encoder.encode(SECRET),', color: 'text-sky-600 dark:text-sky-300' },
      { text: '  { name: "HMAC", hash: "SHA-256" }, false, ["sign"]', color: 'text-sky-600 dark:text-sky-300' },
      { text: ');', color: 'text-slate-600 dark:text-slate-300' },
      { text: 'const sig = await crypto.subtle.sign("HMAC", key, data);', color: 'text-slate-600 dark:text-slate-300' },
      { text: 'if (!timingSafeEqual(sig, expected)) throw "AUTH_ERR";', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '[SECURITY] CSRF Token verified | Session: active', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
      { text: '[RATE_LIMIT] IP: 124.120.x.x -> 12 req/min [NORMAL]', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: '[TELEMETRY] Memory: 32.4MB | CPU: 0.1% | GPU: 0.0%', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
      { text: '● STATUS: ALL SYSTEMS OPERATIONAL', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    ],
  },
  {
    left: '82%',
    duration: '42s',
    delay: '-14s',
    className: 'hidden xl:block',
    lines: [
      { text: '// React Component State & Edge Sync Engine', color: 'text-slate-400/80 dark:text-slate-500' },
      { text: 'const [media, setMedia] = useState<MediaItem[]>([]);', color: 'text-slate-600 dark:text-slate-300' },
      { text: 'const [vipStatus, setVipStatus] = useState("ACTIVE");', color: 'text-slate-600 dark:text-slate-300' },
      { text: 'useEffect(() => {', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '  void syncCatalog({ cache: "edge", fastFail: true });', color: 'text-slate-600 dark:text-slate-300' },
      { text: '}, [sessionReady]);', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: 'const canAccess = isSuperAdmin || user?.access === "VIP";', color: 'text-slate-600 dark:text-slate-300' },
      { text: 'export function MediaCatalog({ filters }: CatalogProps) {', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '  return <VirtualGrid items={media} rowHeight={120} />;', color: 'text-sky-600 dark:text-sky-300' },
      { text: '}', color: 'text-cyan-600 dark:text-cyan-400 font-semibold' },
      { text: '// Render frame budget: 16.6ms (120 FPS target)', color: 'text-emerald-600 dark:text-emerald-400 font-bold' },
    ],
  },
]

export function TechBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(125,211,252,.42),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(56,189,248,.30),transparent_32%),radial-gradient(circle_at_52%_86%,rgba(191,219,254,.42),transparent_36%),linear-gradient(180deg,rgba(255,255,255,.92),rgba(226,246,255,.78))] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(59,130,246,.18),transparent_32%),linear-gradient(180deg,rgba(6,17,29,.98),rgba(8,22,38,.96))]" />
      <div className="academy-grid absolute inset-0" />
      <div className="ai-orbit left-[8%] top-[17%]" />
      <div className="ai-orbit ai-orbit-alt right-[10%] top-[12%]" />
      <DeveloperCodeStream />
      <div className="particle-field absolute inset-0">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            style={
              {
                '--x': `${(index * 13 + 6) % 94}%`,
                '--y': `${(index * 23 + 12) % 88}%`,
                '--delay': `${index * 0.75}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </div>
  )
}

function DeveloperCodeStream() {
  return (
    <div className="developer-code-stream">
      {developerColumns.map((col, colIndex) => (
        <div
          key={colIndex}
          className={`developer-code-column ${col.className ?? ''}`}
          style={{ left: col.left }}
        >
          <div
            className="developer-code-track"
            style={
              {
                '--duration': col.duration,
                '--delay': col.delay,
              } as CSSProperties
            }
          >
            <div className="space-y-1.5 pb-8">
              {col.lines.map((line, lineIndex) => (
                <div key={lineIndex} className={line.color}>
                  {line.text}
                </div>
              ))}
            </div>
            <div className="space-y-1.5 pb-8" aria-hidden="true">
              {col.lines.map((line, lineIndex) => (
                <div key={`dup-${lineIndex}`} className={line.color}>
                  {line.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
