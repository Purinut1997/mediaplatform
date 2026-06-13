import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void }) => string
    }
  }
}

export function AuthBotCheck({
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
