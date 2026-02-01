// CompetitorContentAnalyzer.jsx
// Premium competitor analysis dashboard with visual content gap insights
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  FileText,
  Image,
  MessageCircle,
  Star,
  MapPin,
  Code2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Trophy,
  BarChart3,
  ExternalLink,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronRight,
  Zap,
  TrendingUp,
  Users,
  Globe,
  FileCode2,
  HelpCircle,
  Video,
  Quote,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { locationPagesApi } from '@/lib/portal-api'

// Gap type to icon mapping
const gapIcons = {
  faq: HelpCircle,
  schema: FileCode2,
  local_content: MapPin,
  images: Image,
  reviews: Star,
  word_count: FileText,
  meta: Globe,
}

// Opportunity type to icon mapping
const opportunityIcons = {
  faq_schema: HelpCircle,
  hyperlocal_content: MapPin,
  video_content: Video,
  reviews_widget: Quote,
}

// Priority badge colors
const priorityColors = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-blue-100 text-blue-700 border-blue-200',
}

// Score color based on value
function getScoreColor(score) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

// Circular progress indicator
function CircularProgress({ value, max = 100, size = 80, strokeWidth = 8, children }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percent = Math.min(value / max, 1)
  const offset = circumference - percent * circumference
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--brand-primary)" />
            <stop offset="100%" stopColor="var(--brand-secondary)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

// Content Gap Card
function ContentGapCard({ gap, index }) {
  const Icon = gapIcons[gap.type] || AlertTriangle
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div 
          className="p-2.5 rounded-xl shrink-0"
          style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
        >
          <Icon className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium capitalize">{gap.type.replace('_', ' ')}</span>
            <Badge variant="outline" className={cn("text-xs", priorityColors[gap.priority])}>
              {gap.priority}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{gap.description}</p>
          
          {/* Impact meter */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">Impact:</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${gap.estimated_impact * 10}%` }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className="h-full rounded-full"
                style={{ 
                  background: `linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))` 
                }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>
              {gap.estimated_impact}/10
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Opportunity Card
function OpportunityCard({ opportunity, index }) {
  const Icon = opportunityIcons[opportunity.type] || Lightbulb
  const difficultyColors = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    hard: 'bg-red-100 text-red-700',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.15 }}
      className="p-5 bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl"
    >
      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-xl shrink-0"
          style={{ 
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))' 
          }}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-lg">{opportunity.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
          
          <div className="flex items-center gap-4 mt-4">
            <Badge className={difficultyColors[opportunity.difficulty]}>
              {opportunity.difficulty} effort
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>{opportunity.competitors_using} competitors</span>
            </div>
            <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--brand-primary)' }}>
              <TrendingUp className="h-4 w-4" />
              <span>+{opportunity.estimated_traffic} traffic</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Competitor Row
