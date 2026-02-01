// LocationRankingsTracker.jsx
// Premium ranking dashboard for location pages with trend visualization
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MapPin,
  FileText,
  ExternalLink,
  Sparkles,
  Calendar,
  Globe,
  Award,
  Target,
  Zap,
  Eye,
  MousePointer,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { seoApi, locationPagesApi } from '@/lib/portal-api'
import useAuthStore from '@/lib/auth-store'

// Sparkline chart component for mini trend visualization
function Sparkline({ data, width = 80, height = 24, color = 'var(--brand-primary)' }) {
  if (!data || data.length < 2) return null
  
  // For positions, lower is better, so invert for visual
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width
    // Invert Y so lower positions appear higher on chart
    const y = height - ((max - value) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

// Position change indicator
function PositionChange({ change, size = 'default' }) {
  if (change === 0) {
    return (
      <span className={cn(
        "inline-flex items-center gap-0.5 text-gray-500",
        size === 'small' && "text-xs"
      )}>
        <Minus className={size === 'small' ? "h-3 w-3" : "h-4 w-4"} />
        <span>0</span>
      </span>
    )
  }
  
  // Positive change = moved up = good
  const isPositive = change > 0
  
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 font-medium",
      isPositive ? "text-green-600" : "text-red-600",
      size === 'small' && "text-xs"
    )}>
      {isPositive ? (
        <ArrowUpRight className={size === 'small' ? "h-3 w-3" : "h-4 w-4"} />
      ) : (
        <ArrowDownRight className={size === 'small' ? "h-3 w-3" : "h-4 w-4"} />
      )}
      <span>{Math.abs(change)}</span>
    </span>
  )
}

// Ranking status badge
function RankingBadge({ position, indexed = true }) {
  if (!indexed) {
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300">
        <Clock className="h-3 w-3 mr-1" />
        Not Indexed
      </Badge>
    )
  }
  
  if (!position) {
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        <Eye className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  }
  
  if (position <= 3) {
    return (
      <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0">
        <Award className="h-3 w-3 mr-1" />
        Top 3
      </Badge>
    )
  }
  
  if (position <= 10) {
    return (
      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Page 1
      </Badge>
    )
  }
  
  if (position <= 20) {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        Page 2
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-300">
      Page {Math.ceil(position / 10)}
    </Badge>
  )
}

// Summary stat card
function StatCard({ icon: Icon, label, value, change, trend, color = 'primary' }) {
  const colors = {
    primary: 'from-[var(--brand-primary)] to-[var(--brand-secondary)]',
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-indigo-600',
    amber: 'from-amber-400 to-orange-500',
  }
  
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <PositionChange change={change} size="small" />
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
          )}
        </div>
        <div 
          className={cn("p-3 rounded-xl bg-gradient-to-br", colors[color])}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      {trend && trend.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Sparkline 
            data={trend} 
            width={140} 
            height={32}
            color={change >= 0 ? '#22c55e' : '#ef4444'}
          />
        </div>
      )}
    </div>
  )
}

