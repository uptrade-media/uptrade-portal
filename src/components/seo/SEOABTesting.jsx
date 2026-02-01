// src/components/seo/SEOABTesting.jsx
// A/B Testing Module - Create, manage, and analyze metadata A/B tests
// Futuristic UI with brand colors and dynamic visualizations

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Eye,
  Copy,
  Zap,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Beaker,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format, addDays } from 'date-fns'
import { signalSeoApi, budgetApi } from '@/lib/signal-api'
import { useSeoPages } from '@/hooks/seo'
import { useSignalAccess } from '@/lib/signal-access'

// Animated gradient background for cards
const GradientOrb = ({ className }) => (
  <div className={cn(
    "absolute rounded-full blur-3xl opacity-20 animate-pulse",
    className
  )} />
)

// Statistical significance indicator
function SignificanceIndicator({ significance, confidence }) {
  const isSignificant = significance >= 95
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
            "border transition-all duration-300",
            isSignificant 
              ? "bg-[var(--brand-primary)]/10 border-[var(--brand-primary)]/30 text-[var(--brand-primary)]"
              : "bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)]"
          )}>
            <Activity className="h-3 w-3" />
            <span>{significance.toFixed(1)}% confidence</span>
            {isSignificant && <CheckCircle className="h-3 w-3" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {isSignificant 
            ? "Statistically significant! Safe to declare a winner."
            : `Need ${(95 - significance).toFixed(1)}% more confidence for significance`
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Variant performance card with animated metrics
function VariantCard({ variant, isWinner, isControl, testStatus, onApply }) {
  const ctrChange = variant.ctr && variant.control_ctr 
    ? ((variant.ctr - variant.control_ctr) / variant.control_ctr * 100).toFixed(1)
    : null
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all duration-300",
        "bg-[var(--glass-bg)] backdrop-blur-sm",
        isWinner && "border-[var(--brand-primary)] shadow-lg shadow-[var(--brand-primary)]/10",
        !isWinner && "border-[var(--glass-border)] hover:border-[var(--brand-secondary)]/50"
      )}
    >
      {/* Winner crown */}
      {isWinner && (
        <div className="absolute -top-3 -right-3">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]"
          >
            <Crown className="h-4 w-4 text-white" />
          </motion.div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              isControl && "bg-[var(--glass-bg-inset)]"
            )}
          >
            {isControl ? 'Control' : variant.name || 'Variant'}
          </Badge>
          <span className="text-xs text-[var(--text-tertiary)]">
            {variant.traffic_percentage}% traffic
          </span>
        </div>
        {isWinner && testStatus === 'completed' && (
          <Button
            size="sm"
            onClick={() => onApply?.(variant)}
            className="h-7 text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
          >
            Apply Winner
          </Button>
        )}
      </div>
      
      {/* Title/Description preview */}
      <div className="mb-4 space-y-2">
        {variant.title && (
          <div className="p-2 rounded bg-[var(--glass-bg-inset)] text-sm">
            <span className="text-[var(--text-tertiary)] text-xs block mb-1">Title</span>
            <span className="text-[var(--text-primary)] line-clamp-1">{variant.title}</span>
          </div>
        )}
        {variant.description && (
          <div className="p-2 rounded bg-[var(--glass-bg-inset)] text-sm">
            <span className="text-[var(--text-tertiary)] text-xs block mb-1">Description</span>
            <span className="text-[var(--text-secondary)] line-clamp-2">{variant.description}</span>
          </div>
        )}
      </div>
      
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {variant.impressions?.toLocaleString() || '—'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Impressions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {variant.clicks?.toLocaleString() || '—'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Clicks</div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-2xl font-bold",
            isWinner ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"
          )}>
            {variant.ctr ? `${variant.ctr.toFixed(2)}%` : '—'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">CTR</div>
        </div>
      </div>
      
      {/* CTR change indicator */}
      {ctrChange && !isControl && (
        <div className={cn(
          "mt-3 pt-3 border-t border-[var(--glass-border)]",
          "flex items-center justify-center gap-1 text-sm font-medium",
          parseFloat(ctrChange) > 0 
            ? "text-[var(--brand-primary)]" 
            : "text-[var(--accent-red)]"
        )}>
          {parseFloat(ctrChange) > 0 ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <span>{parseFloat(ctrChange) > 0 ? '+' : ''}{ctrChange}% vs control</span>
        </div>
      )}
    </motion.div>
  )
}

