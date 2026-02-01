// src/pages/forms/components/AnalyticsView.jsx
// Form analytics with conversion funnels, field analytics, and submission trends

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns'

// Simple bar chart component (in production, use recharts or similar)
function SimpleBarChart({ data, height = 120 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-sm text-[var(--text-tertiary)]">No data</p>
      </div>
    )
  }
  
  const max = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((item, i) => (
        <div 
          key={i}
          className="flex-1 flex flex-col items-center gap-1"
        >
          <div 
            className="w-full rounded-t transition-all hover:opacity-80"
            style={{ 
              height: `${(item.value / max) * 100}%`,
              minHeight: item.value > 0 ? 4 : 0,
              backgroundColor: 'var(--brand-primary)'
            }}
          />
          <span className="text-[10px] text-[var(--text-tertiary)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ title, value, change, changeLabel, icon: Icon, isLoading }) {
  const isPositive = change >= 0
  
  return (
    <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-[var(--text-tertiary)]">{title}</p>
            {isLoading ? (
              <Skeleton className="h-7 w-16 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{value}</p>
            )}
          </div>
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
          >
            <Icon className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
          </div>
        </div>
        
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              "text-xs font-medium",
              isPositive ? "text-emerald-500" : "text-red-500"
            )}>
              {isPositive ? '+' : ''}{change}%
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ConversionFunnel({ formId, projectId }) {
  const [funnel, setFunnel] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (formId || projectId) {
      loadFunnel()
    }
  }, [formId, projectId])
  
  async function loadFunnel() {
    setIsLoading(true)
    try {
      // In production, this would query form_analytics for view/start/complete events
      // For now, we'll use placeholder data
      setFunnel({
        views: 1250,
        starts: 420,
        completions: 185,
        viewToStartRate: 33.6,
        startToCompleteRate: 44.0,
        overallRate: 14.8,
      })
    } catch (err) {
      console.error('Failed to load funnel:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  
  if (!funnel) return null
  
  const steps = [
    { label: 'Form Views', value: funnel.views, rate: null },
    { label: 'Started', value: funnel.starts, rate: funnel.viewToStartRate },
    { label: 'Completed', value: funnel.completions, rate: funnel.startToCompleteRate },
  ]
  
  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const maxValue = steps[0].value
        const width = (step.value / maxValue) * 100
        
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--text-secondary)]">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {step.value.toLocaleString()}
                </span>
                {step.rate !== null && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    ({step.rate}%)
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 bg-[var(--glass-border)] rounded-lg overflow-hidden">
              <div 
                className="h-full rounded-lg transition-all duration-500"
                style={{ 
                  width: `${width}%`,
                  backgroundColor: 'var(--brand-primary)',
                  opacity: 1 - (index * 0.2)
                }}
              />
            </div>
          </div>
        )
      })}
      
      <div className="mt-4 p-3 rounded-lg bg-[var(--glass-bg-hover)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Overall Conversion Rate</span>
          <span className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>
            {funnel.overallRate}%
          </span>
        </div>
      </div>
    </div>
  )
}

