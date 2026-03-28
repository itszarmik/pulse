import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  const redirect = req.nextUrl.searchParams.get('to') || '/'

  if (ref) {
    // Increment click count for this UTM code
    await supabase.rpc('increment_ugc_clicks', { utm: ref }).catch(() => {
      // Fallback: direct update
      supabase.from('ugc_campaigns').select('id,clicks').eq('utm_code', ref).single().then(({ data }) => {
        if (data) supabase.from('ugc_campaigns').update({ clicks: (data.clicks || 0) + 1 }).eq('id', data.id)
      })
    })
  }

  return NextResponse.redirect(redirect)
}