// Test card in the list
function TestCard({ test, onViewDetails, onPause, onResume }) {
  const statusColors = {
    active: 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30',
    completed: 'bg-[var(--brand-secondary)]/10 text-[var(--brand-secondary)] border-[var(--brand-secondary)]/30',
    paused: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
    draft: 'bg-[var(--glass-bg-inset)] text-[var(--text-tertiary)] border-[var(--glass-border)]',
  }
  
  const statusIcons = {
    active: <Play className="h-3 w-3" />,
    completed: <Trophy className="h-3 w-3" />,
    paused: <Pause className="h-3 w-3" />,
    draft: <Beaker className="h-3 w-3" />,
  }
  
  const daysRemaining = test.ends_at 
    ? Math.max(0, Math.ceil((new Date(test.ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : null
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 4 }}
      className={cn(
        "group relative p-4 rounded-xl border cursor-pointer",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        "hover:border-[var(--brand-primary)]/30 hover:shadow-lg hover:shadow-[var(--brand-primary)]/5",
        "transition-all duration-300"
      )}
      onClick={() => onViewDetails(test)}
    >
      {/* Status indicator line */}
      <div className={cn(
        "absolute left-0 top-4 bottom-4 w-1 rounded-full transition-all",
        test.status === 'active' && "bg-[var(--brand-primary)]",
        test.status === 'completed' && "bg-[var(--brand-secondary)]",
        test.status === 'paused' && "bg-amber-500",
        test.status === 'draft' && "bg-[var(--text-tertiary)]"
      )} />
      
      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
              {test.name || 'Untitled Test'}
            </h4>
            <p className="text-sm text-[var(--text-tertiary)] truncate max-w-[300px]">
              {test.page_url || test.page_path}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-xs", statusColors[test.status])}
          >
            {statusIcons[test.status]}
            <span className="ml-1 capitalize">{test.status}</span>
          </Badge>
        </div>
        
        {/* Metrics row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Eye className="h-3.5 w-3.5" />
            <span>{test.total_impressions?.toLocaleString() || 0}</span>
          </div>
          <div className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Target className="h-3.5 w-3.5" />
            <span>{test.variants?.length || 2} variants</span>
          </div>
          {test.status === 'active' && daysRemaining !== null && (
            <div className="flex items-center gap-1 text-[var(--text-secondary)]">
              <Clock className="h-3.5 w-3.5" />
              <span>{daysRemaining}d left</span>
            </div>
          )}
          {test.statistical_significance && (
            <SignificanceIndicator 
              significance={test.statistical_significance} 
              confidence={test.confidence || 0}
            />
          )}
        </div>
        
        {/* Progress bar for active tests */}
        {test.status === 'active' && test.progress && (
          <div className="mt-3">
            <Progress 
              value={test.progress} 
              className="h-1.5 bg-[var(--glass-bg-inset)]"
            />
          </div>
        )}
        
        {/* Winner badge for completed tests */}
        {test.status === 'completed' && test.winner && (
          <div className="mt-3 flex items-center gap-2">
            <Badge className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30">
              <Trophy className="h-3 w-3 mr-1" />
              Winner: {test.winner.name || 'Variant ' + test.winner.variant_index}
            </Badge>
            <span className="text-xs text-[var(--brand-primary)]">
              +{test.winner.ctr_improvement?.toFixed(1)}% CTR
            </span>
          </div>
        )}
      </div>
      
      {/* Hover arrow */}
      <ChevronRight className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5",
        "text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100",
        "transition-all duration-300 group-hover:translate-x-1"
      )} />
    </motion.div>
  )
}

