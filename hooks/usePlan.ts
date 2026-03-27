'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Plan = 'free' | 'starter' | 'pro' | 'agency'

const PLAN_RANK: Record<Plan, number> = { free: 0, starter: 1, pro: 2, agency: 3 }

export function usePlan() {
  const { user, isLoaded } = useUser()
  const [plan, setPlan] = useState<Plan>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlan() {
      if (!isLoaded) return
      if (!user) { setPlan('free'); setLoading(false); return }
      try {
        const { data } = await supabase
          .from('user_plans')
          .select('plan')
          .eq('user_id', user.id)
          .single()
        setPlan((data?.plan as Plan) || 'free')
      } catch {
        setPlan('free')
      } finally {
        setLoading(false)
      }
    }
    fetchPlan()
  }, [user, isLoaded])

  const hasAccess = (required: Plan) => PLAN_RANK[plan] >= PLAN_RANK[required]

  return { plan, loading, hasAccess }
}
