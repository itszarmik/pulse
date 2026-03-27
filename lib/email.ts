import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Pulse <onboarding@resend.dev>'

export async function sendWelcomeEmail(to: string, name?: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Pulse — your AI campaign dashboard',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Welcome to Pulse</title></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13161d;border-radius:16px;overflow:hidden;border:1px solid #1e2130;">
    <div style="background:linear-gradient(135deg,#0d0f14,#13161d);padding:40px 40px 32px;text-align:center;border-bottom:1px solid #1e2130;">
      <div style="width:48px;height:48px;background:#00d4a0;border-radius:12px;margin:0 auto 16px;display:inline-flex;align-items:center;justify-content:center;">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none"><path d="M2 8L8 2L14 8L8 14L2 8Z" fill="white"/><path d="M5 8L8 5L11 8L8 11L5 8Z" fill="#0d0f14"/></svg>
      </div>
      <h1 style="color:#e8eaf0;font-size:24px;font-weight:700;margin:0;letter-spacing:-0.5px;">Welcome to Pulse${name ? ', ' + name : ''}!</h1>
      <p style="color:#8b90a0;font-size:14px;margin:8px 0 0;">Your AI-powered campaign dashboard is ready</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#c8cad4;font-size:15px;line-height:1.6;margin:0 0 24px;">You're all set. Here's what you can do with Pulse right now:</p>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:32px;">
        ${[
          ['📊', 'Track ROAS', 'Monitor campaign performance across Meta, Google and TikTok'],
          ['🤖', 'AI Analysis', 'Get Claude-powered insights on which campaigns to scale or pause'],
          ['✨', 'Ad Variants', 'Generate 5 high-converting ad copy variants in seconds'],
          ['🏢', 'Client Accounts', 'Manage all your clients from one workspace'],
        ].map(([icon, title, desc]) => `
          <div style="background:#1a1d26;border-radius:10px;padding:16px;display:flex;gap:12px;align-items:flex-start;">
            <span style="font-size:20px;flex-shrink:0;">${icon}</span>
            <div><div style="color:#e8eaf0;font-size:13px;font-weight:600;margin-bottom:2px;">${title}</div>
            <div style="color:#8b90a0;font-size:12px;">${desc}</div></div>
          </div>`).join('')}
      </div>
      <div style="text-align:center;margin-bottom:32px;">
        <a href="https://pulse-ruddy-psi.vercel.app" style="display:inline-block;background:#00d4a0;color:#001a12;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Go to your dashboard →</a>
      </div>
      <p style="color:#8b90a0;font-size:12px;line-height:1.5;margin:0;border-top:1px solid #1e2130;padding-top:24px;">
        Questions? Reply to this email and we'll help you out.<br>
        <a href="https://pulse-ruddy-psi.vercel.app" style="color:#00d4a0;text-decoration:none;">pulse-ruddy-psi.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}

export async function sendPaymentConfirmationEmail(to: string, plan: string, amount: string) {
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  return resend.emails.send({
    from: FROM,
    to,
    subject: `Payment confirmed — Pulse ${planLabel} Plan`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Payment Confirmed</title></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13161d;border-radius:16px;overflow:hidden;border:1px solid #1e2130;">
    <div style="padding:40px;text-align:center;border-bottom:1px solid #1e2130;">
      <div style="width:56px;height:56px;background:rgba(0,212,160,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(0,212,160,0.3);">
        <span style="font-size:24px;">✓</span>
      </div>
      <h1 style="color:#e8eaf0;font-size:22px;font-weight:700;margin:0 0 8px;">Payment confirmed</h1>
      <p style="color:#8b90a0;font-size:14px;margin:0;">Your Pulse subscription is now active</p>
    </div>
    <div style="padding:40px;">
      <div style="background:#1a1d26;border-radius:12px;padding:24px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#8b90a0;font-size:13px;">Plan</span>
          <span style="color:#00d4a0;font-size:13px;font-weight:600;">${planLabel}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
          <span style="color:#8b90a0;font-size:13px;">Amount</span>
          <span style="color:#e8eaf0;font-size:13px;font-weight:600;">${amount}/month</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#8b90a0;font-size:13px;">Billing</span>
          <span style="color:#e8eaf0;font-size:13px;">Monthly, cancel anytime</span>
        </div>
      </div>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="https://pulse-ruddy-psi.vercel.app" style="display:inline-block;background:#00d4a0;color:#001a12;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Go to dashboard →</a>
      </div>
      <p style="color:#8b90a0;font-size:12px;line-height:1.5;margin:0;border-top:1px solid #1e2130;padding-top:24px;">
        Manage your subscription any time from the <a href="https://pulse-ruddy-psi.vercel.app/billing" style="color:#00d4a0;text-decoration:none;">Billing page</a>.
      </p>
    </div>
  </div>
</body>
</html>`,
  })
}

export async function sendCancellationEmail(to: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Your Pulse subscription has been cancelled',
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Subscription Cancelled</title></head>
<body style="margin:0;padding:0;background:#0d0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#13161d;border-radius:16px;overflow:hidden;border:1px solid #1e2130;">
    <div style="padding:40px;text-align:center;">
      <h1 style="color:#e8eaf0;font-size:22px;font-weight:700;margin:0 0 12px;">Subscription cancelled</h1>
      <p style="color:#8b90a0;font-size:14px;margin:0 0 28px;line-height:1.6;">
        Your Pulse subscription has been cancelled. You'll keep access until the end of your current billing period.
      </p>
      <p style="color:#c8cad4;font-size:14px;margin:0 0 28px;line-height:1.6;">
        We'd love to have you back. Your data is saved and ready whenever you return.
      </p>
      <a href="https://pulse-ruddy-psi.vercel.app/billing" style="display:inline-block;background:#00d4a0;color:#001a12;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;">Reactivate subscription →</a>
    </div>
  </div>
</body>
</html>`,
  })
}