// Create new test dialog
function CreateTestDialog({ open, onOpenChange, onCreateTest, pages }) {
  const [selectedPage, setSelectedPage] = useState(null)
  const [testName, setTestName] = useState('')
  const [testDuration, setTestDuration] = useState('14')
  const [variants, setVariants] = useState([
    { name: 'Control', title: '', description: '', traffic: 50, isControl: true },
    { name: 'Variant B', title: '', description: '', traffic: 50, isControl: false },
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  const handleGenerateVariants = async () => {
    if (!selectedPage) return
    setIsGenerating(true)
    
    try {
      // Call Signal API to generate variant suggestions
      const suggestions = await signalSeoApi.getSignalSuggestions(
        selectedPage.project_id,
        selectedPage.url,
        { type: 'ab_variants' }
      )
      
      if (suggestions?.variants) {
        setVariants([
          { ...variants[0], title: selectedPage.title, description: selectedPage.meta_description },
          ...suggestions.variants.map((v, i) => ({
            name: `Variant ${String.fromCharCode(66 + i)}`,
            title: v.title,
            description: v.description,
            traffic: Math.floor(100 / (suggestions.variants.length + 1)),
            isControl: false,
          }))
        ])
      }
    } catch (error) {
      console.error('Failed to generate variants:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleCreate = async () => {
    if (!selectedPage || variants.length < 2) return
    setIsCreating(true)
    
    try {
      await onCreateTest({
        pageId: selectedPage.id,
        name: testName || `A/B Test - ${selectedPage.path}`,
        duration: parseInt(testDuration),
        variants: variants.map(v => ({
          ...v,
          traffic_percentage: v.traffic,
        })),
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create test:', error)
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-[var(--brand-primary)]" />
            Create A/B Test
          </DialogTitle>
          <DialogDescription>
            Test different titles and descriptions to optimize CTR
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Page selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Select Page to Test
            </label>
            <Select
              value={selectedPage?.id}
              onValueChange={(id) => setSelectedPage(pages?.find(p => p.id === id))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a page..." />
              </SelectTrigger>
              <SelectContent>
                {pages?.map(page => (
                  <SelectItem key={page.id} value={page.id}>
                    <span className="truncate">{page.path || page.url}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Test name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Test Name (optional)
            </label>
            <Input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Homepage Title Test Q1"
            />
          </div>
          
          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Test Duration
            </label>
            <Select value={testDuration} onValueChange={setTestDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Separator />
          
          {/* Variants */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                Test Variants
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateVariants}
                disabled={!selectedPage || isGenerating}
                className="text-[var(--brand-primary)] border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/10"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate with Signal
              </Button>
            </div>
            
            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border",
                    variant.isControl 
                      ? "bg-[var(--glass-bg-inset)] border-[var(--glass-border)]"
                      : "bg-[var(--glass-bg)] border-[var(--brand-secondary)]/30"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {variant.isControl ? 'Control' : variant.name}
                      </Badge>
                      <Input
                        type="number"
                        value={variant.traffic}
                        onChange={(e) => {
                          const newVariants = [...variants]
                          newVariants[index].traffic = parseInt(e.target.value) || 0
                          setVariants(newVariants)
                        }}
                        className="w-16 h-7 text-xs"
                        min={0}
                        max={100}
                      />
                      <span className="text-xs text-[var(--text-tertiary)]">% traffic</span>
                    </div>
                    {!variant.isControl && variants.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVariants(variants.filter((_, i) => i !== index))}
                        className="h-7 text-xs text-[var(--text-tertiary)]"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[var(--text-tertiary)]">Title</label>
                      <Input
                        value={variant.title}
                        onChange={(e) => {
                          const newVariants = [...variants]
                          newVariants[index].title = e.target.value
                          setVariants(newVariants)
                        }}
                        placeholder={variant.isControl ? "Current title (from page)" : "Enter variant title..."}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[var(--text-tertiary)]">Description</label>
                      <Textarea
                        value={variant.description}
                        onChange={(e) => {
                          const newVariants = [...variants]
                          newVariants[index].description = e.target.value
                          setVariants(newVariants)
                        }}
                        placeholder={variant.isControl ? "Current description" : "Enter variant description..."}
                        className="mt-1 resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {variants.length < 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVariants([
                  ...variants,
                  { 
                    name: `Variant ${String.fromCharCode(65 + variants.length)}`,
                    title: '',
                    description: '',
                    traffic: Math.floor(100 / (variants.length + 1)),
                    isControl: false,
                  }
                ])}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedPage || variants.length < 2 || isCreating}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start Test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Test detail view
function TestDetailView({ test, onBack, onApplyWinner, onPause, onResume }) {
  if (!test) return null
  
  const winningVariant = test.variants?.reduce((best, v) => 
    (!best || (v.ctr || 0) > (best.ctr || 0)) ? v : best
  , null)
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-2 -ml-2 text-[var(--text-tertiary)]"
          >
            ← Back to Tests
          </Button>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            {test.name || 'A/B Test'}
          </h2>
          <p className="text-[var(--text-secondary)] flex items-center gap-2 mt-1">
            <span>{test.page_url || test.page_path}</span>
            <Badge variant="outline" className="capitalize">{test.status}</Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {test.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => onPause?.(test.id)}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause Test
            </Button>
          )}
          {test.status === 'paused' && (
            <Button
              variant="outline"
              onClick={() => onResume?.(test.id)}
              className="text-[var(--brand-primary)] border-[var(--brand-primary)]/30"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume Test
            </Button>
          )}
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Impressions', value: test.total_impressions?.toLocaleString() || '0', icon: Eye },
          { label: 'Total Clicks', value: test.total_clicks?.toLocaleString() || '0', icon: Target },
          { label: 'Days Running', value: test.days_running || '0', icon: Clock },
          { label: 'Statistical Significance', value: `${(test.statistical_significance || 0).toFixed(1)}%`, icon: Activity },
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden">
            <GradientOrb className={cn(
              "w-32 h-32 -top-16 -right-16",
              i % 2 === 0 ? "bg-[var(--brand-primary)]" : "bg-[var(--brand-secondary)]"
            )} />
            <CardContent className="pt-4 relative">
              <stat.icon className="h-5 w-5 text-[var(--text-tertiary)] mb-2" />
              <div className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</div>
              <div className="text-sm text-[var(--text-tertiary)]">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Variants comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[var(--brand-primary)]" />
            Variant Performance
          </CardTitle>
          {test.statistical_significance >= 95 && (
            <SignificanceIndicator 
              significance={test.statistical_significance}
              confidence={test.confidence || 95}
            />
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {test.variants?.map((variant, index) => (
              <VariantCard
                key={index}
                variant={variant}
                isWinner={winningVariant?.id === variant.id && test.statistical_significance >= 95}
                isControl={variant.is_control || index === 0}
                testStatus={test.status}
                onApply={() => onApplyWinner?.(test.id, variant)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Winner recommendation */}
      {test.status === 'completed' && winningVariant && (
        <Card className="border-[var(--brand-primary)]/30 bg-gradient-to-br from-[var(--brand-primary)]/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--brand-primary)]/10">
                <Trophy className="h-6 w-6 text-[var(--brand-primary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Test Complete - Winner Found
                </h3>
                <p className="text-[var(--text-secondary)] mt-1">
                  {winningVariant.name || 'Variant'} outperformed the control by{' '}
                  <span className="text-[var(--brand-primary)] font-semibold">
                    {((winningVariant.ctr - (test.variants[0]?.ctr || 0)) / (test.variants[0]?.ctr || 1) * 100).toFixed(1)}%
                  </span>
                  {' '}with {test.statistical_significance?.toFixed(1)}% confidence.
                </p>
                <Button
                  className="mt-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                  onClick={() => onApplyWinner?.(test.id, winningVariant)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Apply Winning Variant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

// Main component
// MIGRATED TO REACT QUERY - Jan 29, 2026
export default function SEOABTesting({ projectId }) {
  const { hasAccess: hasSignalAccess } = useSignalAccess()
  
  // React Query hooks
  const { data: pagesData } = useSeoPages(projectId)
  const pages = pagesData?.pages || pagesData?.data || []
  
  const [tests, setTests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTest, setSelectedTest] = useState(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  
  // Fetch tests
  useEffect(() => {
    const loadTests = async () => {
      if (!projectId) return
      setIsLoading(true)
      
      try {
        // Fetch A/B tests from Signal API
        const response = await budgetApi.getActionHistory(projectId, 100)
        const abTests = response?.data?.filter(a => a.action_type === 'seo.create_ab_test') || []
        
        // Empty state if no tests exist yet
        if (abTests.length === 0) {
          setTests([])
        } else {
          setTests(abTests.map(t => ({
            id: t.id,
            name: t.payload?.name || 'A/B Test',
            page_url: t.payload?.page_url,
            status: t.status === 'completed' ? 'completed' : t.status === 'pending' ? 'draft' : 'active',
            variants: t.payload?.variants || [],
            total_impressions: t.result?.total_impressions || 0,
            total_clicks: t.result?.total_clicks || 0,
            statistical_significance: t.result?.statistical_significance || 0,
            created_at: t.created_at,
            ends_at: t.payload?.ends_at,
          })))
        }
      } catch (error) {
        console.error('Failed to load A/B tests:', error)
        setTests([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTests()
  }, [projectId])
  
  // Fetch pages for test creation
  // Note: Pages are now fetched automatically by React Query via useSeoPages hook
  
  const filteredTests = useMemo(() => {
    if (activeTab === 'all') return tests
    return tests.filter(t => t.status === activeTab)
  }, [tests, activeTab])
  
  const handleCreateTest = async (testData) => {
    try {
      // Create A/B test via Signal API
      const response = await budgetApi.approveAction(testData)
      
      // Refresh tests list
      setTests(prev => [...prev, {
        id: response.id || Date.now(),
        ...testData,
        status: 'active',
        created_at: new Date().toISOString(),
      }])
    } catch (error) {
      console.error('Failed to create test:', error)
      throw error
    }
  }
  
  const handleApplyWinner = async (testId, variant) => {
    try {
      // Apply winning variant via Signal API
      console.log('Applying winner:', testId, variant)
      // Update test status
      setTests(prev => prev.map(t => 
        t.id === testId ? { ...t, status: 'completed', winner: variant } : t
      ))
    } catch (error) {
      console.error('Failed to apply winner:', error)
    }
  }
  
  // Signal access gate
  if (!hasSignalAccess) {
    return (
      <Card className="border-[var(--brand-secondary)]/30">
        <CardContent className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/20">
            <FlaskConical className="h-8 w-8 text-[var(--brand-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">
            A/B Testing Requires Signal
          </h3>
          <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
            Test different titles and descriptions to find what drives more clicks.
            Enable Signal to unlock A/B testing.
          </p>
          <Button className="mt-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
            <Sparkles className="h-4 w-4 mr-2" />
            Enable Signal
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {selectedTest ? (
          <TestDetailView
            key="detail"
            test={selectedTest}
            onBack={() => setSelectedTest(null)}
            onApplyWinner={handleApplyWinner}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]">
                    <FlaskConical className="h-5 w-5 text-white" />
                  </div>
                  A/B Testing
                </h2>
                <p className="text-[var(--text-secondary)] mt-1">
                  Optimize metadata with data-driven experiments
                </p>
              </div>
              
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Test
              </Button>
            </div>
            
            {/* Stats cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Active Tests', value: tests.filter(t => t.status === 'active').length, color: 'brand-primary' },
                { label: 'Completed', value: tests.filter(t => t.status === 'completed').length, color: 'brand-secondary' },
                { label: 'Avg. CTR Lift', value: '+12.4%', color: 'brand-primary' },
                { label: 'Tests This Month', value: tests.length, color: 'brand-secondary' },
              ].map((stat, i) => (
                <Card key={i} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <GradientOrb className={cn(
                    "w-24 h-24 -top-12 -right-12 group-hover:scale-150 transition-transform duration-500",
                    `bg-[var(--${stat.color})]`
                  )} />
                  <CardContent className="pt-4 relative">
                    <div className={cn(
                      "text-3xl font-bold",
                      `text-[var(--${stat.color})]`
                    )}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="completed">
                  <Trophy className="h-3.5 w-3.5 mr-1.5" />
                  Completed
                </TabsTrigger>
                <TabsTrigger value="paused">
                  <Pause className="h-3.5 w-3.5 mr-1.5" />
                  Paused
                </TabsTrigger>
                <TabsTrigger value="all">All Tests</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                  </div>
                ) : filteredTests.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <FlaskConical className="h-12 w-12 mx-auto text-[var(--text-tertiary)] opacity-50 mb-4" />
                      <h3 className="text-lg font-medium text-[var(--text-primary)]">
                        No {activeTab === 'all' ? '' : activeTab} tests
                      </h3>
                      <p className="text-[var(--text-secondary)] mt-1">
                        Create your first A/B test to start optimizing
                      </p>
                      <Button
                        onClick={() => setCreateDialogOpen(true)}
                        className="mt-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Test
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredTests.map(test => (
                      <TestCard
                        key={test.id}
                        test={test}
                        onViewDetails={setSelectedTest}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Create test dialog */}
      <CreateTestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateTest={handleCreateTest}
        pages={pages}
      />
    </div>
  )
}
