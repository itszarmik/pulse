# Pulse — AI-Powered Campaign Dashboard

A Next.js 14 rebuild of Pulse: campaign tracking, ROAS metrics, and AI-powered optimisation across Meta, Google, and TikTok Ads.

## Tech Stack
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **Recharts** + **Lucide React**
- **Anthropic SDK** (AI analysis & ad variants)

## Quick Start
```bash
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```
Open http://localhost:3000

## Features
| Feature | Status |
|---|---|
| Dashboard with ROAS hero KPI | ✅ |
| Spend vs Revenue chart | ✅ |
| Platform breakdown donut | ✅ |
| Filterable campaign table | ✅ |
| AI analysis (real API call) | ✅ |
| Date range selector | ✅ |
| Import page with CSV drag-drop | ✅ |
| Platform connect/disconnect | ✅ |
| Ad Variant Generator (AI) | ✅ |
| Client Accounts manager | ✅ |
| Billing & plan management | ✅ |
| Settings with toggles | ✅ |

## Deploy to Vercel
```bash
npm install -g vercel && vercel
```
Add `ANTHROPIC_API_KEY` in your Vercel environment variables.

## Next Steps
- Add **Clerk** or **NextAuth** for auth
- Connect **Supabase** for a real database
- Wire up **Meta/Google/TikTok Marketing APIs** for live data