function CompetitorRow({ competitor, index, isExpanded, onToggle }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div 
        className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors items-center"
        onClick={onToggle}
      >
        {/* Position */}
        <div className="col-span-1 flex items-center justify-center">
          {competitor.estimated_position <= 3 ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
          ) : (
            <span className="text-lg font-bold text-gray-400">
              #{competitor.estimated_position}
            </span>
          )}
        </div>
        
        {/* Domain */}
        <div className="col-span-3">
          <a 
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline flex items-center gap-1"
            style={{ color: 'var(--brand-primary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {competitor.domain}
            <ExternalLink className="h-3 w-3" />
          </a>
          <p className="text-xs text-gray-500 truncate">{competitor.title}</p>
        </div>
        
        {/* Word Count */}
        <div className="col-span-2 text-center">
          <span className="font-medium">{competitor.word_count.toLocaleString()}</span>
          <p className="text-xs text-gray-500">words</p>
        </div>
        
        {/* Features */}
        <div className="col-span-4 flex items-center gap-2 flex-wrap">
          {competitor.has_faq && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ
            </Badge>
          )}
          {competitor.schema_types.length > 0 && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <Code2 className="h-3 w-3 mr-1" />
              Schema
            </Badge>
          )}
          {competitor.has_local_content && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              <MapPin className="h-3 w-3 mr-1" />
              Local
            </Badge>
          )}
          {competitor.has_reviews && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              <Star className="h-3 w-3 mr-1" />
              Reviews
            </Badge>
          )}
        </div>
        
        {/* Expand */}
        <div className="col-span-2 flex items-center justify-end">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 bg-gray-50 overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
              <div>
                <p className="text-xs text-gray-500">Images</p>
                <p className="font-medium">{competitor.image_count} images</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">FAQ Questions</p>
                <p className="font-medium">{competitor.faq_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Schema Types</p>
                <p className="font-medium">{competitor.schema_types.join(', ') || 'None'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Keyword Density</p>
                <p className="font-medium">{competitor.keyword_density.toFixed(1)}%</p>
              </div>
            </div>
            {competitor.local_mentions?.length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Local Mentions</p>
                <div className="flex flex-wrap gap-2">
                  {competitor.local_mentions.map((mention, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {mention}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main Component
export function CompetitorContentAnalyzer({
  projectId,
  locationId,
  locationName,
  state,
  serviceName,
  ourUrl,
}) {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [expandedCompetitors, setExpandedCompetitors] = useState(new Set())
  const [activeTab, setActiveTab] = useState('gaps')
  
  // Load existing analysis
  useEffect(() => {
    const loadAnalysis = async () => {
      if (!locationId || !serviceName) return
      
      setLoading(true)
      try {
        const stored = await locationPagesApi.getCompetitorAnalysis(locationId, serviceName)
        if (stored) {
          setAnalysis(stored)
        }
      } catch (error) {
        console.error('Failed to load analysis:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAnalysis()
  }, [locationId, serviceName])
  
  // Run new analysis
  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const result = await locationPagesApi.analyzeCompetitors(locationId, {
        project_id: projectId,
        service_name: serviceName,
        our_url: ourUrl,
      })
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }
  
  // Toggle competitor expansion
  const toggleCompetitor = (url) => {
    setExpandedCompetitors(prev => {
      const next = new Set(prev)
      if (next.has(url)) {
        next.delete(url)
      } else {
        next.add(url)
      }
      return next
    })
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto" />
          <p className="mt-4 text-gray-500">Loading analysis...</p>
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
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6" style={{ color: 'var(--brand-primary)' }} />
              Competitor Content Analyzer
            </h2>
            <p className="text-gray-500 mt-1">
              Analyze competitors for "{serviceName}" in {locationName}, {state}
            </p>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="gap-2"
            style={{ 
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
              color: 'white'
            }}
          >
            {analyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                {analysis ? 'Re-analyze' : 'Analyze Competitors'}
              </>
            )}
          </Button>
        </div>
        
        {!analysis ? (
          // Empty state
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No analysis yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Analyze your competitors to discover content gaps and opportunities to outrank them.
            </p>
            <Button
              onClick={runAnalysis}
              disabled={analyzing}
              className="gap-2"
              style={{ 
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                color: 'white'
              }}
            >
              <Sparkles className="h-4 w-4" />
              Start Analysis
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Your Score vs Avg */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-700">Content Score</h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Score based on word count, schema, FAQs, local content, images, and reviews.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <CircularProgress 
                      value={analysis.benchmark.your_score || 50} 
                      size={100}
                      strokeWidth={10}
                    >
                      <div className="text-center">
                        <span className={cn("text-2xl font-bold", getScoreColor(analysis.benchmark.your_score || 50))}>
                          {analysis.benchmark.your_score || 50}
                        </span>
                      </div>
                    </CircularProgress>
                    <p className="text-sm text-gray-500 mt-2">Your Score</p>
                  </div>
                  <div className="text-center">
                    <CircularProgress 
                      value={analysis.benchmark.competitor_avg_score} 
                      size={100}
                      strokeWidth={10}
                    >
                      <div className="text-center">
                        <span className="text-2xl font-bold text-gray-700">
                          {analysis.benchmark.competitor_avg_score}
                        </span>
                      </div>
                    </CircularProgress>
                    <p className="text-sm text-gray-500 mt-2">Competitor Avg</p>
                  </div>
                </div>
              </div>
              
              {/* Benchmark Stats */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-medium text-gray-700 mb-4">Competitor Benchmarks</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg Word Count</span>
                    <span className="font-medium">{analysis.benchmark.avg_word_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg FAQ Questions</span>
                    <span className="font-medium">{analysis.benchmark.avg_faq_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Avg Images</span>
                    <span className="font-medium">{analysis.benchmark.avg_image_count}</span>
                  </div>
                </div>
              </div>
              
              {/* Top Features */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="font-medium text-gray-700 mb-4">Common Schema Types</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.benchmark.common_schema_types.map((schema, i) => (
                    <Badge 
                      key={i}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      <Code2 className="h-3 w-3 mr-1" />
                      {schema}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Analyzed {analysis.competitors.length} competitors
                </p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('gaps')}
                className={cn(
                  "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                  activeTab === 'gaps' 
                    ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Content Gaps ({analysis.content_gaps.length})
              </button>
              <button
                onClick={() => setActiveTab('opportunities')}
                className={cn(
                  "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                  activeTab === 'opportunities' 
                    ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Opportunities ({analysis.opportunities.length})
              </button>
              <button
                onClick={() => setActiveTab('competitors')}
                className={cn(
                  "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                  activeTab === 'competitors' 
                    ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Competitors ({analysis.competitors.length})
              </button>
              <button
                onClick={() => setActiveTab('recommendations')}
                className={cn(
                  "px-4 py-2 font-medium text-sm border-b-2 transition-colors",
                  activeTab === 'recommendations' 
                    ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                Actions ({analysis.recommendations.length})
              </button>
            </div>
            
            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'gaps' && (
                <motion.div
                  key="gaps"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {analysis.content_gaps.map((gap, i) => (
                    <ContentGapCard key={gap.type} gap={gap} index={i} />
                  ))}
                </motion.div>
              )}
              
              {activeTab === 'opportunities' && (
                <motion.div
                  key="opportunities"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {analysis.opportunities.map((opp, i) => (
                    <OpportunityCard key={opp.type} opportunity={opp} index={i} />
                  ))}
                </motion.div>
              )}
              
              {activeTab === 'competitors' && (
                <motion.div
                  key="competitors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-3">Domain</div>
                    <div className="col-span-2 text-center">Word Count</div>
                    <div className="col-span-4">Features</div>
                    <div className="col-span-2"></div>
                  </div>
                  
                  {/* Rows */}
                  {analysis.competitors.map((comp, i) => (
                    <CompetitorRow
                      key={comp.url}
                      competitor={comp}
                      index={i}
                      isExpanded={expandedCompetitors.has(comp.url)}
                      onToggle={() => toggleCompetitor(comp.url)}
                    />
                  ))}
                </motion.div>
              )}
              
              {activeTab === 'recommendations' && (
                <motion.div
                  key="recommendations"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {analysis.recommendations.map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        rec.priority === 'high' ? 'bg-red-100' : rec.priority === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                      )}>
                        <span className="font-bold text-lg">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.action}</h4>
                        <p className="text-sm text-gray-600 mt-1">{rec.details}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="outline" className={priorityColors[rec.priority]}>
                            {rec.priority} priority
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Effort: <span className="font-medium">{rec.effort}</span>
                          </span>
                          <span className="text-xs text-gray-500">
                            Impact: <span className="font-medium">{rec.impact}</span>
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="shrink-0">
                        <Zap className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Analysis timestamp */}
            <p className="text-xs text-gray-400 text-right">
              Last analyzed: {new Date(analysis.analyzed_at).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}

export default CompetitorContentAnalyzer
