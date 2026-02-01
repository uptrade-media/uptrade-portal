// src/components/seo/SEOPageDetailSimplified.jsx
// CONSOLIDATED Page Detail View - Jan 31, 2026
// Focus: Show what's wrong, ONE button to fix it, show results
import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  FileText,
  Link2,
  Eye,
  Zap,
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react'
import { UptradeSpinner } from '@/components/UptradeLoading'
import { useSeoPage, useSeoProject, usePageImages } from '@/hooks/seo'
import { useOptimizePage } from '@/hooks/seo/useSeoSignal'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import SignalIcon from '@/components/ui/SignalIcon'
import { Progress } from '@/components/ui/progress'
import { useSignalAccess } from '@/lib/signal-access'
import SEOSerpPreview from './SEOSerpPreview'
import { seoApi } from '@/lib/portal-api'
import { cn } from '@/lib/utils'

// Main component
export default function SEOPageDetailSimplified({ projectId }) {
  const { pageId } = useParams()
  const navigate = useNavigate()
  
  const { data: currentProject } = useSeoProject(projectId)
  const { data: page, isLoading } = useSeoPage(projectId, pageId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <UptradeSpinner size="md" label="Loading page..." className="[&_svg]:text-[var(--text-tertiary)]" />
        </CardContent>
      </Card>
    )
  }

  if (!page) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Page not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/seo/pages')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <PageDetailInner page={page} site={currentProject} projectId={projectId} />
}

