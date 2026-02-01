// LocationROIDashboard.jsx
// Premium ROI attribution dashboard for location pages
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  MessageCircle,
  FileText,
  Target,
  Award,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MapPin,
  RefreshCw,
  Download,
  Filter,
  ChevronRight,
  Zap,
  Eye,
  MousePointer,
  Sparkles,
  Clock,
  Calculator,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { locationPagesApi } from '@/lib/portal-api'

// Animated counter component
function AnimatedCounter({ value, prefix = '', suffix = '', decimals = 0, duration = 1 }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue
    const diff = value - startValue
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + diff * eased
      
      setDisplayValue(current)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value])
  
  return (
    <span>
      {prefix}
      {decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString()}
      {suffix}
    </span>
  )
}

// Big stat card with gradient
function BigStatCard({ icon: Icon, label, value, change, trend, prefix = '', suffix = '', color = 'primary' }) {
  const colors = {
    primary: 'from-[var(--brand-primary)] to-[var(--brand-secondary)]',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-400 to-orange-500',
    purple: 'from-purple-500 to-violet-600',
  }
  
  const isPositive = change >= 0
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-6"
    >
      {/* Background gradient accent */}
      <div 
        className={cn(
          "absolute top-0 right-0 w-32 h-32 opacity-10 blur-2xl rounded-full",
          `bg-gradient-to-br ${colors[color]}`
        )}
      />
      
      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-4xl font-bold mt-2">
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-3">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-sm text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div 
          className={cn(
            "p-4 rounded-2xl bg-gradient-to-br",
            colors[color]
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

// Conversion breakdown mini chart
function ConversionBreakdown({ leads, calls, forms, chats }) {
  const total = leads + calls + forms + chats
  if (total === 0) return null
  
  const data = [
    { label: 'Leads', value: leads, color: 'bg-blue-500' },
    { label: 'Calls', value: calls, color: 'bg-green-500' },
    { label: 'Forms', value: forms, color: 'bg-purple-500' },
    { label: 'Chats', value: chats, color: 'bg-amber-500' },
  ].filter(d => d.value > 0)
  
  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
        {data.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ width: 0 }}
            animate={{ width: `${(item.value / total) * 100}%` }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className={cn("h-full", item.color)}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {data.map(item => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", item.color)} />
            <span className="text-sm text-gray-600">
              {item.label}: <span className="font-medium">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Trend sparkline chart
function TrendChart({ data, height = 60 }) {
  if (!data || data.length < 2) {
    return (
      <div className="h-[60px] flex items-center justify-center text-gray-400 text-sm">
        Not enough data
      </div>
    )
  }
  
  const max = Math.max(...data.map(d => d.conversions))
  const min = Math.min(...data.map(d => d.conversions))
  const range = max - min || 1
  const width = 300
  
  // Create path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.conversions - min) / range) * (height - 10)
    return { x, y, ...d }
  })
  
  const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="trendGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#trendGradient)" />
      <path 
        d={pathD} 
        fill="none" 
        stroke="var(--brand-primary)" 
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="white"
          stroke="var(--brand-primary)"
          strokeWidth="2"
        />
      ))}
    </svg>
  )
}

