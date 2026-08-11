import { useMemo, useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

const localSupportUrl = 'http://127.0.0.1:4173/support?embed=1&source=mediaplatform'
const productionSupportUrl = 'https://classcare-360.pages.dev/support?embed=1&source=mediaplatform'

function getSupportBase() {
  if (import.meta.env.VITE_SUPPORT_WIDGET_URL) return import.meta.env.VITE_SUPPORT_WIDGET_URL
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? localSupportUrl
    : productionSupportUrl
}

export function SupportWidget({ pageName }: { pageName: string }) {
  const [open, setOpen] = useState(false)
  const url = useMemo(() => {
    const value = new URL(getSupportBase())
    value.searchParams.set('embed', '1')
    value.searchParams.set('source', 'mediaplatform')
    value.searchParams.set('page_title', `MediaPlatform · ${pageName}`)
    value.searchParams.set('page_url', window.location.href)
    return value.toString()
  }, [pageName])

  return (
    <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 z-[90] sm:right-6">
      {open && (
        <section className="mb-3 h-[min(680px,82dvh)] w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-cyan-300/30 bg-slate-950 shadow-2xl shadow-slate-950/45">
          <iframe className="h-full w-full border-0" src={url} title="ติดต่อผู้ดูแล MediaPlatform" />
        </section>
      )}
      <button
        aria-expanded={open}
        aria-label={open ? 'ปิดแชทช่วยเหลือ' : 'ติดต่อผู้ดูแลระบบ'}
        className="group relative ml-auto grid h-15 w-15 place-items-center rounded-full border border-white/30 bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-700 text-white shadow-2xl shadow-sky-900/35 transition hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="absolute inset-[-6px] -z-10 rounded-full bg-cyan-400/20 blur-md transition group-hover:bg-cyan-300/35" />
        {open ? <X size={25} /> : <MessageCircle fill="currentColor" size={27} />}
      </button>
    </div>
  )
}