// Inner component
function PageDetailInner({ page, site, projectId }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { hasAccess: hasSignalAccess } = useSignalAccess()
  
  // Discovered images
  const { data: discoveredImagesData } = usePageImages(projectId, page.id)
  const images = discoveredImagesData?.images || []
  
  // Optimization state
  const optimizePageMutation = useOptimizePage()
  const [optimizeResults, setOptimizeResults] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate what needs attention
  const pageHealth = useMemo(() => {
    const issues = []
    const good = []
    
    // Metadata
    if (!page.title || page.title_length < 30 || page.title_length > 60) {
      issues.push({ type: 'title', label: 'Title needs optimization', severity: 'high' })
    } else {
      good.push({ type: 'title', label: 'Title is good' })
    }
    
    if (!page.meta_description || page.meta_description_length < 120 || page.meta_description_length > 160) {
      issues.push({ type: 'meta', label: 'Meta description needs work', severity: 'high' })
    } else {
      good.push({ type: 'meta', label: 'Meta description is good' })
    }
    
    // H1
    if (!page.h1) {
      issues.push({ type: 'h1', label: 'Missing H1 tag', severity: 'high' })
    } else if (page.h1_count > 1) {
      issues.push({ type: 'h1', label: `Multiple H1 tags (${page.h1_count})`, severity: 'medium' })
    } else {
      good.push({ type: 'h1', label: 'H1 is good' })
    }
    
    // Schema
    if (!page.schema_types?.length) {
      issues.push({ type: 'schema', label: 'No structured data', severity: 'medium' })
    } else {
      good.push({ type: 'schema', label: `Schema: ${page.schema_types.join(', ')}` })
    }
    
    // Images
    const imagesWithoutAlt = images.filter(img => !img.current_alt && !img.managed_alt)
    if (imagesWithoutAlt.length > 0) {
      issues.push({ type: 'images', label: `${imagesWithoutAlt.length} images missing alt text`, severity: 'medium' })
    } else if (images.length > 0) {
      good.push({ type: 'images', label: `${images.length} images with alt text` })
    }
    
    // Content
    if (!page.content_text && !page.content_hash) {
      issues.push({ type: 'content', label: 'No content analyzed yet', severity: 'low' })
    } else {
      good.push({ type: 'content', label: 'Content indexed' })
    }
    
    return { issues, good, score: Math.round((good.length / (issues.length + good.length)) * 100) }
  }, [page, images])

  // Smart button label based on what's needed
  const getOptimizeButtonLabel = () => {
    if (optimizePageMutation.isPending) return 'Optimizing...'
    if (pageHealth.issues.length === 0) return 'Re-analyze Page'
    if (pageHealth.issues.length >= 3) return 'Full Optimization'
    return `Fix ${pageHealth.issues.length} Issue${pageHealth.issues.length > 1 ? 's' : ''}`
  }

  // Run optimization - does EVERYTHING
  const handleOptimize = async () => {
    try {
      const result = await optimizePageMutation.mutateAsync({
        projectId,
        pageIdOrPath: page.id,
        options: {
          optimize_alt: true,
          optimize_meta: true,
          optimize_schema: true,
          optimize_llm: true,
          analyze_content: true,
        },
        apply: false
      })
      
      setOptimizeResults(result)
      setActiveTab('results')
      toast.success('Page analysis complete!')
    } catch (error) {
      toast.error(error.message || 'Failed to optimize page')
    }
  }

  // Apply optimizations
  const handleApply = async () => {
    try {
      await optimizePageMutation.mutateAsync({
        projectId,
        pageIdOrPath: page.id,
        options: {
          optimize_alt: true,
          optimize_meta: true,
          optimize_schema: true,
          optimize_llm: true,
          analyze_content: true,
        },
        apply: true
      })
      
      toast.success('Optimizations applied!')
      queryClient.invalidateQueries({ queryKey: ['seo', 'page', projectId, page.id] })
      setOptimizeResults(null)
      setActiveTab('overview')
    } catch (error) {
      toast.error(error.message || 'Failed to apply changes')
    }
  }

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/seo/pages')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Pages
          </Button>
          <h2 className="text-xl font-bold text-[var(--text-primary)] truncate">
            {page.title || page.path}
          </h2>
          <a 
            href={page.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] flex items-center gap-1"
          >
            {page.path}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        
        {/* Main Action Button */}
        {hasSignalAccess && (
          <Button 
            onClick={handleOptimize}
            disabled={optimizePageMutation.isPending}
            size="lg"
            style={{ 
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
            }}
            className="text-white shadow-lg"
          >
            {optimizePageMutation.isPending ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <SignalIcon className="h-5 w-5 mr-2" />
            )}
            {getOptimizeButtonLabel()}
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              {pageHealth.score}%
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">Health Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {pageHealth.issues.length}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">Issues to Fix</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {images.length}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {page.word_count || 0}
            </div>
            <div className="text-xs text-[var(--text-tertiary)]">Words</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {optimizeResults && <TabsTrigger value="results">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Results
          </TabsTrigger>}
          <TabsTrigger value="preview">
            <Eye className="h-3.5 w-3.5 mr-1" />
            SERP Preview
          </TabsTrigger>
          <TabsTrigger value="images">
            <ImageIcon className="h-3.5 w-3.5 mr-1" />
            Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  Needs Attention ({pageHealth.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pageHealth.issues.length === 0 ? (
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    All checks passed!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pageHealth.issues.map((issue, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded text-sm ${
                          issue.severity === 'high' 
                            ? 'bg-red-500/10 text-red-400' 
                            : issue.severity === 'medium'
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        <XCircle className="h-4 w-4 flex-shrink-0" />
                        {issue.label}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What's Good */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  What's Good ({pageHealth.good.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pageHealth.good.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded bg-green-500/10 text-green-400 text-sm"
                    >
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">Title</div>
                  <div className="p-3 rounded bg-[var(--bg-secondary)] text-sm">
                    {page.title || <span className="text-red-400 italic">Missing</span>}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    {page.title_length || 0} characters
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">H1</div>
                  <div className="p-3 rounded bg-[var(--bg-secondary)] text-sm">
                    {page.h1 || <span className="text-red-400 italic">Missing</span>}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--text-secondary)] mb-1">Meta Description</div>
                <div className="p-3 rounded bg-[var(--bg-secondary)] text-sm">
                  {page.meta_description || <span className="text-red-400 italic">Missing</span>}
                </div>
                <div className="text-xs text-[var(--text-tertiary)] mt-1">
                  {page.meta_description_length || 0} characters
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab - Shows after optimization */}
        {optimizeResults && (
          <TabsContent value="results" className="mt-6 space-y-6">
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Signal Analysis Complete
                </CardTitle>
                <CardDescription>
                  Review the recommendations below and apply changes when ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metadata Recommendations */}
                {optimizeResults.metadata && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">Recommended Metadata</h4>
                    <div className="p-4 rounded-lg bg-[var(--bg-secondary)] space-y-3">
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">TITLE</div>
                        <div className="text-sm font-medium">{optimizeResults.metadata.title}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-tertiary)] mb-1">META DESCRIPTION</div>
                        <div className="text-sm">{optimizeResults.metadata.meta_description}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Analysis */}
                {optimizeResults.content_analysis && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">Content Analysis</h4>
                    <div className="p-4 rounded-lg bg-[var(--bg-secondary)]">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)]">Reading Level</div>
                          <div className="font-medium">{optimizeResults.content_analysis.reading_level || 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)]">Content Type</div>
                          <div className="font-medium capitalize">{optimizeResults.content_analysis.content_type || 'Unknown'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)]">Topics</div>
                          <div className="font-medium">{optimizeResults.content_analysis.topics?.length || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[var(--text-tertiary)]">Keywords</div>
                          <div className="font-medium">{optimizeResults.content_analysis.keywords?.length || 0}</div>
                        </div>
                      </div>
                      
                      {optimizeResults.content_analysis.strengths?.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-[var(--text-tertiary)] mb-2">Strengths</div>
                          <ul className="space-y-1">
                            {optimizeResults.content_analysis.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-green-400 flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {optimizeResults.content_analysis.weaknesses?.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs text-[var(--text-tertiary)] mb-2">Areas to Improve</div>
                          <ul className="space-y-1">
                            {optimizeResults.content_analysis.weaknesses.map((w, i) => (
                              <li key={i} className="text-sm text-yellow-400 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Image Alt Text */}
                {optimizeResults.images?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">
                      Image Alt Text ({optimizeResults.images.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-auto">
                      {optimizeResults.images.map((img, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[var(--bg-secondary)] text-sm">
                          <div className="text-xs text-[var(--text-tertiary)] truncate mb-1">
                            {img.src?.split('/').pop()}
                          </div>
                          <div>{img.optimized_alt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Wins */}
                {optimizeResults.quick_wins?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">Quick Wins</h4>
                    <div className="space-y-2">
                      {optimizeResults.quick_wins.map((win, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[var(--bg-secondary)] text-sm">
                          <div className="font-medium">{win.action}</div>
                          {win.current && (
                            <div className="text-xs text-[var(--text-tertiary)] mt-1">
                              Current: {win.current}
                            </div>
                          )}
                          {win.recommended && (
                            <div className="text-xs text-green-400 mt-1">
                              → {win.recommended}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Opportunities */}
                {optimizeResults.opportunities?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-[var(--text-secondary)]">Opportunities</h4>
                    <div className="space-y-2">
                      {optimizeResults.opportunities.map((opp, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-start gap-3">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            opp.impact === 'high' 
                              ? 'bg-red-500/20 text-red-400' 
                              : opp.impact === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {opp.impact}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{opp.title}</div>
                            <div className="text-xs text-[var(--text-tertiary)] mt-1">{opp.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                  <Button variant="outline" onClick={() => setOptimizeResults(null)}>
                    Discard
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={optimizePageMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {optimizePageMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Apply All Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* SERP Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <SEOSerpPreview 
            title={page.managed_title || page.title}
            url={page.url}
            description={page.managed_meta_description || page.meta_description}
          />
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page Images</CardTitle>
              <CardDescription>
                {images.length} images discovered on this page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {images.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
                  No images discovered yet. Images are detected when users visit the page.
                </p>
              ) : (
                <div className="space-y-3">
                  {images.map((img, idx) => (
                    <div key={img.id || idx} className="flex items-start gap-4 p-3 rounded-lg bg-[var(--bg-secondary)]">
                      <div className="w-16 h-16 rounded bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden">
                        {img.src ? (
                          <img 
                            src={img.src} 
                            alt={img.current_alt || 'Image'} 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-[var(--text-tertiary)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-[var(--text-tertiary)] truncate mb-1">
                          {img.src?.split('/').pop() || 'Unknown'}
                        </div>
                        <div className="text-sm">
                          {img.managed_alt || img.current_alt || (
                            <span className="text-red-400 italic">Missing alt text</span>
                          )}
                        </div>
                        {img.position_in_page && (
                          <div className="text-xs text-[var(--text-tertiary)] mt-1">
                            Position: {img.position_in_page}
                          </div>
                        )}
                      </div>
                      {(img.managed_alt || img.current_alt) ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Has Alt
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <XCircle className="h-3 w-3 mr-1" />
                          Missing
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab - Core Web Vitals */}
        <TabsContent value="performance" className="mt-6">
          <PagePerformanceSection page={page} projectId={projectId} site={site} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Performance / Core Web Vitals section for a single page
function PagePerformanceSection({ page, projectId, site }) {
  const [isScanning, setIsScanning] = useState(false)
  const [cwvData, setCwvData] = useState(null)
  const queryClient = useQueryClient()
  
  // Build full URL for the page
  const getPageUrl = () => {
    if (!site?.domain) return null
    const protocol = site.domain.includes('localhost') ? 'http://' : 'https://'
    const domain = site.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const path = page.path?.startsWith('/') ? page.path : `/${page.path || ''}`
    return `${protocol}${domain}${path}`
  }
  
  const handleScanPage = async () => {
    const url = getPageUrl()
    if (!url || !projectId) return
    
    setIsScanning(true)
    try {
      const response = await seoApi.checkPageCwv(projectId, { url })
      setCwvData(response.data || response)
      queryClient.invalidateQueries({ queryKey: ['seo'] })
      toast.success('PageSpeed scan complete')
    } catch (error) {
      toast.error('Failed to scan page')
      console.error('PageSpeed scan error:', error)
    } finally {
      setIsScanning(false)
    }
  }
  
  // Use stored CWV data if available
  const displayData = cwvData || {
    mobileScore: page.mobile_score,
    desktopScore: page.desktop_score,
    mobileLCP: page.mobile_lcp,
    desktopLCP: page.desktop_lcp,
    mobileCLS: page.mobile_cls,
    desktopCLS: page.desktop_cls,
    mobileFID: page.mobile_fid,
    desktopFID: page.desktop_fid,
    mobileTTFB: page.mobile_ttfb,
    desktopTTFB: page.desktop_ttfb,
  }
  
  const hasData = displayData.mobileScore || displayData.desktopScore
  
  const getScoreColor = (score) => {
    if (!score) return 'text-muted-foreground'
    if (score >= 90) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getScoreBg = (score) => {
    if (!score) return 'bg-muted/30'
    if (score >= 90) return 'bg-green-500/10'
    if (score >= 50) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Core Web Vitals</h3>
          <p className="text-sm text-muted-foreground">
            Performance metrics from Google PageSpeed Insights
          </p>
        </div>
        <Button onClick={handleScanPage} disabled={isScanning || !getPageUrl()}>
          {isScanning ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              {hasData ? 'Re-scan Page' : 'Scan Page'}
            </>
          )}
        </Button>
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Performance Data</h3>
            <p className="text-muted-foreground mb-4">
              Click "Scan Page" to run a PageSpeed Insights analysis on this page
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={getScoreBg(displayData.mobileScore)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'text-4xl font-bold',
                    getScoreColor(displayData.mobileScore)
                  )}>
                    {displayData.mobileScore || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
              </CardContent>
            </Card>

            <Card className={getScoreBg(displayData.desktopScore)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'text-4xl font-bold',
                    getScoreColor(displayData.desktopScore)
                  )}>
                    {displayData.desktopScore || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">/ 100</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Core Web Vitals Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MetricRow 
                  label="Largest Contentful Paint (LCP)"
                  mobileValue={displayData.mobileLCP}
                  desktopValue={displayData.desktopLCP}
                  unit="s"
                  good={2.5}
                  poor={4}
                />
                <MetricRow 
                  label="Cumulative Layout Shift (CLS)"
                  mobileValue={displayData.mobileCLS}
                  desktopValue={displayData.desktopCLS}
                  unit=""
                  good={0.1}
                  poor={0.25}
                />
                <MetricRow 
                  label="First Input Delay (FID)"
                  mobileValue={displayData.mobileFID}
                  desktopValue={displayData.desktopFID}
                  unit="ms"
                  good={100}
                  poor={300}
                />
                <MetricRow 
                  label="Time to First Byte (TTFB)"
                  mobileValue={displayData.mobileTTFB}
                  desktopValue={displayData.desktopTTFB}
                  unit="ms"
                  good={800}
                  poor={1800}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

// Helper for CWV metric rows
function MetricRow({ label, mobileValue, desktopValue, unit, good, poor }) {
  const getStatus = (value) => {
    if (value === undefined || value === null) return 'unknown'
    if (value <= good) return 'good'
    if (value <= poor) return 'warning'
    return 'poor'
  }
  
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    poor: 'text-red-400',
    unknown: 'text-muted-foreground'
  }
  
  const formatValue = (val) => {
    if (val === undefined || val === null) return '-'
    return `${val}${unit}`
  }

  return (
    <div className="p-3 rounded-lg bg-muted/30">
      <div className="text-sm font-medium text-foreground mb-2">{label}</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={cn('text-sm font-medium', statusColors[getStatus(mobileValue)])}>
            {formatValue(mobileValue)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={cn('text-sm font-medium', statusColors[getStatus(desktopValue)])}>
            {formatValue(desktopValue)}
          </span>
        </div>
      </div>
    </div>
  )
}