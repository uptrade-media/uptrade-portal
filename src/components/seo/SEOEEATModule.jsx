// src/components/seo/SEOEEATModule.jsx
// E-E-A-T Module - Experience, Expertise, Authoritativeness, Trustworthiness
// Author attribution, citations, and trust signal management

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  UserCheck,
  Award,
  Shield,
  FileCheck,
  BookOpen,
  ExternalLink,
  Plus,
  Sparkles,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Link2,
  Quote,
  User,
  Star,
  Loader2,
  ChevronRight,
  Edit,
  Eye,
  Target,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signalSeoApi } from '@/lib/signal-api'
import { useSignalAccess } from '@/lib/signal-access'
import SignalIcon from '@/components/ui/SignalIcon'

// E-E-A-T Score visualization
function EEATScoreRing({ score, label, color = 'brand-primary', size = 'default' }) {
  const radius = size === 'large' ? 45 : 30
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn("relative", size === 'large' ? "w-28 h-28" : "w-20 h-20")}>
        {/* Background circle */}
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke="var(--glass-border)"
            strokeWidth={size === 'large' ? 8 : 6}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r={radius}
            fill="none"
            stroke={`var(--${color})`}
            strokeWidth={size === 'large' ? 8 : 6}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            "font-bold",
            size === 'large' ? "text-2xl" : "text-lg",
            `text-[var(--${color})]`
          )}>
            {score}
          </span>
        </div>
      </div>
      <span className={cn(
        "text-[var(--text-tertiary)] mt-2",
        size === 'large' ? "text-sm" : "text-xs"
      )}>
        {label}
      </span>
    </div>
  )
}

// Author card with expertise display
function AuthorCard({ author, onEdit, onViewContent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group p-4 rounded-xl border cursor-pointer",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        "hover:border-[var(--brand-primary)]/30 hover:shadow-lg hover:shadow-[var(--brand-primary)]/5",
        "transition-all duration-300"
      )}
      onClick={() => onViewContent?.(author)}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border-2 border-[var(--brand-primary)]/20">
          <AvatarImage src={author.avatar_url} />
          <AvatarFallback className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
            {author.name?.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
              {author.name}
            </h4>
            {author.verified && (
              <CheckCircle className="h-4 w-4 text-[var(--brand-primary)]" />
            )}
          </div>
          
          <p className="text-sm text-[var(--text-secondary)] mb-2">
            {author.title || author.credentials}
          </p>
          
          {/* Expertise badges */}
          <div className="flex flex-wrap gap-1.5">
            {author.expertise?.slice(0, 3).map((exp, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {exp}
              </Badge>
            ))}
            {author.expertise?.length > 3 && (
              <Badge variant="outline" className="text-xs text-[var(--text-tertiary)]">
                +{author.expertise.length - 3}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Content count */}
        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {author.content_count || 0}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">articles</div>
        </div>
      </div>
      
      {/* Schema status */}
      <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {author.has_schema ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              <span className="text-[var(--brand-primary)]">Person Schema Active</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-amber-500">Schema Missing</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(author)
          }}
          className="h-7 text-xs"
        >
          <Edit className="h-3 w-3 mr-1" />
          Edit
        </Button>
      </div>
    </motion.div>
  )
}

// Citation card
function CitationCard({ citation, onAddToContent }) {
  const sourceTypes = {
    academic: { icon: BookOpen, color: 'brand-primary', label: 'Academic' },
    government: { icon: Shield, color: 'brand-secondary', label: 'Government' },
    industry: { icon: Target, color: 'amber', label: 'Industry' },
    news: { icon: FileCheck, color: 'blue', label: 'News' },
    expert: { icon: UserCheck, color: 'purple', label: 'Expert' },
  }
  
  const config = sourceTypes[citation.source_type] || sourceTypes.industry
  const Icon = config.icon
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "p-4 rounded-xl border",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        "hover:border-[var(--brand-secondary)]/30",
        "transition-all duration-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
          "bg-[var(--glass-bg-inset)]"
        )}>
          <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {config.label}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                citation.authority === 'high' 
                  ? "text-[var(--brand-primary)] border-[var(--brand-primary)]/30"
                  : "text-[var(--text-tertiary)]"
              )}
            >
              {citation.authority} authority
            </Badge>
          </div>
          
          <h4 className="font-medium text-[var(--text-primary)] text-sm mb-1 line-clamp-1">
            {citation.title}
          </h4>
          
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">
            {citation.claim}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
            <span>{citation.source}</span>
            {citation.url && (
              <a 
                href={citation.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[var(--brand-primary)] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                View
              </a>
            )}
          </div>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => onAddToContent?.(citation)}
          className="h-8 text-xs text-[var(--brand-primary)] border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/10"
        >
          <Plus className="h-3 w-3 mr-1" />
          Use
        </Button>
      </div>
    </motion.div>
  )
}

