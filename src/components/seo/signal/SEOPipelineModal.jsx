/**
 * SEO Pipeline Modal
 * 
 * Shows real-time progress of the Ashbound-style 9-phase SEO optimization pipeline.
 * Displays:
 * - Current phase with progress indicator
 * - Completed phases with timing
 * - Final optimization results
 * - Predicted impact metrics
 */
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  Circle,
  Loader2,
  XCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Code,
  Link2,
  HelpCircle,
  TrendingUp,
  Clock,
  ArrowRight,
} from 'lucide-react'
import SignalIcon from '@/components/ui/SignalIcon'
import { useRunSeoPipeline, useSeoPipelineState } from '@/hooks/seo/useSeoSignal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Pipeline phase definitions with human-friendly labels
const PIPELINE_PHASES = [
  { id: '01-load-world-state', label: 'Loading World State', description: 'Gathering all site context (pages, keywords, GSC, competitors)' },
  { id: '02-pre-optimization-check', label: 'Pre-Optimization Check', description: 'Validating page data and readiness' },
  { id: '03-opportunity-analysis', label: 'Opportunity Analysis', description: 'Signal analyzing optimization opportunities' },
  { id: '04-generate-optimizations', label: 'Generating Optimizations', description: 'Creating metadata, schema, FAQs, alt text' },
  { id: '05-validation', label: 'Validating Content', description: 'Checking quality and consistency' },
  { id: '05b-repair', label: 'Repairing Issues', description: 'Fixing validation failures' },
  { id: '06-impact-prediction', label: 'Predicting Impact', description: 'Estimating ranking improvements' },
  { id: '07-apply-changes', label: 'Applying Changes', description: 'Saving to database' },
  { id: '08-outcome-tracking', label: 'Tracking Outcomes', description: 'Setting up measurement' },
  { id: '09-indexing-reconciliation', label: 'Indexing Reconciliation', description: 'Comparing sitemap vs GSC and submitting fixes' },
]

function getPhaseIndex(phaseId) {
  return PIPELINE_PHASES.findIndex(p => p.id === phaseId)
}

function getPhaseInfo(phaseId) {
  return PIPELINE_PHASES.find(p => p.id === phaseId) || { label: phaseId, description: '' }
}

