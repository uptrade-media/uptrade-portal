// src/components/seo/local/StreamingGenerationUI.jsx
// Premium streaming generation experience for location pages
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  MapPin,
  FileText,
  CheckCircle,
  Loader2,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Eye,
  Image,
  Code,
  Send,
  Zap
} from 'lucide-react'
import SignalIcon from '@/components/ui/SignalIcon'

// Phase configuration for generation steps
const GENERATION_PHASES = [
  { 
    id: 'context', 
    label: 'Building Context Rails', 
    icon: MapPin,
    description: 'Gathering local data, landmarks, and demographics'
  },
  { 
    id: 'content', 
    label: 'Generating Content', 
    icon: FileText,
    description: 'Creating unique, location-specific content'
  },
  { 
    id: 'schema', 
    label: 'Building Schema', 
    icon: Code,
    description: 'Generating structured data markup'
  },
  { 
    id: 'images', 
    label: 'Creating Hero Image', 
    icon: Image,
    description: 'Generating Signal-powered hero imagery'
  },
  { 
    id: 'indexing', 
    label: 'Submitting to Index', 
    icon: Send,
    description: 'Requesting Google indexing'
  }
]

/**
 * Premium streaming generation UI component
 * Shows real-time progress as location pages are generated
 */
export default function StreamingGenerationUI({
  locations = [],
  services = [],
  projectId,
  onComplete,
  onCancel
}) {
  // State
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0)
  const [currentServiceIndex, setCurrentServiceIndex] = useState(0)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [generationLog, setGenerationLog] = useState([])
  const [completedPages, setCompletedPages] = useState([])
  const [failedPages, setFailedPages] = useState([])
  const [isGenerating, setIsGenerating] = useState(true)
  const [streamingText, setStreamingText] = useState('')
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  const logRef = useRef(null)
  const startTimeRef = useRef(Date.now())
  
  // Calculate total pages and progress
  const totalPages = locations.length * services.length
  const completedCount = completedPages.length + failedPages.length
  const progressPercent = totalPages > 0 ? (completedCount / totalPages) * 100 : 0
  
  // Current location and service
  const currentLocation = locations[currentLocationIndex]
  const currentService = services[currentServiceIndex]
  
  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [])
  
  // Estimate remaining time
  useEffect(() => {
    if (completedCount > 0) {
      const avgTimePerPage = elapsedTime / completedCount
      const remaining = totalPages - completedCount
      setEstimatedTime(Math.round(avgTimePerPage * remaining))
    }
  }, [completedCount, elapsedTime, totalPages])
  
  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [generationLog])
  
  // Add log entry helper
  const addLog = (message, type = 'info') => {
    setGenerationLog(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }])
  }
  
  // Format time helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="py-4 text-center">
            <div className="text-3xl font-bold text-[var(--brand-primary)]">
              {completedPages.length}
            </div>
            <div className="text-sm text-[var(--text-tertiary)]">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="py-4 text-center">
            <div className="text-3xl font-bold text-[var(--accent-orange)]">
              {totalPages - completedCount}
            </div>
            <div className="text-sm text-[var(--text-tertiary)]">Remaining</div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="py-4 text-center">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-[var(--text-tertiary)]">Elapsed</div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="py-4 text-center">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              ~{formatTime(estimatedTime)}
            </div>
            <div className="text-sm text-[var(--text-tertiary)]">Remaining</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">
            Generating {completedCount + 1} of {totalPages} pages
          </span>
          <span className="text-[var(--brand-primary)] font-medium">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      
      {/* Current Generation */}
      <Card className="bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent border-[var(--brand-primary)]/30">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            {/* Animated Signal Icon */}
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[var(--brand-primary)]/20 animate-ping" />
              <div 
                className="relative p-4 rounded-full"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 20%, transparent)' }}
              >
                <SignalIcon className="h-8 w-8" style={{ color: 'var(--brand-primary)' }} />
              </div>
            </div>
            
            {/* Current Task */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                {currentLocation?.name || 'Unknown Location'}
              </h3>
              <p className="text-[var(--text-secondary)] mb-3">
                {currentService?.name || 'Unknown Service'}
              </p>
              
              {/* Phase Progress */}
              <div className="flex items-center gap-2">
                {GENERATION_PHASES.map((phase, i) => {
                  const Icon = phase.icon
                  const isActive = i === currentPhase
                  const isComplete = i < currentPhase
                  
                  return (
                    <div key={phase.id} className="flex items-center">
                      <motion.div
                        initial={false}
                        animate={{
                          scale: isActive ? 1.1 : 1,
                          backgroundColor: isComplete 
                            ? 'var(--brand-primary)' 
                            : isActive 
                              ? 'color-mix(in srgb, var(--brand-primary) 30%, transparent)'
                              : 'var(--glass-bg-inset)'
                        }}
                        className={`p-2 rounded-full flex items-center justify-center ${
                          isActive ? 'ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--glass-bg)]' : ''
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-4 w-4 text-white" />
                        ) : isActive ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                          </motion.div>
                        ) : (
                          <Icon className="h-4 w-4 text-[var(--text-tertiary)]" />
                        )}
                      </motion.div>
                      {i < GENERATION_PHASES.length - 1 && (
                        <div 
                          className={`w-8 h-0.5 mx-1 ${
                            i < currentPhase ? 'bg-[var(--brand-primary)]' : 'bg-[var(--glass-border)]'
                          }`} 
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Current Phase Description */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhase}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-sm text-[var(--text-tertiary)] mt-3"
                >
                  {GENERATION_PHASES[currentPhase]?.description}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Streaming Text Preview */}
          {streamingText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)]"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Generating content...</span>
              </div>
              <p className="text-sm text-[var(--text-primary)] line-clamp-3">
                {streamingText}
                <span className="inline-block w-2 h-4 bg-[var(--brand-primary)] animate-pulse ml-1" />
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
      
      {/* Generation Log */}
      <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
        <CardContent className="p-0">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h4 className="font-medium text-[var(--text-primary)]">Generation Log</h4>
            <Badge variant="outline">
              {generationLog.length} events
            </Badge>
          </div>
          <ScrollArea 
            ref={logRef}
            className="h-[200px]"
          >
            <div className="p-4 space-y-2 font-mono text-xs">
              {generationLog.length > 0 ? (
                generationLog.map((entry, i) => (
                  <div 
                    key={i}
                    className={`flex items-start gap-2 ${
                      entry.type === 'success' ? 'text-[var(--brand-primary)]' :
                      entry.type === 'error' ? 'text-[var(--accent-red)]' :
                      'text-[var(--text-tertiary)]'
                    }`}
                  >
                    <span className="opacity-50">[{entry.timestamp}]</span>
                    <span>{entry.message}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-[var(--text-tertiary)] py-8">
                  Waiting for generation to start...
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Completed Pages Preview */}
      {completedPages.length > 0 && (
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardContent className="p-0">
            <div className="p-4 border-b border-[var(--glass-border)]">
              <h4 className="font-medium text-[var(--text-primary)]">
                Recently Completed
              </h4>
            </div>
            <div className="divide-y divide-[var(--glass-border)]">
              {completedPages.slice(-5).reverse().map((page, i) => (
                <motion.div
                  key={page.id || i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 flex items-center gap-4"
                >
                  <div className="p-2 rounded-lg bg-[var(--brand-primary)]/10">
                    <CheckCircle className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {page.location} - {page.service}
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] truncate">
                      {page.path}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {page.uniqueness_score && (
                      <Badge 
                        variant="outline"
                        className={page.uniqueness_score > 0.9 
                          ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' 
                          : ''
                        }
                      >
                        {Math.round(page.uniqueness_score * 100)}% unique
                      </Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {page.url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={page.url} target="_blank" rel="noopener">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--glass-border)]">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={!isGenerating}
          className="border-[var(--glass-border)]"
        >
          Cancel Generation
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
            <Zap className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
            Powered by Signal
          </div>
          
          {!isGenerating && (
            <Button
              onClick={onComplete}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              View All Pages
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
