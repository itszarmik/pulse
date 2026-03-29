'use client'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useWorkspace() {
  const { user, isLoaded } = useUser()
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [role, setRole] = useState<string>('owner')
  const [loading, setLoading] = useState(true)
  const [workspaceName, setWorkspaceName] = useState<string>('')

  useEffect(() => {
    async function resolve() {
      if (!isLoaded || !user) { setLoading(false); return }

      // Check if this user is a member of someone else's workspace
      const { data: membership } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, status')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .single()

      if (membership) {
        setWorkspaceId(membership.workspace_id)
        setRole(membership.role)
      } else {
        // They are the owner of their own workspace
        setWorkspaceId(user.id)
        setRole('owner')
      }
      setLoading(false)
    }
    resolve()
  }, [user, isLoaded])

  const isOwner = role === 'owner'
  const canEdit = role === 'owner' || role === 'editor'

  return { workspaceId, role, isOwner, canEdit, loading }
}