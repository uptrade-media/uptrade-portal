// src/components/seo/signal/SignalLearningInsights.jsx
// Signal Learning Loop Visualization - Show what Signal has learned and prediction accuracy
// Futuristic UI with brand colors and dynamic visualizations

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle,
  XCircle,
  Lightbulb,
  Activity,
  BarChart3,
  Zap,
  RefreshCw,
  Loader2,
  ChevronRight,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signalSeoApi } from '@/lib/signal-api'
import { useSignalAccess } from '@/lib/signal-access'
import SignalAILogo from '@/components/signal/SignalAILogo'
import SignalIcon from '@/components/ui/SignalIcon'

// Animated Signal visualization using SignalAILogo
function SignalVisualization({ isActive, accuracy }) {
  return (
    <div className="relative">
      {/* Outer glow effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full bg-[var(--brand-primary)]/20 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      
      {/* Signal AI Logo - already has built-in animations */}
      <div className="relative">
        <SignalAILogo size={120} />
      </div>
      
      {/* Accuracy indicator */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <Badge className="bg-[var(--brand-primary)] text-white">
          {accuracy}% accuracy
        </Badge>
      </div>
    </div>
  )
}

// Learning pattern card
function LearningPatternCard({ pattern, type = 'success' }) {
  const isSuccess = type === 'success'
  
  return (
    <motion.div
      initial={{ opacity: 0, x: isSuccess ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-4 rounded-xl border",
        "bg-[var(--glass-bg)]",
        isSuccess 
          ? "border-[var(--brand-primary)]/30" 
          : "border-amber-500/30"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
          isSuccess ? "bg-[var(--brand-primary)]/10" : "bg-amber-500/10"
        )}>
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-[var(--brand-primary)]" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs capitalize">
              {pattern.field}
            </Badge>
            <span className="text-xs text-[var(--text-tertiary)]">
              {pattern.sampleSize} samples
            </span>
          </div>
          
          <p className="text-sm text-[var(--text-primary)] mb-2">
            {pattern.description}
          </p>
          
          {/* Traits */}
          <div className="flex flex-wrap gap-1.5">
            {pattern.traits?.map((trait, i) => (
              <Badge 
                key={i} 
                variant="outline" 
                className={cn(
                  "text-xs",
                  isSuccess 
                    ? "text-[var(--brand-primary)] border-[var(--brand-primary)]/30" 
                    : "text-amber-500 border-amber-500/30"
                )}
              >
                {trait}
              </Badge>
            ))}
          </div>
          
          {/* Confidence */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-[var(--text-tertiary)]">Confidence:</span>
            <Progress 
              value={pattern.confidence * 100} 
              className="flex-1 h-1.5 bg-[var(--glass-bg-inset)]"
            />
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {(pattern.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Prediction accuracy card
function PredictionAccuracyCard({ stats: rawStats }) {
  const n = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
  const stats = {
    accuracyRate: n(rawStats?.accuracyRate),
    totalPredictions: n(rawStats?.totalPredictions),
    accurateWithin2: n(rawStats?.accurateWithin2),
    accurateWithin5: n(rawStats?.accurateWithin5),
    avgPredictionError: Number.isFinite(Number(rawStats?.avgPredictionError)) ? Number(rawStats.avgPredictionError) : 0,
  }
  const total = stats.totalPredictions || 1
  return (
    <Card className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute w-64 h-64 -top-32 -right-32 rounded-full blur-3xl opacity-10 bg-[var(--brand-primary)]" />
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="h-5 w-5 text-[var(--brand-primary)]" />
          Prediction Accuracy
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-2 gap-6">
          {/* Main accuracy stat */}
          <div className="text-center">
            <div className="text-5xl font-bold text-[var(--brand-primary)]">
              {(stats.accuracyRate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-[var(--text-tertiary)] mt-1">
              Overall Accuracy
            </div>
            <div className="text-xs text-[var(--text-tertiary)] mt-2">
              Based on {stats.totalPredictions} predictions
            </div>
          </div>
          
          {/* Accuracy breakdown */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">Within ±2 positions</span>
                <span className="font-medium text-[var(--brand-primary)]">
                  {stats.accurateWithin2}
                </span>
              </div>
              <Progress 
                value={(stats.accurateWithin2 / total) * 100} 
                className="h-2 bg-[var(--glass-bg-inset)]"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-[var(--text-secondary)]">Within ±5 positions</span>
                <span className="font-medium text-[var(--brand-secondary)]">
                  {stats.accurateWithin5}
                </span>
              </div>
              <Progress 
                value={(stats.accurateWithin5 / total) * 100} 
                className="h-2 bg-[var(--glass-bg-inset)]"
              />
            </div>
            
            <div className="pt-2 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-tertiary)]">Avg. prediction error</span>
                <span className="font-medium text-[var(--text-primary)]">
                  ±{stats.avgPredictionError.toFixed(1)} positions
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Model adjustment recommendation
function ModelAdjustmentCard({ adjustment }) {
  const impactColors = {
    high: 'accent-red',
    medium: 'amber',
    low: 'brand-secondary',
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl border",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[var(--brand-primary)]" />
          <span className="font-medium text-[var(--text-primary)] capitalize">
            {adjustment.factor.replace(/_/g, ' ')}
          </span>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs capitalize",
            `text-[var(--${impactColors[adjustment.impact]})] border-[var(--${impactColors[adjustment.impact]})]/30`
          )}
        >
          {adjustment.impact} impact
        </Badge>
      </div>
      
      <p className="text-sm text-[var(--text-secondary)] mb-3">
        {adjustment.reason}
      </p>
      
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-[var(--text-tertiary)]">Current:</span>
          <span className="font-mono text-[var(--text-primary)]">{adjustment.currentValue}</span>
        </div>
        <ChevronRight className="h-3 w-3 text-[var(--text-tertiary)]" />
        <div className="flex items-center gap-1">
          <span className="text-[var(--text-tertiary)]">Suggested:</span>
          <span className="font-mono text-[var(--brand-primary)]">{adjustment.suggestedValue}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Insight card for what Signal learned
function InsightCard({ insight, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-[var(--glass-bg-inset)]"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--brand-primary)]/10 shrink-0">
        <Lightbulb className="h-4 w-4 text-[var(--brand-primary)]" />
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {insight}
      </p>
    </motion.div>
  )
}

// Main component
export default function SignalLearningInsights({ projectId }) {
  const { hasAccess: hasSignalAccess } = useSignalAccess()
  
  const [learningData, setLearningData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Fetch learning data
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return
      setIsLoading(true)
      
      try {
        // Fetch learning insights from Signal API
        const data = await signalSeoApi.getLearningInsights(projectId)
        if (data) {
          setLearningData(data)
        }
      } catch (error) {
        console.error('Failed to load learning data:', error)
        setLearningData(null)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [projectId])
  
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      // Call Signal API to run learning analysis
      await signalSeoApi.analyzeLearnings(projectId)
      // Refresh data after analysis
      const data = await signalSeoApi.getLearningInsights(projectId)
      if (data) {
        setLearningData(data)
      }
    } catch (error) {
      console.error('Failed to run analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // Signal access gate
  if (!hasSignalAccess) {
    return (
      <Card className="border-[var(--brand-secondary)]/30">
        <CardContent className="py-12 text-center">
          <div className="relative mx-auto mb-6 flex justify-center">
            <SignalAILogo size={80} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Signal Learning Requires Access
          </h3>
          <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
            See what Signal has learned from your SEO changes and how accurate predictions have been.
          </p>
          <Button className="mt-6 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
            <Sparkles className="h-4 w-4 mr-2" />
            Enable Signal
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <SignalVisualization isActive={true} accuracy={0} />
          <p className="text-[var(--text-secondary)] mt-6">Loading learning insights...</p>
        </div>
      </div>
    )
  }
  
  if (!learningData) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <SignalIcon className="h-12 w-12 mx-auto text-[var(--text-tertiary)] opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-primary)]">
            No learning data yet
          </h3>
          <p className="text-[var(--text-secondary)] mt-1">
            Signal needs more SEO changes with measured outcomes to build learning patterns.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  const successPatterns = learningData.patterns.filter(p => p.type === 'success_pattern')
  const failurePatterns = learningData.patterns.filter(p => p.type === 'failure_pattern')
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SignalVisualization 
            isActive={true} 
            accuracy={Math.round(learningData.accuracyStats.accuracyRate * 100)} 
          />
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              Signal Learning
            </h2>
            <p className="text-[var(--text-secondary)]">
              What Signal has learned from {learningData.accuracyStats.totalPredictions} predictions
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              Last analyzed {learningData.lastAnalyzed ? 
                `${Math.round((Date.now() - new Date(learningData.lastAnalyzed)) / (1000 * 60 * 60))}h ago` : 
                'never'
              }
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Analyze Learnings
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Model Tuning
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy stats */}
            <PredictionAccuracyCard stats={learningData.accuracyStats} />
            
            {/* Key insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {learningData.recommendations.map((insight, i) => (
                    <InsightCard key={i} insight={insight} index={i} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Calibration notice */}
          {learningData.calibration.shouldAdjust && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[var(--text-primary)]">
                      Confidence Calibration Needed
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {learningData.calibration.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="patterns" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success patterns */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[var(--brand-primary)]" />
                What Works
              </h3>
              <div className="space-y-3">
                {successPatterns.map((pattern, i) => (
                  <LearningPatternCard key={i} pattern={pattern} type="success" />
                ))}
              </div>
            </div>
            
            {/* Failure patterns */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                What to Avoid
              </h3>
              <div className="space-y-3">
                {failurePatterns.map((pattern, i) => (
                  <LearningPatternCard key={i} pattern={pattern} type="failure" />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="adjustments" className="mt-6">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Model Adjustment Recommendations</CardTitle>
              <CardDescription>
                Based on prediction accuracy analysis, these adjustments could improve future predictions
              </CardDescription>
            </CardHeader>
          </Card>
          
          <div className="space-y-3">
            {learningData.adjustments.map((adjustment, i) => (
              <ModelAdjustmentCard key={i} adjustment={adjustment} />
            ))}
          </div>
          
          {learningData.adjustments.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-[var(--brand-primary)] opacity-50 mb-4" />
                <p className="text-[var(--text-secondary)]">
                  Model is performing well - no adjustments recommended
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
