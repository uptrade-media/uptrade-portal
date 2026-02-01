// src/components/engage/dashboard/EngageOverview.jsx
// Overview/highlights view for Engage dashboard

import { useMemo } from 'react'
import { useBrandColors } from '@/hooks/useBrandColors'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Eye,
  MousePointerClick,
  TrendingUp,
  Layers,
  MessageSquare,
  Megaphone,
  Sparkles,
  Bell,
  PanelBottom,
  ArrowUpRight,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// Element type configurations
const ELEMENT_TYPES = {
  popup: { label: 'Popup', icon: MessageSquare, color: 'blue' },
  banner: { label: 'Banner', icon: Megaphone, color: 'orange' },
  nudge: { label: 'Nudge', icon: Sparkles, color: 'purple' },
  toast: { label: 'Toast', icon: Bell, color: 'green' },
  'slide-in': { label: 'Slide-in', icon: PanelBottom, color: 'teal' }
}

const COLOR_CLASSES = {
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
}

export default function EngageOverview({
  elements = [],
  stats,
  isLoading,
  onEdit,
  onCreate
}) {
  const brandColors = useBrandColors()
  
  // Recent elements
  const recentElements = useMemo(() => {
    return [...elements]
      .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
      .slice(0, 6)
  }, [elements])
  
  // Active elements
  const activeElements = useMemo(() => {
    return elements.filter(e => e.is_active)
  }, [elements])
  
  // Count by type
  const countByType = useMemo(() => {
    return elements.reduce((acc, el) => {
      const type = el.element_type || 'popup'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
  }, [elements])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Elements</p>
                <p className="text-2xl font-bold">{elements.length}</p>
              </div>
              <div 
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: `color-mix(in srgb, ${brandColors.primary} 15%, transparent)` }}
              >
                <Layers className="h-5 w-5" style={{ color: brandColors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeElements.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Play className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Impressions (30d)</p>
                <p className="text-2xl font-bold">{(stats?.totalImpressions || 0).toLocaleString()}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{(stats?.conversionRate || 0).toFixed(1)}%</p>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Elements */}
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Recent Elements</CardTitle>
              <CardDescription>Recently created or updated</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onCreate('popup')}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </CardHeader>
          <CardContent>
            {recentElements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No elements yet</p>
                <Button variant="link" onClick={() => onCreate('popup')} className="mt-2">
                  Create your first element
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentElements.map((element) => {
                  const typeConfig = ELEMENT_TYPES[element.element_type] || ELEMENT_TYPES.popup
                  const Icon = typeConfig.icon
                  
                  return (
                    <button
                      key={element.id}
                      onClick={() => onEdit(element)}
                      className="flex items-center justify-between w-full p-3 rounded-lg bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", COLOR_CLASSES[typeConfig.color])}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{element.name || 'Untitled'}</p>
                          <p className="text-xs text-muted-foreground">
                            {element.headline?.substring(0, 40) || typeConfig.label}
                            {element.headline?.length > 40 && '...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={element.is_active ? 'default' : 'secondary'} className="text-xs">
                          {element.is_active ? 'Active' : 'Draft'}
                        </Badge>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Elements by Type */}
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Elements by Type</CardTitle>
            <CardDescription>Distribution of your engage elements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ELEMENT_TYPES).map(([type, config]) => {
                const count = countByType[type] || 0
                const percentage = elements.length > 0 
                  ? (count / elements.length * 100).toFixed(0) 
                  : 0
                const Icon = config.icon
                
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", COLOR_CLASSES[config.color])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{config.label}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-[var(--surface-tertiary)] rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all", {
                            'bg-blue-500': config.color === 'blue',
                            'bg-orange-500': config.color === 'orange',
                            'bg-purple-500': config.color === 'purple',
                            'bg-green-500': config.color === 'green',
                            'bg-teal-500': config.color === 'teal',
                          })}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Create common element types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(ELEMENT_TYPES).map(([type, config]) => {
              const Icon = config.icon
              
              return (
                <Button
                  key={type}
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 hover:border-[var(--brand-primary)]"
                  onClick={() => onCreate(type)}
                >
                  <div className={cn("p-2 rounded-lg", COLOR_CLASSES[config.color])}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{config.label}</span>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
