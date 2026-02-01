// src/components/seo/SEOQuickActionsBar.jsx
// Quick actions toolbar for common SEO operations
// MIGRATED TO REACT QUERY - Jan 29, 2026
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  Globe, 
  Target, 
  Zap,
  Search,
  FileCode,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import SignalIcon from '@/components/ui/SignalIcon'
import { UptradeSpinner } from '@/components/UptradeLoading'
import { cn } from '@/lib/utils'
import { seoApi } from '@/lib/portal-api'
import { useQueryClient } from '@tanstack/react-query'
import { seoPageKeys, seoOpportunityKeys, seoGSCKeys, seoTechnicalKeys, seoContentKeys } from '@/hooks/seo'

/**
 * Quick Actions Bar - One-click actions for common SEO tasks
 * Shows on dashboard overview for easy access
 */
export default function SEOQuickActionsBar({ 
  projectId, 
  domain,
  onActionComplete,
  className 
}) {
  const queryClient = useQueryClient()
  
  // Helper to invalidate all related queries after an action
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: seoPageKeys.list(projectId) })
    queryClient.invalidateQueries({ queryKey: seoOpportunityKeys.list(projectId) })
    queryClient.invalidateQueries({ queryKey: ['seo', 'gsc'] })
    queryClient.invalidateQueries({ queryKey: seoTechnicalKeys.cwv(projectId) })
  }

  const [actionStates, setActionStates] = useState({})

  const setActionState = (actionId, state) => {
    setActionStates(prev => ({ ...prev, [actionId]: state }))
  }

  const handleAction = async (actionId, actionFn, successMessage) => {
    setActionState(actionId, 'loading')
    try {
      await actionFn()
      setActionState(actionId, 'success')
      onActionComplete?.(actionId, successMessage)
      // Reset after delay
      setTimeout(() => setActionState(actionId, null), 2000)
    } catch (error) {
      console.error(`Action ${actionId} failed:`, error)
      setActionState(actionId, 'error')
      setTimeout(() => setActionState(actionId, null), 3000)
    }
  }

  const actions = [
    {
      id: 'sync-gsc',
      label: 'Sync GSC',
      icon: RefreshCw,
      description: 'Fetch latest Search Console data',
      action: async () => {
        if (projectId) {
          await seoApi.syncGsc(projectId)
          queryClient.invalidateQueries({ queryKey: ['seo', 'gsc'] })
        }
      }
    },
    {
      id: 'crawl-sitemap',
      label: 'Crawl Sitemap',
      icon: Globe,
      description: 'Re-crawl all pages from sitemap',
      action: async () => {
        if (projectId) {
          await seoApi.crawlSitemap(projectId)
          queryClient.invalidateQueries({ queryKey: seoPageKeys.list(projectId) })
        }
      }
    },
    {
      id: 'detect-opportunities',
      label: 'Find Opportunities',
      icon: Target,
      description: 'Scan for quick wins and issues',
      action: async () => {
        if (projectId) {
          await seoApi.detectOpportunities(projectId)
          queryClient.invalidateQueries({ queryKey: seoOpportunityKeys.list(projectId) })
        }
      }
    },
    {
      id: 'run-ai',
      label: 'Signal Analysis',
      icon: SignalIcon,
      description: 'Run comprehensive Signal analysis',
      variant: 'accent',
      action: async () => {
        if (projectId) {
          await seoApi.runAiBrain(projectId, { analysisType: 'comprehensive' })
          queryClient.invalidateQueries({ queryKey: seoContentKeys.aiInsights(projectId) })
        }
      }
    },
    {
      id: 'refresh-cwv',
      label: 'Check CWV',
      icon: Zap,
      description: 'Refresh Core Web Vitals',
      action: async () => {
        if (projectId) {
          queryClient.invalidateQueries({ queryKey: seoTechnicalKeys.cwv(projectId) })
        }
      }
    }
  ]

  const getButtonState = (actionId) => {
    const state = actionStates[actionId]
    if (state === 'loading') return { disabled: true, loading: true, icon: null, className: '' }
    if (state === 'success') return { disabled: false, loading: false, icon: CheckCircle, className: 'text-green-400' }
    if (state === 'error') return { disabled: false, loading: false, icon: AlertCircle, className: 'text-red-400' }
    return { disabled: false, loading: false, icon: null, className: '' }
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map(action => {
        const state = getButtonState(action.id)
        const Icon = state.icon || action.icon
        
        return (
          <Button
            key={action.id}
            variant={action.variant === 'accent' ? 'default' : 'outline'}
            size="sm"
            disabled={state.disabled}
            onClick={() => handleAction(action.id, action.action, `${action.label} complete`)}
            className={cn(
              action.variant === 'accent' && 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90',
              'relative group'
            )}
            title={action.description}
          >
            {state.loading ? (
              <UptradeSpinner size="sm" className="mr-2 [&_p]:hidden [&_svg]:!h-4 [&_svg]:!w-4" />
            ) : Icon ? (
              <Icon className={cn('h-4 w-4 mr-2', state.className)} />
            ) : null}
            {action.label}
            
            {/* Tooltip on hover */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {action.description}
            </span>
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Compact version for use in header/toolbar
 */
export function SEOQuickActionsCompact({ projectId, domain, onActionComplete }) {
  const queryClient = useQueryClient()
  const [running, setRunning] = useState(false)

  const handleFullScan = async () => {
    setRunning(true)
    try {
      await Promise.all([
        projectId && seoApi.syncGsc(projectId),
        projectId && seoApi.detectOpportunities(projectId)
      ])
      // Invalidate all SEO queries to refetch
      queryClient.invalidateQueries({ queryKey: ['seo'] })
      onActionComplete?.('full-scan', 'Full scan complete')
    } catch (error) {
      console.error('Full scan failed:', error)
    }
    setRunning(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFullScan}
      disabled={running}
    >
      {running ? (
        <UptradeSpinner size="sm" className="mr-2 [&_p]:hidden [&_svg]:!h-4 [&_svg]:!w-4" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      {running ? 'Scanning...' : 'Full Scan'}
    </Button>
  )
}
