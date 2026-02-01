// AIVisibilityPanel.jsx
// Dashboard component for AI Visibility scoring and Entity Graph management
// Shows project-level AI visibility metrics and entity graph status

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  FileText,
  Users,
  MapPin,
  Briefcase,
  Award,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react'
import SignalIcon from '@/components/ui/SignalIcon'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import useAuthStore from '@/lib/auth-store'

// ============================================================================
// API Functions (would connect to Signal API)
// ============================================================================

const SIGNAL_API_URL = import.meta.env.VITE_SIGNAL_API_URL || 'https://signal.uptrademedia.com'

async function fetchVisibilitySummary(projectId, token) {
  try {
    const res = await fetch(`${SIGNAL_API_URL}/skills/seo/visibility/${projectId}/summary`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('Failed to fetch visibility summary:', err)
    return null
  }
}

async function fetchEntities(projectId, token) {
  try {
    const res = await fetch(`${SIGNAL_API_URL}/skills/seo/entities/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('Failed to fetch entities:', err)
    return []
  }
}

async function fetchVisibilityScores(projectId, token) {
  try {
    const res = await fetch(`${SIGNAL_API_URL}/skills/seo/visibility/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.error('Failed to fetch visibility scores:', err)
    return []
  }
}

async function calculateRetrievalScore(projectId, pagePath, content, targetQueries, token) {
  try {
    const res = await fetch(`${SIGNAL_API_URL}/skills/seo/visibility/retrieval-score`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, pagePath, content, targetQueries }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('Failed to calculate retrieval score:', err)
    return null
  }
}

async function generateAnswerBlocks(projectId, pagePath, content, topic, token) {
  try {
    const res = await fetch(`${SIGNAL_API_URL}/skills/seo/visibility/generate-answer-blocks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, pagePath, content, topic }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('Failed to generate answer blocks:', err)
    return null
  }
}

async function analyzeChunks(content, projectId, token) {
  try {
    const res = await fetch(`${SIGNAL_API_URL}/skills/seo/visibility/chunk-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, projectId }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('Failed to analyze chunks:', err)
    return null
  }
}

// ============================================================================
// SCORE DISPLAY COMPONENTS
// ============================================================================

function ScoreRing({ score, size = 120, strokeWidth = 10, label }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", getScoreColor(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold", getScoreColor(score))}>
          {score}
        </span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}

function SubScoreBar({ label, score, icon: Icon }) {
  const getBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-muted-foreground">{label}</span>
        </div>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn("h-full rounded-full", getBarColor(score))}
        />
      </div>
    </div>
  )
}

// ============================================================================
// ENTITY COMPONENTS
// ============================================================================

const entityTypeConfig = {
  organization: { icon: Briefcase, color: 'blue', label: 'Organization' },
  person: { icon: Users, color: 'purple', label: 'Person' },
  service: { icon: Target, color: 'emerald', label: 'Service' },
  product: { icon: FileText, color: 'orange', label: 'Product' },
  location: { icon: MapPin, color: 'pink', label: 'Location' },
  concept: { icon: Lightbulb, color: 'yellow', label: 'Concept' },
  credential: { icon: Award, color: 'cyan', label: 'Credential' },
}

