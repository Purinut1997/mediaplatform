import type { Env } from './db'

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string,
) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return false
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