function PhaseStatus({ phase, results, currentPhase }) {
  const result = results?.find(r => r.phase === phase.id)
  const isCurrent = currentPhase === phase.id
  const isCompleted = result?.ok === true
  const isFailed = result?.ok === false
  const isPending = !result && !isCurrent

  return (
    <div className={cn(
      "flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors",
      isCurrent && "bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]",
      isCompleted && "opacity-80",
      isFailed && "bg-red-500/10"
    )}>
      <div className="mt-0.5">
        {isCurrent ? (
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--brand-primary)' }} />
        ) : isCompleted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : isFailed ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium text-sm",
            isCurrent && "text-foreground",
            isCompleted && "text-muted-foreground",
            isPending && "text-muted-foreground/50"
          )}>
            {phase.label}
          </span>
          {result?.durationMs && (
            <span className="text-xs text-muted-foreground">
              {(result.durationMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <p className={cn(
          "text-xs mt-0.5",
          isCurrent ? "text-muted-foreground" : "text-muted-foreground/50"
        )}>
          {phase.description}
        </p>
        {result?.error && (
          <p className="text-xs text-red-400 mt-1">{result.error}</p>
        )}
      </div>
    </div>
  )
}

function OptimizationResults({ plan }) {
  if (!plan?.optimizations) return null
  
  const { optimizations, predicted_impact } = plan
  const { metadata, images, schema, content, internal_links } = optimizations

  return (
    <div className="space-y-4">
      {/* Metadata optimizations */}
      {(metadata?.title?.suggested || metadata?.meta_description?.suggested || metadata?.h1?.suggested) && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              Metadata Optimizations
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {metadata.title?.suggested && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Title</div>
                <div className="text-sm font-medium">{metadata.title.suggested}</div>
                {metadata.title.reason && (
                  <div className="text-xs text-muted-foreground mt-1">{metadata.title.reason}</div>
                )}
              </div>
            )}
            {metadata.meta_description?.suggested && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Meta Description</div>
                <div className="text-sm">{metadata.meta_description.suggested}</div>
                {metadata.meta_description.reason && (
                  <div className="text-xs text-muted-foreground mt-1">{metadata.meta_description.reason}</div>
                )}
              </div>
            )}
            {metadata.h1?.suggested && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">H1</div>
                <div className="text-sm font-medium">{metadata.h1.suggested}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schema */}
      {schema?.type && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              Schema Markup
              <Badge variant="outline" className="text-xs">{schema.type}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {schema.reason && (
              <p className="text-xs text-muted-foreground mb-2">{schema.reason}</p>
            )}
            <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto max-h-32">
              {JSON.stringify(schema.json, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Images */}
      {images?.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ImageIcon className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              Image Alt Text
              <Badge variant="outline" className="text-xs">{images.length} images</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {images.slice(0, 5).map((img, i) => (
                <div key={i} className="text-xs">
                  <span className="text-muted-foreground">{img.src?.split('/').pop()}:</span>
                  <span className="ml-2">{img.suggested_alt}</span>
                </div>
              ))}
              {images.length > 5 && (
                <div className="text-xs text-muted-foreground">+{images.length - 5} more</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQs */}
      {content?.faq_suggestions?.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HelpCircle className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              FAQ Suggestions
              <Badge variant="outline" className="text-xs">{content.faq_suggestions.length} FAQs</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {content.faq_suggestions.slice(0, 3).map((faq, i) => (
                <div key={i}>
                  <div className="text-sm font-medium">{faq.question}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{faq.answer?.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Internal Links */}
      {internal_links?.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link2 className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              Internal Link Suggestions
              <Badge variant="outline" className="text-xs">{internal_links.length} links</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {internal_links.slice(0, 5).map((link, i) => (
                <div key={i} className="text-xs flex items-center gap-2">
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{link.anchor_text}</span>
                  <span className="text-muted-foreground">→ {link.target_path}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Prediction */}
      {predicted_impact && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-400">
              <TrendingUp className="h-4 w-4" />
              Predicted Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-4 text-center">
              {predicted_impact.confidence !== undefined && (
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {Math.round(predicted_impact.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
              )}
              {predicted_impact.estimated_ranking_change !== undefined && (
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    +{predicted_impact.estimated_ranking_change}
                  </div>
                  <div className="text-xs text-muted-foreground">Position Change</div>
                </div>
              )}
              {predicted_impact.estimated_traffic_change !== undefined && (
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    +{predicted_impact.estimated_traffic_change}%
                  </div>
                  <div className="text-xs text-muted-foreground">Traffic Change</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function SEOPipelineModal({
  open,
  onOpenChange,
  projectId,
  pageIdOrPath,
  pagePath,
  onComplete,
}) {
  const [runId, setRunId] = useState(null)
  const [hasStarted, setHasStarted] = useState(false)
  const runPipelineMutation = useRunSeoPipeline()
  const { data: pipelineState, isLoading: isPolling } = useSeoPipelineState(runId)

  // Calculate progress
  const currentPhaseIndex = pipelineState?.currentPhase 
    ? getPhaseIndex(pipelineState.currentPhase)
    : (pipelineState?.phaseResults?.length || 0)
  const progress = Math.round((currentPhaseIndex / PIPELINE_PHASES.length) * 100)
  const isComplete = !pipelineState?.currentPhase && pipelineState?.phaseResults?.length > 0
  const hasFailed = pipelineState?.phaseResults?.some(r => !r.ok)

  // Start the pipeline when modal opens
  useEffect(() => {
    if (open && !hasStarted && projectId && pageIdOrPath) {
      setHasStarted(true)
      runPipelineMutation.mutate(
        { projectId, pageIdOrPath },
        {
          onSuccess: (result) => {
            setRunId(result.runId)
          },
          onError: (error) => {
            toast.error(error.message || 'Failed to start pipeline')
            onOpenChange(false)
          },
        }
      )
    }
  }, [open, hasStarted, projectId, pageIdOrPath])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setRunId(null)
      setHasStarted(false)
    }
  }, [open])

  // Notify parent when complete
  useEffect(() => {
    if (isComplete && pipelineState?.plan && onComplete) {
      onComplete(pipelineState)
    }
  }, [isComplete, pipelineState])

  const totalDuration = pipelineState?.phaseResults?.reduce((acc, r) => acc + (r.durationMs || 0), 0) || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SignalIcon className="h-5 w-5" style={{ color: 'var(--brand-primary)' }} />
            Signal SEO Optimization
          </DialogTitle>
          <DialogDescription>
            Running comprehensive 8-phase optimization for <strong>{pagePath || pageIdOrPath}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isComplete 
                  ? (hasFailed ? 'Pipeline completed with issues' : 'Pipeline complete!')
                  : `Phase ${currentPhaseIndex + 1} of ${PIPELINE_PHASES.length}`
                }
              </span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{(totalDuration / 1000).toFixed(1)}s</span>
              </div>
            </div>
            <Progress value={isComplete ? 100 : progress} className="h-2" />
          </div>

          <Separator />

          {/* Phase list or results */}
          <ScrollArea className="flex-1">
            {!isComplete ? (
              <div className="space-y-1">
                {PIPELINE_PHASES.map((phase) => (
                  <PhaseStatus
                    key={phase.id}
                    phase={phase}
                    results={pipelineState?.phaseResults}
                    currentPhase={pipelineState?.currentPhase}
                  />
                ))}
              </div>
            ) : (
              <OptimizationResults plan={pipelineState?.plan} />
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          {isComplete ? (
            <>
              {hasFailed && (
                <Button variant="outline" onClick={() => {
                  setRunId(null)
                  setHasStarted(false)
                }}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Done
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Run in Background
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SEOPipelineModal
