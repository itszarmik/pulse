import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendPaymentConfirmationEmail, sendCancellationEmail } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const AMOUNTS: Record<string, string> = { starter: '£99', pro: '£499', agency: '£1,999' }

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
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        const email = session.customer_details?.email
        if (userId && plan) {
          await supabase.from('user_plans').upsert({
            user_id: userId, plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          if (email) {
            await sendPaymentConfirmationEmail(email, plan, AMOUNTS[plan] || '').catch(console.error)
          }
        }
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId) {
          await supabase.from('user_plans').upsert({
            user_id: userId, plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
          try {
            const customer = await stripe.customers.retrieve(sub.customer as string)
            if (!customer.deleted && 'email' in customer && customer.email) {
              await sendCancellationEmail(customer.email).catch(console.error)
            }
          } catch {}
        }
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (userId && sub.status !== 'active') {
          await supabase.from('user_plans').upsert({
            user_id: userId, plan: 'free',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        }
        break
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}