function EntityCard({ entity }) {
  const config = entityTypeConfig[entity.entity_type] || entityTypeConfig.concept
  const Icon = config.icon

  return (
    <div className={cn(
      "p-3 rounded-lg border transition-all hover:shadow-md",
      "bg-card hover:border-primary/30"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          `bg-${config.color}-100 dark:bg-${config.color}-500/20`
        )} style={{ backgroundColor: `color-mix(in srgb, var(--brand-primary) 15%, transparent)` }}>
          <Icon className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{entity.name}</span>
            {entity.is_primary && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Primary
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{config.label}</p>
          {entity.knows_about?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entity.knows_about.slice(0, 3).map((topic, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                  {topic}
                </Badge>
              ))}
              {entity.knows_about.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{entity.knows_about.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EntityTypeGroup({ type, entities }) {
  const config = entityTypeConfig[type] || entityTypeConfig.concept
  const Icon = config.icon

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{config.label}s</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">
          {entities.length}
        </Badge>
      </div>
      <div className="grid gap-2">
        {entities.map(entity => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// RECOMMENDATIONS COMPONENT
// ============================================================================

function RecommendationCard({ rec }) {
  const priorityConfig = {
    high: { color: 'red', icon: AlertTriangle, label: 'High Priority' },
    medium: { color: 'amber', icon: TrendingUp, label: 'Medium Priority' },
    low: { color: 'emerald', icon: Lightbulb, label: 'Suggestion' },
  }

  const config = priorityConfig[rec.priority] || priorityConfig.medium
  const Icon = config.icon

  return (
    <div className={cn(
      "p-3 rounded-lg border-l-4 bg-card",
      rec.priority === 'high' && "border-l-red-500",
      rec.priority === 'medium' && "border-l-amber-500",
      rec.priority === 'low' && "border-l-emerald-500",
    )}>
      <div className="flex items-start gap-2">
        <Icon className={cn(
          "h-4 w-4 shrink-0 mt-0.5",
          rec.priority === 'high' && "text-red-500",
          rec.priority === 'medium' && "text-amber-500",
          rec.priority === 'low' && "text-emerald-500",
        )} />
        <div>
          <p className="text-sm">{rec.message}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {rec.type}
            </Badge>
            {rec.affected_pages && (
              <span className="text-xs text-muted-foreground">
                {rec.affected_pages} pages
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PAGE SCORE ROW
// ============================================================================

function PageScoreRow({ page }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{page.page_path}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span>Entities: {page.analysis?.entities_found || 0}</span>
          <span>Answers: {page.analysis?.answer_blocks || 0}</span>
        </div>
      </div>
      <div className={cn("text-lg font-bold", getScoreColor(page.overall_score))}>
        {page.overall_score}
      </div>
    </div>
  )
}

// ============================================================================
// RETRIEVAL TEST PANEL
// ============================================================================

function RetrievalTestPanel({ projectId, token }) {
  const [testQueries, setTestQueries] = useState('')
  const [testContent, setTestContent] = useState('')
  const [testPagePath, setTestPagePath] = useState('/')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState(null)

  const handleTest = async () => {
    if (!testQueries.trim() || !testContent.trim()) return
    
    setTesting(true)
    setResults(null)
    
    try {
      const queries = testQueries.split('\n').filter(q => q.trim())
      const result = await calculateRetrievalScore(
        projectId,
        testPagePath,
        testContent,
        queries,
        token
      )
      setResults(result)
    } catch (err) {
      console.error('Retrieval test failed:', err)
    } finally {
      setTesting(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Input Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Test AI Retrieval</CardTitle>
          <CardDescription>
            Paste content and queries to see how likely LLMs are to retrieve and cite it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target Queries</label>
            <textarea
              className="w-full h-24 px-3 py-2 text-sm border rounded-md bg-background resize-none"
              placeholder="Enter queries, one per line:&#10;What is family law?&#10;Best divorce attorney in Cincinnati&#10;How long does divorce take in Ohio?"
              value={testQueries}
              onChange={(e) => setTestQueries(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Page Path</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              placeholder="/services/divorce"
              value={testPagePath}
              onChange={(e) => setTestPagePath(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1.5 block">Content to Analyze</label>
            <textarea
              className="w-full h-48 px-3 py-2 text-sm border rounded-md bg-background resize-none font-mono"
              placeholder="Paste your page content here..."
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleTest} 
            disabled={testing || !testQueries.trim() || !testContent.trim()}
            className="w-full"
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Test Retrieval
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Retrieval Results</CardTitle>
          <CardDescription>
            How well your content matches target queries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!results ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Run a test to see results</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="text-center p-4 bg-muted/30 rounded-lg">
                <div className={cn("text-4xl font-bold", getScoreColor(results.overallRetrievalScore))}>
                  {results.overallRetrievalScore}
                </div>
                <p className="text-sm text-muted-foreground mt-1">AI Retrieval Score</p>
              </div>

              {/* Per-Query Results */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-4 pr-4">
                  {results.queries?.map((q, i) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium flex-1">{q.query}</p>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={cn("text-xs", getScoreColor(q.retrievalLikelihood))}>
                            {q.retrievalLikelihood}% retrieval
                          </Badge>
                          <Badge variant="outline" className={cn("text-xs", getScoreColor(q.citationLikelihood))}>
                            {q.citationLikelihood}% citation
                          </Badge>
                        </div>
                      </div>
                      
                      {q.gaps?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-500 mb-1">Gaps:</p>
                          <ul className="text-xs text-muted-foreground space-y-0.5">
                            {q.gaps.map((gap, j) => (
                              <li key={j}>• {gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Improvements */}
              {results.prioritizedImprovements?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Priority Improvements</h4>
                  <div className="space-y-2">
                    {results.prioritizedImprovements.slice(0, 3).map((imp, i) => (
                      <div key={i} className={cn(
                        "p-2 text-sm rounded-lg border-l-4",
                        imp.impact === 'high' && "border-l-red-500 bg-red-50 dark:bg-red-950/20",
                        imp.impact === 'medium' && "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
                        imp.impact === 'low' && "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
                      )}>
                        {imp.action}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// MAIN PANEL
// ============================================================================

export default function AIVisibilityPanel({ className }) {
  const { currentProject, session } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [entities, setEntities] = useState([])
  const [pageScores, setPageScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (currentProject?.id && session?.access_token) {
      loadData()
    }
  }, [currentProject?.id, session?.access_token])

  const loadData = async () => {
    if (!currentProject?.id || !session?.access_token) return

    setLoading(true)
    try {
      const [summaryData, entitiesData, scoresData] = await Promise.all([
        fetchVisibilitySummary(currentProject.id, session.access_token),
        fetchEntities(currentProject.id, session.access_token),
        fetchVisibilityScores(currentProject.id, session.access_token),
      ])

      setSummary(summaryData)
      setEntities(entitiesData)
      setPageScores(scoresData)
    } catch (err) {
      console.error('Failed to load AI visibility data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // Group entities by type
  const entitiesByType = entities.reduce((acc, entity) => {
    const type = entity.entity_type
    if (!acc[type]) acc[type] = []
    acc[type].push(entity)
    return acc
  }, {})

  // Sort page scores by score (lowest first for improvement focus)
  const sortedPages = [...pageScores].sort((a, b) => a.overall_score - b.overall_score)

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-60 mt-1" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48 md:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
          >
            <SignalIcon className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              AI Visibility
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                Beta
              </Badge>
            </h2>
            <p className="text-sm text-muted-foreground">
              Optimize your content for AI retrieval and citation
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entities">Entity Graph</TabsTrigger>
          <TabsTrigger value="pages">Page Scores</TabsTrigger>
          <TabsTrigger value="retrieval">Retrieval Test</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Score Ring */}
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                <ScoreRing 
                  score={summary?.overall_score || 0} 
                  label="AI Visibility"
                />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {summary?.pages_analyzed || 0} pages analyzed
                </p>
              </CardContent>
            </Card>

            {/* Sub-scores */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <SubScoreBar 
                  label="Entity Coverage" 
                  score={summary?.entity_coverage || 0}
                  icon={Target}
                />
                <SubScoreBar 
                  label="Answer Density" 
                  score={summary?.answer_density || 0}
                  icon={FileText}
                />
                <SubScoreBar 
                  label="Chunk Readability" 
                  score={summary?.chunk_readability || 0}
                  icon={BarChart3}
                />
                <SubScoreBar 
                  label="Authority Signals" 
                  score={summary?.authority_signals || 0}
                  icon={Award}
                />
                <SubScoreBar 
                  label="Schema Completeness" 
                  score={summary?.schema_completeness || 0}
                  icon={SignalIcon}
                />
              </CardContent>
            </Card>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{summary?.total_entities || 0}</div>
                <p className="text-sm text-muted-foreground">Entities</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{summary?.pages_with_entities || 0}</div>
                <p className="text-sm text-muted-foreground">Pages with Entities</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{summary?.pages_with_answers || 0}</div>
                <p className="text-sm text-muted-foreground">Pages with Answers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{summary?.pages_with_schema || 0}</div>
                <p className="text-sm text-muted-foreground">Pages with Schema</p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {summary?.top_recommendations?.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                  Top Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.top_recommendations.slice(0, 5).map((rec, i) => (
                    <RecommendationCard key={i} rec={rec} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Entity Graph Tab */}
        <TabsContent value="entities" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Knowledge Graph</CardTitle>
                  <CardDescription>
                    Entities extracted from your content
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {entities.length === 0 ? (
                <div className="text-center py-12">
                  <SignalIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="font-medium">No entities yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run an analysis to extract entities from your content
                  </p>
                  <Button className="mt-4" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Extract Entities
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-6 pr-4">
                    {Object.entries(entitiesByType).map(([type, typeEntities]) => (
                      <EntityTypeGroup key={type} type={type} entities={typeEntities} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Scores Tab */}
        <TabsContent value="pages" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Page Visibility Scores</CardTitle>
              <CardDescription>
                Sorted by score (lowest first for improvement focus)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pageScores.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="font-medium">No pages analyzed yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Run an analysis to calculate visibility scores
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="pr-4">
                    {sortedPages.map((page, i) => (
                      <PageScoreRow key={page.id || i} page={page} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retrieval Test Tab */}
        <TabsContent value="retrieval" className="mt-6">
          <RetrievalTestPanel 
            projectId={currentProject?.id}
            token={session?.access_token}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
