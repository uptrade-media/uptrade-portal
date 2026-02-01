// src/components/commerce/CommerceModuleWrapper.jsx
// Wrapper for embedding Commerce module in MainLayout
// MIGRATED TO REACT QUERY HOOKS - Jan 29, 2026

import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCommerceSettings } from '@/lib/hooks'
import useAuthStore from '@/lib/auth-store'
import CommerceDashboard from '@/pages/commerce/CommerceDashboard'

export default function CommerceModuleWrapper({ onNavigate }) {
  const { currentProject } = useAuthStore()
  // React Query hook - auto-fetches settings
  const { data: settings } = useCommerceSettings(currentProject?.id)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const match = location.pathname.match(/^\/commerce\/offerings\/([^/]+)(?:\/(edit))?$/)
    if (match) {
      const offeringId = match[1]
      const isEdit = match[2] === 'edit'
      const params = new URLSearchParams({
        view: 'offering',
        offeringId,
      })
      if (isEdit) {
        params.set('mode', 'edit')
      }
      navigate(`/commerce?${params.toString()}`, { replace: true })
    }
  }, [location.pathname, navigate])

  return <CommerceDashboard onNavigate={onNavigate} />
}