// Main component
export function LocationRankingsTracker({
  projectId,
  locations = [],
  services = [],
  onRefresh,
}) {
  const currentProject = useAuthStore((state) => state.currentProject)
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedService, setSelectedService] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [sortBy, setSortBy] = useState('position')
  const [sortOrder, setSortOrder] = useState('asc')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [dateRange, setDateRange] = useState('7d')
  
  // Fetch rankings data
  useEffect(() => {
    const fetchRankings = async () => {
      if (!projectId) return
      
      setLoading(true)
      try {
        // Get location pages with their ranking data
        const pages = await locationPagesApi.getPages(projectId)
        
        // Get ranking history for each page
        const pagesWithRankings = await Promise.all(
          (pages || []).map(async (page) => {
            try {
              // Get GSC ranking data for this URL
              const rankingData = await seoApi.getRankingHistory(projectId, {
                url: page.url,
                days: dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90,
              })
              
              return {
                ...page,
                ranking: rankingData,
                // Calculate aggregate stats
                current_position: rankingData?.currentPosition || null,
                position_change: rankingData?.positionChange || 0,
                impressions: rankingData?.dataPoints?.reduce((sum, d) => sum + (d.impressions || 0), 0) || 0,
                clicks: rankingData?.dataPoints?.reduce((sum, d) => sum + (d.clicks || 0), 0) || 0,
                ctr: rankingData?.dataPoints?.length > 0 
                  ? (rankingData.dataPoints.reduce((sum, d) => sum + (d.ctr || 0), 0) / rankingData.dataPoints.length * 100).toFixed(1)
                  : 0,
                trend: rankingData?.dataPoints?.map(d => d.position).filter(Boolean) || [],
              }
            } catch {
              return {
                ...page,
                ranking: null,
                current_position: null,
                position_change: 0,
                impressions: 0,
                clicks: 0,
                ctr: 0,
                trend: [],
              }
            }
          })
        )
        
        setRankings(pagesWithRankings)
      } catch (error) {
        console.error('Failed to fetch rankings:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRankings()
  }, [projectId, dateRange])
  
  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const ranked = rankings.filter(r => r.current_position)
    const page1 = ranked.filter(r => r.current_position <= 10)
    const top3 = ranked.filter(r => r.current_position <= 3)
    
    const totalImpressions = rankings.reduce((sum, r) => sum + (r.impressions || 0), 0)
    const totalClicks = rankings.reduce((sum, r) => sum + (r.clicks || 0), 0)
    
    // Calculate average position
    const avgPosition = ranked.length > 0
      ? (ranked.reduce((sum, r) => sum + r.current_position, 0) / ranked.length).toFixed(1)
      : 'N/A'
    
    // Week over week change
    const avgPositionChange = ranked.length > 0
      ? Math.round(ranked.reduce((sum, r) => sum + r.position_change, 0) / ranked.length)
      : 0
    
    return {
      totalPages: rankings.length,
      rankedPages: ranked.length,
      page1Count: page1.length,
      top3Count: top3.length,
      avgPosition,
      avgPositionChange,
      totalImpressions,
      totalClicks,
      avgCtr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
    }
  }, [rankings])
  
  // Filter and sort rankings
  const filteredRankings = useMemo(() => {
    let result = [...rankings]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(r => 
        r.location_name?.toLowerCase().includes(query) ||
        r.service_name?.toLowerCase().includes(query) ||
        r.url?.toLowerCase().includes(query)
      )
    }
    
    // Service filter
    if (selectedService !== 'all') {
      result = result.filter(r => r.service_slug === selectedService)
    }
    
    // Status filter
    if (selectedStatus !== 'all') {
      switch (selectedStatus) {
        case 'top3':
          result = result.filter(r => r.current_position && r.current_position <= 3)
          break
        case 'page1':
          result = result.filter(r => r.current_position && r.current_position <= 10)
          break
        case 'improving':
          result = result.filter(r => r.position_change > 0)
          break
        case 'declining':
          result = result.filter(r => r.position_change < 0)
          break
        case 'pending':
          result = result.filter(r => !r.current_position)
          break
      }
    }
    
    // Sort
    result.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'position':
          aVal = a.current_position || 999
          bVal = b.current_position || 999
          break
        case 'change':
          aVal = a.position_change
          bVal = b.position_change
          break
        case 'impressions':
          aVal = a.impressions
          bVal = b.impressions
          break
        case 'clicks':
          aVal = a.clicks
          bVal = b.clicks
          break
        case 'location':
          aVal = a.location_name || ''
          bVal = b.location_name || ''
          return sortOrder === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        default:
          aVal = a.current_position || 999
          bVal = b.current_position || 999
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
    
    return result
  }, [rankings, searchQuery, selectedService, selectedStatus, sortBy, sortOrder])
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Trigger a GSC data refresh
      await seoApi.refreshKeywordRankings(projectId)
      onRefresh?.()
      // Refetch data
      const pages = await locationPagesApi.getPages(projectId)
      // Simplified refresh - just reload the data
      window.location.reload()
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }
  
  // Toggle row expansion
  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder(column === 'change' || column === 'impressions' || column === 'clicks' ? 'desc' : 'asc')
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto" />
          <p className="mt-4 text-gray-500">Loading rankings data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Location Rankings Tracker</h2>
            <p className="text-gray-500 mt-1">
              Monitor Google rankings for your {rankings.length} location pages
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Avg. Position"
            value={summaryStats.avgPosition}
            change={summaryStats.avgPositionChange}
            color="primary"
          />
          <StatCard
            icon={Award}
            label="Page 1 Rankings"
            value={`${summaryStats.page1Count}/${summaryStats.totalPages}`}
            color="green"
          />
          <StatCard
            icon={Eye}
            label="Total Impressions"
            value={summaryStats.totalImpressions.toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={MousePointer}
            label="Total Clicks"
            value={summaryStats.totalClicks.toLocaleString()}
            color="amber"
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search locations or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service.slug} value={service.slug}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="top3">🏆 Top 3</SelectItem>
              <SelectItem value="page1">✅ Page 1</SelectItem>
              <SelectItem value="improving">📈 Improving</SelectItem>
              <SelectItem value="declining">📉 Declining</SelectItem>
              <SelectItem value="pending">⏳ Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Results count */}
        <div className="text-sm text-gray-500">
          Showing {filteredRankings.length} of {rankings.length} pages
        </div>
        
        {/* Rankings Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div 
              className="col-span-4 flex items-center gap-2 cursor-pointer hover:text-gray-900"
              onClick={() => handleSort('location')}
            >
              Location / Service
              {sortBy === 'location' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </div>
            <div 
              className="col-span-2 text-center cursor-pointer hover:text-gray-900"
              onClick={() => handleSort('position')}
            >
              Position
              {sortBy === 'position' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
            </div>
            <div 
              className="col-span-1 text-center cursor-pointer hover:text-gray-900"
              onClick={() => handleSort('change')}
            >
              Change
              {sortBy === 'change' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
            </div>
            <div className="col-span-2 text-center">Trend</div>
            <div 
              className="col-span-1 text-center cursor-pointer hover:text-gray-900"
              onClick={() => handleSort('impressions')}
            >
              Impr.
              {sortBy === 'impressions' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
            </div>
            <div 
              className="col-span-1 text-center cursor-pointer hover:text-gray-900"
              onClick={() => handleSort('clicks')}
            >
              Clicks
              {sortBy === 'clicks' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />)}
            </div>
            <div className="col-span-1 text-center">Status</div>
          </div>
          
          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            <AnimatePresence>
              {filteredRankings.map((page, index) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <div 
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => toggleRow(page.id)}
                  >
                    {/* Location / Service */}
                    <div className="col-span-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
                        >
                          <MapPin className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{page.location_name}</p>
                          <p className="text-sm text-gray-500 truncate">{page.service_name}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Position */}
                    <div className="col-span-2 flex items-center justify-center">
                      {page.current_position ? (
                        <span className="text-2xl font-bold" style={{ color: page.current_position <= 10 ? 'var(--brand-primary)' : 'inherit' }}>
                          #{page.current_position}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    
                    {/* Change */}
                    <div className="col-span-1 flex items-center justify-center">
                      <PositionChange change={page.position_change} />
                    </div>
                    
                    {/* Trend */}
                    <div className="col-span-2 flex items-center justify-center">
                      {page.trend.length > 1 ? (
                        <Sparkline 
                          data={page.trend}
                          color={page.position_change >= 0 ? '#22c55e' : '#ef4444'}
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">No data</span>
                      )}
                    </div>
                    
                    {/* Impressions */}
                    <div className="col-span-1 flex items-center justify-center text-gray-600">
                      {page.impressions.toLocaleString()}
                    </div>
                    
                    {/* Clicks */}
                    <div className="col-span-1 flex items-center justify-center text-gray-600">
                      {page.clicks.toLocaleString()}
                    </div>
                    
                    {/* Status */}
                    <div className="col-span-1 flex items-center justify-center">
                      <RankingBadge position={page.current_position} indexed={page.indexed} />
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedRows.has(page.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 py-4 bg-gray-50 border-t border-gray-100 overflow-hidden"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Page URL</p>
                            <a 
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium hover:underline flex items-center gap-1"
                              style={{ color: 'var(--brand-primary)' }}
                            >
                              {page.url?.replace(/^https?:\/\//, '').slice(0, 40)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Avg. CTR</p>
                            <p className="text-sm font-medium">{page.ctr}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Best Position</p>
                            <p className="text-sm font-medium">
                              {page.ranking?.bestPosition || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="text-sm font-medium">
                              {page.updated_at 
                                ? new Date(page.updated_at).toLocaleDateString()
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm" asChild>
                            <a href={page.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Page
                            </a>
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation()
                              await locationPagesApi.submitForIndexing(page.location_id, {
                                project_id: projectId,
                                url: page.url,
                              })
                            }}
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            Request Reindex
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* Empty State */}
          {filteredRankings.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No location pages match your filters</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedService('all')
                  setSelectedStatus('all')
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export default LocationRankingsTracker
