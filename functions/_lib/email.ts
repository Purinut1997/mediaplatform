import type { Env } from './db'

export function emailStatus(env: Env) {
  return {
    configured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM && env.APP_URL),
    apiKeyConfigured: Boolean(env.RESEND_API_KEY),
    fromConfigured: Boolean(env.EMAIL_FROM),
    appUrlConfigured: Boolean(env.APP_URL),
  }
}

export function emailHtmlText(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
) {
  if (!emailStatus(env).configured) return false
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, html }),
  })
  return response.ok
}
