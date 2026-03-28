import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/ugc/conversion
// Called by the merchant's site when an order is placed
// body: { ref: string, revenue: number, order_id?: string }
export async function POST(req: NextRequest) {
  try {
    const { ref, revenue } = await req.json()
    if (!ref || !revenue) return NextResponse.json({ error: 'ref and revenue required' }, { status: 400 })

    const { data } = await supabase.from('ugc_campaigns').select('id,orders,revenue').eq('utm_code', ref).single()
    if (!data) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })

    await supabase.from('ugc_campaigns').update({
      orders: (data.orders || 0) + 1,
      revenue: (data.revenue || 0) + parseFloat(revenue),
    }).eq('id', data.id)

    return NextResponse.json({ recorded: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}