// Top performer row
function TopPerformerRow({ location, rank }) {
  const medals = ['🥇', '🥈', '🥉']
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
    >
      <span className="text-2xl">{medals[rank] || `#${rank + 1}`}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{location.location_name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-sm text-gray-500">
            {location.conversions} conversions
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>
            ${location.revenue.toLocaleString()}
          </span>
        </div>
      </div>
      {location.growth !== 0 && (
        <Badge 
          variant="outline" 
          className={location.growth > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
        >
          {location.growth > 0 ? '+' : ''}{location.growth}%
        </Badge>
      )}
    </motion.div>
  )
}

// Location ROI row
function LocationROIRow({ location, onViewDetails }) {
  const roiPositive = location.roi.roi_percentage >= 0
  
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center">
      {/* Location */}
      <div className="col-span-3 flex items-center gap-3">
        <div 
          className="p-2 rounded-lg shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
        >
          <MapPin className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{location.location_name}</p>
          <p className="text-xs text-gray-500">{location.state}</p>
        </div>
      </div>
      
      {/* Traffic */}
      <div className="col-span-2 text-center">
        <p className="font-medium">{location.traffic.sessions.toLocaleString()}</p>
        <p className="text-xs text-gray-500">sessions</p>
      </div>
      
      {/* Conversions */}
      <div className="col-span-2 text-center">
        <p className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
          {location.totals.conversions}
        </p>
        <p className="text-xs text-gray-500">{location.totals.conversion_rate.toFixed(1)}% CVR</p>
      </div>
      
      {/* Revenue */}
      <div className="col-span-2 text-center">
        <p className="font-medium">${location.totals.revenue.toLocaleString()}</p>
      </div>
      
      {/* ROI */}
      <div className="col-span-2 text-center">
        <Badge 
          variant="outline" 
          className={cn(
            "font-medium",
            roiPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {roiPositive ? '+' : ''}{location.roi.roi_percentage.toFixed(0)}% ROI
        </Badge>
      </div>
      
      {/* Actions */}
      <div className="col-span-1 text-right">
        <Button variant="ghost" size="sm" onClick={() => onViewDetails?.(location)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Main component
export function LocationROIDashboard({ projectId }) {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [selectedLocation, setSelectedLocation] = useState(null)
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      if (!projectId) return
      
      setLoading(true)
      try {
        const data = await locationPagesApi.getProjectROIDashboard(projectId, period)
        setDashboard(data)
      } catch (error) {
        console.error('Failed to load ROI dashboard:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboard()
  }, [projectId, period])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto" />
          <p className="mt-4 text-gray-500">Loading ROI data...</p>
        </div>
      </div>
    )
  }
  
  if (!dashboard) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
        <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No ROI data yet
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Start tracking conversions from your location pages to see ROI attribution data here.
        </p>
      </div>
    )
  }
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="h-6 w-6" style={{ color: 'var(--brand-primary)' }} />
              ROI Attribution
            </h2>
            <p className="text-gray-500 mt-1">
              Track conversions and revenue from {dashboard.total_locations} location pages
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Big Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <BigStatCard
            icon={Target}
            label="Total Conversions"
            value={dashboard.totals.conversions}
            change={15} // Would come from comparison data
            color="primary"
          />
          <BigStatCard
            icon={DollarSign}
            label="Total Revenue"
            value={dashboard.totals.revenue}
            prefix="$"
            change={22}
            color="green"
          />
          <BigStatCard
            icon={TrendingUp}
            label="Avg. Conversion Rate"
            value={dashboard.totals.avg_conversion_rate}
            suffix="%"
            change={8}
            color="blue"
          />
          <BigStatCard
            icon={Calculator}
            label="Average ROI"
            value={dashboard.totals.roi_percentage}
            suffix="%"
            change={12}
            color="purple"
          />
        </div>
        
        {/* Conversion Breakdown & Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Conversion Breakdown
            </h3>
            <ConversionBreakdown
              leads={dashboard.totals.leads}
              calls={dashboard.totals.calls}
              forms={dashboard.totals.forms}
              chats={0}
            />
            
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="p-2 rounded-lg bg-blue-50 w-fit mx-auto mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{dashboard.totals.leads}</p>
                <p className="text-xs text-gray-500">Leads</p>
              </div>
              <div className="text-center">
                <div className="p-2 rounded-lg bg-green-50 w-fit mx-auto mb-2">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{dashboard.totals.calls}</p>
                <p className="text-xs text-gray-500">Calls</p>
              </div>
              <div className="text-center">
                <div className="p-2 rounded-lg bg-purple-50 w-fit mx-auto mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{dashboard.totals.forms}</p>
                <p className="text-xs text-gray-500">Forms</p>
              </div>
              <div className="text-center">
                <div className="p-2 rounded-lg bg-gray-50 w-fit mx-auto mb-2">
                  <Eye className="h-4 w-4 text-gray-600" />
                </div>
                <p className="text-2xl font-bold">{dashboard.totals.traffic.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
            </div>
          </div>
          
          {/* Conversion Trend */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              Conversion Trend
            </h3>
            <TrendChart data={dashboard.conversion_trends} height={120} />
            <div className="flex justify-between mt-4 text-xs text-gray-400">
              <span>{dashboard.conversion_trends[0]?.date}</span>
              <span>{dashboard.conversion_trends[dashboard.conversion_trends.length - 1]?.date}</span>
            </div>
          </div>
        </div>
        
        {/* Top Performers & Locations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Performers */}
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              Top Performers
            </h3>
            <div className="space-y-3">
              {dashboard.top_performers.length > 0 ? (
                dashboard.top_performers.map((location, i) => (
                  <TopPerformerRow key={location.location_id} location={location} rank={i} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No conversions yet
                </p>
              )}
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              Quick Insights
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Converting Locations</span>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {dashboard.locations_with_conversions}
                  <span className="text-lg text-green-600">/{dashboard.total_locations}</span>
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Avg Value Per Conversion</span>
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  ${dashboard.totals.conversions > 0 
                    ? Math.round(dashboard.totals.revenue / dashboard.totals.conversions).toLocaleString()
                    : 0}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Est. Total Value</span>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  ${dashboard.totals.total_estimated_value.toLocaleString()}
                </p>
              </div>
              
              <div className="p-4 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">Period</span>
                </div>
                <p className="text-3xl font-bold text-amber-700">
                  {period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : '1 year'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* All Locations Table */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
              All Locations
              <Badge variant="outline" className="ml-2">{dashboard.locations.length}</Badge>
            </h3>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-3">Location</div>
            <div className="col-span-2 text-center">Traffic</div>
            <div className="col-span-2 text-center">Conversions</div>
            <div className="col-span-2 text-center">Revenue</div>
            <div className="col-span-2 text-center">ROI</div>
            <div className="col-span-1"></div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {dashboard.locations.length > 0 ? (
              dashboard.locations.map(location => (
                <LocationROIRow 
                  key={location.location_id} 
                  location={location}
                  onViewDetails={setSelectedLocation}
                />
              ))
            ) : (
              <div className="px-6 py-12 text-center text-gray-500">
                No location data available
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default LocationROIDashboard