// Content with E-E-A-T issues
function ContentEEATCard({ content, onFix }) {
  const eatScore = content.eat_score || 0
  const issues = content.eeat_issues || []
  
  return (
    <Card className="relative overflow-hidden">
      {/* Score indicator bar */}
      <div 
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          eatScore >= 80 ? "bg-[var(--brand-primary)]" :
          eatScore >= 60 ? "bg-amber-500" :
          "bg-[var(--accent-red)]"
        )}
        style={{ width: `${eatScore}%` }}
      />
      
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-[var(--text-primary)] line-clamp-1">
              {content.title}
            </h4>
            <p className="text-xs text-[var(--text-tertiary)]">{content.url}</p>
          </div>
          <EEATScoreRing score={eatScore} label="E-A-T" size="default" />
        </div>
        
        {/* Issues list */}
        {issues.length > 0 && (
          <div className="space-y-2 mb-3">
            {issues.slice(0, 2).map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="text-[var(--text-secondary)]">{issue}</span>
              </div>
            ))}
            {issues.length > 2 && (
              <span className="text-xs text-[var(--text-tertiary)]">
                +{issues.length - 2} more issues
              </span>
            )}
          </div>
        )}
        
        {/* Author attribution status */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
          <div className="flex items-center gap-2 text-xs">
            {content.author ? (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px]">
                    {content.author.name?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[var(--text-secondary)]">{content.author.name}</span>
              </>
            ) : (
              <>
                <User className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-500">No author</span>
              </>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onFix?.(content)}
            className="h-7 text-xs bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Enhance E-E-A-T
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main component
export default function SEOEEATModule({ projectId }) {
  const { hasAccess: hasSignalAccess } = useSignalAccess()
  
  const [authors, setAuthors] = useState([])
  const [citations, setCitations] = useState([])
  const [contentWithIssues, setContentWithIssues] = useState([])
  const [overallScore, setOverallScore] = useState({ experience: 0, expertise: 0, authority: 0, trust: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [isGeneratingCitations, setIsGeneratingCitations] = useState(false)
  
  // Fetch E-E-A-T data
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return
      setIsLoading(true)
      
      try {
        // Fetch E-E-A-T analysis from Signal API
        const data = await signalSeoApi.getEEATAnalysis(projectId)
        
        // Set overall scores
        if (data?.scores) {
          setOverallScore({
            experience: data.scores.experience || 0,
            expertise: data.scores.expertise || 0,
            authority: data.scores.authority || 0,
            trust: data.scores.trust || 0,
          })
        }
        
        // Set authors
        setAuthors(data?.authors || [])
        
        // Set citations
        setCitations(data?.citations || [])
        
        // Set content with issues
        setContentWithIssues(data?.contentIssues || data?.content_with_issues || [])
      } catch (error) {
        console.error('Failed to load E-E-A-T data:', error)
        // Set empty defaults on error
        setOverallScore({ experience: 0, expertise: 0, authority: 0, trust: 0 })
        setAuthors([])
        setCitations([])
        setContentWithIssues([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [projectId])
  
  const handleGenerateCitations = async (contentUrl, content) => {
    setIsGeneratingCitations(true)
    try {
      // Call Signal API to generate citation suggestions
      const suggestions = await signalSeoApi.suggestCitations(projectId, content || contentUrl, [])
      if (suggestions && Array.isArray(suggestions)) {
        setCitations(prev => [...prev, ...suggestions])
      }
    } catch (error) {
      console.error('Failed to generate citations:', error)
    } finally {
      setIsGeneratingCitations(false)
    }
  }
  
  // Signal access gate
  if (!hasSignalAccess) {
    return (
      <Card className="border-[var(--brand-secondary)]/30">
        <CardContent className="py-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-secondary)]/20">
            <Award className="h-8 w-8 text-[var(--brand-primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mt-4">
            E-E-A-T Analysis Requires Signal
          </h3>
          <p className="text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
            Build trust signals, manage author expertise, and enhance content authority.
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
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
    )
  }
  
  const avgScore = Math.round(
    (overallScore.experience + overallScore.expertise + overallScore.authority + overallScore.trust) / 4
  )
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]">
              <Award className="h-5 w-5 text-white" />
            </div>
            E-E-A-T Analysis
          </h2>
          <p className="text-[var(--text-secondary)] mt-1">
            Experience, Expertise, Authoritativeness & Trustworthiness
          </p>
        </div>
        
        <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
          <SignalIcon className="h-4 w-4 mr-2" color="white" />
          Run Full Analysis
        </Button>
      </div>
      
      {/* Overall E-E-A-T Scores */}
      <Card className="relative overflow-hidden">
        <div className="absolute w-64 h-64 -top-32 -right-32 rounded-full blur-3xl opacity-10 bg-[var(--brand-primary)]" />
        <CardContent className="pt-6 relative">
          <div className="flex items-center justify-between">
            {/* Overall score */}
            <div className="flex items-center gap-8">
              <EEATScoreRing score={avgScore} label="Overall E-E-A-T" color="brand-primary" size="large" />
              
              <div className="space-y-3">
                {[
                  { label: 'Experience', score: overallScore.experience, desc: 'First-hand experience signals' },
                  { label: 'Expertise', score: overallScore.expertise, desc: 'Credentials & qualifications' },
                  { label: 'Authority', score: overallScore.authority, desc: 'Industry recognition' },
                  { label: 'Trust', score: overallScore.trust, desc: 'Accuracy & transparency' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-[var(--text-secondary)]">{item.label}</div>
                    <div className="flex-1 w-48">
                      <Progress 
                        value={item.score} 
                        className="h-2 bg-[var(--glass-bg-inset)]"
                      />
                    </div>
                    <div className={cn(
                      "w-10 text-sm font-medium",
                      item.score >= 80 ? "text-[var(--brand-primary)]" :
                      item.score >= 60 ? "text-amber-500" :
                      "text-[var(--accent-red)]"
                    )}>
                      {item.score}
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="text-xs text-[var(--text-tertiary)]">ⓘ</div>
                        </TooltipTrigger>
                        <TooltipContent>{item.desc}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Authors', value: authors.length, icon: UserCheck },
                { label: 'With Schema', value: authors.filter(a => a.has_schema).length, icon: FileCheck },
                { label: 'Citations Used', value: citations.length, icon: Quote },
                { label: 'Content Issues', value: contentWithIssues.length, icon: AlertTriangle, alert: true },
              ].map((stat, i) => (
                <div 
                  key={i}
                  className={cn(
                    "p-3 rounded-lg text-center",
                    "bg-[var(--glass-bg-inset)]"
                  )}
                >
                  <stat.icon className={cn(
                    "h-5 w-5 mx-auto mb-1",
                    stat.alert ? "text-amber-500" : "text-[var(--text-tertiary)]"
                  )} />
                  <div className={cn(
                    "text-xl font-bold",
                    stat.alert ? "text-amber-500" : "text-[var(--text-primary)]"
                  )}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Award className="h-3.5 w-3.5 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="authors">
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Authors
          </TabsTrigger>
          <TabsTrigger value="citations">
            <Quote className="h-3.5 w-3.5 mr-1.5" />
            Citations
          </TabsTrigger>
          <TabsTrigger value="content">
            <FileCheck className="h-3.5 w-3.5 mr-1.5" />
            Content Issues
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Authors preview */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Content Authors</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Author
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {authors.slice(0, 2).map(author => (
                    <AuthorCard key={author.id} author={author} />
                  ))}
                </div>
                {authors.length > 2 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 text-sm"
                    onClick={() => setActiveTab('authors')}
                  >
                    View all {authors.length} authors
                  </Button>
                )}
              </CardContent>
            </Card>
            
            {/* Content needing attention */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    Content Needing Attention
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                      {contentWithIssues.length}
                    </Badge>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {contentWithIssues.slice(0, 2).map(content => (
                    <ContentEEATCard 
                      key={content.id} 
                      content={content} 
                      onFix={() => {}}
                    />
                  ))}
                </div>
                {contentWithIssues.length > 2 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-3 text-sm"
                    onClick={() => setActiveTab('content')}
                  >
                    View all {contentWithIssues.length} items
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="authors" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Content Authors ({authors.length})
            </h3>
            <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              Add Author
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {authors.map(author => (
              <AuthorCard key={author.id} author={author} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="citations" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Citation Library
            </h3>
            <Button 
              onClick={() => handleGenerateCitations()}
              disabled={isGeneratingCitations}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              {isGeneratingCitations ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Find Citations with Signal
            </Button>
          </div>
          <div className="space-y-3">
            {citations.map(citation => (
              <CitationCard 
                key={citation.id} 
                citation={citation}
                onAddToContent={() => {}}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="content" className="mt-6">
          <div className="space-y-4">
            {contentWithIssues.map(content => (
              <ContentEEATCard 
                key={content.id} 
                content={content}
                onFix={() => {}}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
