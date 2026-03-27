import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err: any) {
    console.error('Webhook error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        if (userId && plan) {
          const { error } = await supabase.from('user_plans').upsert({
            user_id: userId,
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          if (error) console.error('Supabase error:', error)
          else console.log(`Plan activated: ${userId} -> ${plan}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          await supabase.from('user_plans').upsert({
            user_id: userId,
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          console.log(`Subscription cancelled: ${userId} -> free`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId && sub.status !== 'active') {
          await supabase.from('user_plans').upsert({
            user_id: userId,
            plan: 'free',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        }
        break
      }
    }
  } catch (err: any) {
    console.error('Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
