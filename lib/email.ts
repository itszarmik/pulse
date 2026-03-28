import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pulse <onboarding@resend.dev>'

function baseTemplate(content: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13161d;border-radius:16px;overflow:hidden;border:1px solid #1e2130;">
    <div style="padding:24px 32px;border-bottom:1px solid #1e2130;display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;background:#00d4a0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
      </div>
      <span style="color:#e8eaf0;font-weight:700;font-size:16px;font-family:monospace;">Pulse</span>
    </div>
    <div style="padding:32px;">${content}</div>
    <div style="padding:16px 32px;border-top:1px solid #1e2130;">
      <a href="https://pulse-ruddy-psi.vercel.app" style="color:#00d4a0;text-decoration:none;font-size:12px;">pulse-ruddy-psi.vercel.app</a>
    </div>
  </div>
</body></html>`
}

export async function sendWelcomeEmail(to: string, name?: string) {
  return resend.emails.send({
    from: FROM, to,
    subject: 'Welcome to Pulse — your AI campaign dashboard',
    html: baseTemplate(`
      <h1 style="color:#e8eaf0;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to Pulse${name ? ', ' + name : ''}!</h1>
      <p style="color:#8b90a0;font-size:14px;margin:0 0 24px;">Your AI-powered campaign dashboard is ready.</p>
      ${[['📊','Track ROAS','Monitor campaigns across Meta, Google and TikTok'],['🤖','AI Analysis','Get Claude-powered insights on your campaigns'],['✨','Ad Variants','Generate high-converting ad copy in seconds'],['🏢','Client Accounts','Manage all your clients from one workspace']].map(([icon,title,desc]) => `<div style="background:#1a1d26;border-radius:10px;padding:14px;margin-bottom:10px;display:flex;gap:12px;"><span style="font-size:18px;">${icon}</span><div><div style="color:#e8eaf0;font-size:13px;font-weight:600;">${title}</div><div style="color:#8b90a0;font-size:12px;">${desc}</div></div></div>`).join('')}
      <div style="text-align:center;margin-top:24px;"><a href="https://pulse-ruddy-psi.vercel.app" style="background:#00d4a0;color:#001a12;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">Go to your dashboard →</a></div>`),
  })
}

export async function sendPaymentConfirmationEmail(to: string, plan: string, amount: string) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  return resend.emails.send({
    from: FROM, to,
    subject: `Payment confirmed — Pulse ${planLabel} Plan`,
    html: baseTemplate(`
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:48px;height:48px;background:rgba(0,212,160,0.15);border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(0,212,160,0.3);">✓</div>
        <h1 style="color:#e8eaf0;font-size:20px;font-weight:700;margin:0 0 4px;">Payment confirmed</h1>
        <p style="color:#8b90a0;font-size:13px;margin:0;">Your subscription is now active</p>
      </div>
      <div style="background:#1a1d26;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#8b90a0;font-size:13px;">Plan</span><span style="color:#00d4a0;font-size:13px;font-weight:600;">${planLabel}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><span style="color:#8b90a0;font-size:13px;">Amount</span><span style="color:#e8eaf0;font-size:13px;font-weight:600;">${amount}/month</span></div>
        <div style="display:flex;justify-content:space-between;"><span style="color:#8b90a0;font-size:13px;">Billing</span><span style="color:#e8eaf0;font-size:13px;">Monthly, cancel anytime</span></div>
      </div>
      <div style="text-align:center;"><a href="https://pulse-ruddy-psi.vercel.app" style="background:#00d4a0;color:#001a12;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">Go to dashboard →</a></div>`),
  })
}

export async function sendCancellationEmail(to: string) {
  return resend.emails.send({
    from: FROM, to,
    subject: 'Your Pulse subscription has been cancelled',
    html: baseTemplate(`
      <h1 style="color:#e8eaf0;font-size:20px;font-weight:700;margin:0 0 12px;">Subscription cancelled</h1>
      <p style="color:#8b90a0;font-size:13px;line-height:1.6;margin:0 0 16px;">Your Pulse subscription has been cancelled. You'll keep access until the end of your current billing period.</p>
      <p style="color:#c8cad4;font-size:13px;margin:0 0 24px;">We'd love to have you back. Your data is saved and ready whenever you return.</p>
      <div style="text-align:center;"><a href="https://pulse-ruddy-psi.vercel.app/billing" style="background:#00d4a0;color:#001a12;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">Reactivate subscription →</a></div>`),
  })
}

export async function sendAlertEmail(to: string, message: string) {
  const isPositive = message.includes('🚀') || message.includes('spike') || message.includes('Top performer')
  return resend.emails.send({
    from: FROM, to,
    subject: isPositive ? '🚀 Pulse Alert: Top performer detected' : '⚠️ Pulse Alert: Campaign needs attention',
    html: baseTemplate(`
      <div style="background:${isPositive ? 'rgba(0,212,160,0.08)' : 'rgba(255,92,92,0.08)'};border:1px solid ${isPositive ? 'rgba(0,212,160,0.25)' : 'rgba(255,92,92,0.25)'};border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="font-size:24px;margin-bottom:8px;">${isPositive ? '🚀' : '⚠️'}</div>
        <h2 style="color:#e8eaf0;font-size:16px;font-weight:700;margin:0 0 8px;">Campaign Alert</h2>
        <p style="color:#c8cad4;font-size:13px;margin:0;line-height:1.6;">${message}</p>
      </div>
      <div style="text-align:center;"><a href="https://pulse-ruddy-psi.vercel.app" style="background:#00d4a0;color:#001a12;padding:12px 28px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">View dashboard →</a></div>`),
  })
}