function FieldAnalytics({ formId, projectId }) {
  const [fields, setFields] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (formId || projectId) {
      loadFieldAnalytics()
    }
  }, [formId, projectId])
  
  async function loadFieldAnalytics() {
    setIsLoading(true)
    try {
      // In production, query form_analytics for field interaction data
      // Placeholder data for now
      setFields([
        { name: 'Email', dropoffRate: 5, avgTime: 8 },
        { name: 'Name', dropoffRate: 3, avgTime: 6 },
        { name: 'Phone', dropoffRate: 12, avgTime: 10 },
        { name: 'Company', dropoffRate: 8, avgTime: 7 },
        { name: 'Message', dropoffRate: 15, avgTime: 45 },
      ])
    } catch (err) {
      console.error('Failed to load field analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return <Skeleton className="h-40 w-full" />
  }
  
  return (
    <div className="space-y-3">
      {fields.map((field) => (
        <div 
          key={field.name}
          className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-bg-hover)]"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">{field.name}</span>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-[var(--text-tertiary)]">Drop-off</p>
              <p className={cn(
                "text-sm font-medium",
                field.dropoffRate > 10 ? "text-red-500" : "text-[var(--text-secondary)]"
              )}>
                {field.dropoffRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-tertiary)]">Avg Time</p>
              <p className="text-sm font-medium text-[var(--text-secondary)]">{field.avgTime}s</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsView({ projectId, forms = [] }) {
  const [selectedForm, setSelectedForm] = useState('all')
  const [dateRange, setDateRange] = useState('7d')
  const [stats, setStats] = useState(null)
  const [chartData, setChartData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (projectId) {
      loadAnalytics()
    }
  }, [projectId, selectedForm, dateRange])
  
  async function loadAnalytics() {
    setIsLoading(true)
    try {
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
      const startDate = subDays(new Date(), days)
      
      // Get submissions in date range
      let query = supabase
        .from('form_submissions')
        .select('id, created_at, quality_tier, lead_score')
        .eq('project_id', projectId)
        .gte('created_at', startDate.toISOString())
      
      if (selectedForm !== 'all') {
        query = query.eq('form_id', selectedForm)
      }
      
      const { data: submissions } = await query
      
      // Calculate stats
      const totalSubmissions = submissions?.length || 0
      const highIntentCount = submissions?.filter(s => s.quality_tier === 'high').length || 0
      const avgLeadScore = submissions?.length 
        ? Math.round(submissions.reduce((sum, s) => sum + (s.lead_score || 50), 0) / submissions.length)
        : 0
      
      setStats({
        totalSubmissions,
        highIntentCount,
        avgLeadScore,
        conversionRate: 14.8, // Would come from form_analytics
      })
      
      // Build chart data by day
      const interval = eachDayOfInterval({ start: startDate, end: new Date() })
      const dataByDay = interval.map(day => {
        const count = submissions?.filter(s => {
          const subDate = new Date(s.created_at)
          return subDate >= startOfDay(day) && subDate <= endOfDay(day)
        }).length || 0
        
        return {
          label: format(day, 'd'),
          value: count,
        }
      })
      
      setChartData(dataByDay)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={selectedForm} onValueChange={setSelectedForm}>
            <SelectTrigger className="w-[200px] bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <SelectValue placeholder="All Forms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Forms</SelectItem>
              {forms.map((form) => (
                <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submissions"
          value={stats?.totalSubmissions || 0}
          change={12}
          changeLabel="vs prev period"
          icon={FileText}
          isLoading={isLoading}
        />
        <StatCard
          title="Conversion Rate"
          value={`${stats?.conversionRate || 0}%`}
          change={-2.3}
          changeLabel="vs prev period"
          icon={Target}
          isLoading={isLoading}
        />
        <StatCard
          title="High Intent Leads"
          value={stats?.highIntentCount || 0}
          change={8}
          changeLabel="vs prev period"
          icon={Zap}
          isLoading={isLoading}
        />
        <StatCard
          title="Avg Lead Score"
          value={stats?.avgLeadScore || 0}
          icon={BarChart3}
          isLoading={isLoading}
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions Over Time */}
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              Submissions Over Time
            </CardTitle>
            <CardDescription className="text-[var(--text-tertiary)]">
              Daily submission volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart data={chartData} height={160} />
          </CardContent>
        </Card>
        
        {/* Conversion Funnel */}
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
              Conversion Funnel
            </CardTitle>
            <CardDescription className="text-[var(--text-tertiary)]">
              View → Start → Complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversionFunnel 
              formId={selectedForm !== 'all' ? selectedForm : null} 
              projectId={projectId} 
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Field Analytics */}
      <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[var(--text-primary)]">
            Field Performance
          </CardTitle>
          <CardDescription className="text-[var(--text-tertiary)]">
            Drop-off rates and average time per field
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldAnalytics 
            formId={selectedForm !== 'all' ? selectedForm : null} 
            projectId={projectId} 
          />
        </CardContent>
      </Card>
      </div>
    </ScrollArea>
  )
}
