// src/components/seo/SEORedirectManager.jsx
// Redirect Management - Create, manage, and track redirects with impact analysis
// Futuristic UI with brand colors

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  CornerDownRight,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link2,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Loader2,
  Sparkles,
  Trash2,
  Edit,
  Copy,
  FileWarning,
  TrendingUp,
  Clock,
  Zap,
  Filter,
  Download,
  Upload,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { signalSeoApi } from '@/lib/signal-api'
import { seoApi } from '@/lib/portal-api'
import { useSignalAccess } from '@/lib/signal-access'

// Redirect type configuration
const REDIRECT_TYPES = {
  301: { label: '301 Permanent', color: 'brand-primary', description: 'Permanent redirect, passes SEO value' },
  302: { label: '302 Temporary', color: 'amber', description: 'Temporary redirect, does not pass SEO value' },
  307: { label: '307 Temporary', color: 'amber', description: 'Temporary redirect, preserves request method' },
  308: { label: '308 Permanent', color: 'brand-primary', description: 'Permanent redirect, preserves request method' },
}

// Redirect card component
function RedirectCard({ redirect, onEdit, onDelete, onTest }) {
  const typeConfig = REDIRECT_TYPES[redirect.redirect_type] || REDIRECT_TYPES[301]
  const hasChain = redirect.chain_length > 1
  const is404Source = redirect.is_404_fix
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group p-4 rounded-xl border",
        "bg-[var(--glass-bg)] border-[var(--glass-border)]",
        "hover:border-[var(--brand-primary)]/30 hover:shadow-lg hover:shadow-[var(--brand-primary)]/5",
        "transition-all duration-300"
      )}
    >
      {/* Status indicators */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              `text-[var(--${typeConfig.color})] border-[var(--${typeConfig.color})]/30`
            )}
          >
            {typeConfig.label}
          </Badge>
          {is404Source && (
            <Badge className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/30">
              <FileWarning className="h-3 w-3 mr-1" />
              404 Fix
            </Badge>
          )}
          {hasChain && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Chain ({redirect.chain_length})
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  Redirect chain detected. Consider consolidating to a single redirect.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTest?.(redirect)}
            className="h-7 w-7 p-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(redirect)}
            className="h-7 w-7 p-0"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(redirect)}
            className="h-7 w-7 p-0 text-red-400 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Paths */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">From</div>
          <div className="p-2 rounded bg-[var(--glass-bg-inset)] text-sm font-mono text-[var(--text-primary)] truncate">
            {redirect.from_path}
          </div>
        </div>
        
        <CornerDownRight className="h-5 w-5 text-[var(--brand-primary)] shrink-0 mt-5" />
        
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">To</div>
          <div className="p-2 rounded bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/20 text-sm font-mono text-[var(--brand-primary)] truncate">
            {redirect.to_path}
          </div>
        </div>
      </div>
      
      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Created {formatDistanceToNow(new Date(redirect.created_at))} ago
          </span>
          {redirect.hits && (
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {redirect.hits.toLocaleString()} hits
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {redirect.status === 'active' ? (
            <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          )}
          <span className={redirect.status === 'active' ? 'text-[var(--brand-primary)]' : 'text-red-400'}>
            {redirect.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Create/Edit redirect dialog
function RedirectDialog({ open, onOpenChange, redirect, onSave }) {
  const [fromPath, setFromPath] = useState(redirect?.from_path || '')
  const [toPath, setToPath] = useState(redirect?.to_path || '')
  const [redirectType, setRedirectType] = useState(redirect?.redirect_type?.toString() || '301')
  const [isRegex, setIsRegex] = useState(redirect?.is_regex || false)
  const [isSaving, setIsSaving] = useState(false)
  
  useEffect(() => {
    if (redirect) {
      setFromPath(redirect.from_path || '')
      setToPath(redirect.to_path || '')
      setRedirectType(redirect.redirect_type?.toString() || '301')
      setIsRegex(redirect.is_regex || false)
    } else {
      setFromPath('')
      setToPath('')
      setRedirectType('301')
      setIsRegex(false)
    }
  }, [redirect, open])
  
  const handleSave = async () => {
    if (!fromPath || !toPath) return
    setIsSaving(true)
    
    try {
      await onSave?.({
        id: redirect?.id,
        from_path: fromPath,
        to_path: toPath,
        redirect_type: parseInt(redirectType),
        is_regex: isRegex,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save redirect:', error)
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CornerDownRight className="h-5 w-5 text-[var(--brand-primary)]" />
            {redirect ? 'Edit Redirect' : 'Create Redirect'}
          </DialogTitle>
          <DialogDescription>
            {redirect ? 'Update the redirect configuration' : 'Add a new redirect rule'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* From path */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              From Path (Source)
            </label>
            <Input
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/old-page"
              className="font-mono"
            />
            <p className="text-xs text-[var(--text-tertiary)]">
              The URL path that should redirect
            </p>
          </div>
          
          {/* To path */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              To Path (Destination)
            </label>
            <Input
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="/new-page"
              className="font-mono"
            />
            <p className="text-xs text-[var(--text-tertiary)]">
              The destination URL (can be relative or absolute)
            </p>
          </div>
          
          {/* Redirect type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              Redirect Type
            </label>
            <Select value={redirectType} onValueChange={setRedirectType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REDIRECT_TYPES).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{config.label}</span>
                      <span className="text-xs text-[var(--text-tertiary)]">
                        - {config.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Regex toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-bg-inset)]">
            <div>
              <div className="text-sm font-medium text-[var(--text-primary)]">Use Regex Pattern</div>
              <div className="text-xs text-[var(--text-tertiary)]">
                Enable regular expression matching for the source path
              </div>
            </div>
            <Button
              variant={isRegex ? "default" : "outline"}
              size="sm"
              onClick={() => setIsRegex(!isRegex)}
              className={isRegex ? "bg-[var(--brand-primary)]" : ""}
            >
              {isRegex ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!fromPath || !toPath || isSaving}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {redirect ? 'Update' : 'Create'} Redirect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export default function SEORedirectManager({ projectId }) {
  const { hasAccess: hasSignalAccess } = useSignalAccess()
  
  const [redirects, setRedirects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRedirect, setEditingRedirect] = useState(null)
  const [isGenerating404Fixes, setIsGenerating404Fixes] = useState(false)
  
  // Fetch redirects
  useEffect(() => {
    const loadRedirects = async () => {
      if (!projectId) return
      setIsLoading(true)
      
      try {
        // Fetch redirects from Portal API
        const response = await seoApi.getRedirects(projectId)
        const data = response?.data || response || []
        setRedirects(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to load redirects:', error)
        setRedirects([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadRedirects()
  }, [projectId])
  
  const filteredRedirects = useMemo(() => {
    let filtered = redirects
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(r => 
        r.from_path.toLowerCase().includes(query) ||
        r.to_path.toLowerCase().includes(query)
      )
    }
    
    // Type filter
    if (filterType !== 'all') {
      if (filterType === '404') {
        filtered = filtered.filter(r => r.is_404_fix)
      } else if (filterType === 'chain') {
        filtered = filtered.filter(r => r.chain_length > 1)
      } else {
        filtered = filtered.filter(r => r.redirect_type.toString() === filterType)
      }
    }
    
    return filtered
  }, [redirects, searchQuery, filterType])
  
  const handleSaveRedirect = async (data) => {
    try {
      if (data.id && data.id !== 'new') {
        // Update existing redirect
        const response = await seoApi.updateRedirect(data.id, data)
        const updated = response?.data || response
        setRedirects(prev => prev.map(r => r.id === data.id ? { ...r, ...updated } : r))
      } else {
        // Create new redirect
        const response = await seoApi.createRedirect(projectId, {
          from_path: data.from_path,
          to_path: data.to_path,
          redirect_type: data.redirect_type,
          is_regex: data.is_regex || false,
          is_404_fix: data.is_404_fix || false,
        })
        const created = response?.data || response
        setRedirects(prev => [...prev, created])
      }
    } catch (error) {
      console.error('Failed to save redirect:', error)
    }
  }
  
  const handleDeleteRedirect = async (redirect) => {
    try {
      await seoApi.deleteRedirect(redirect.id)
      setRedirects(prev => prev.filter(r => r.id !== redirect.id))
    } catch (error) {
      console.error('Failed to delete redirect:', error)
    }
  }
  
  const handleGenerate404Fixes = async () => {
    setIsGenerating404Fixes(true)
    try {
      // Call Signal API to analyze 404s and suggest redirects
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Add suggested redirects
    } catch (error) {
      console.error('Failed to generate 404 fixes:', error)
    } finally {
      setIsGenerating404Fixes(false)
    }
  }
  
  const stats = useMemo(() => ({
    total: redirects.length,
    active: redirects.filter(r => r.status === 'active').length,
    chains: redirects.filter(r => r.chain_length > 1).length,
    '404Fixes': redirects.filter(r => r.is_404_fix).length,
  }), [redirects])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)]">
              <CornerDownRight className="h-5 w-5 text-white" />
            </div>
            Redirect Manager
          </h2>
          <p className="text-[var(--text-secondary)] mt-1">
            Manage URL redirects and fix broken links
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasSignalAccess && (
            <Button
              variant="outline"
              onClick={handleGenerate404Fixes}
              disabled={isGenerating404Fixes}
              className="text-[var(--brand-primary)] border-[var(--brand-primary)]/30"
            >
              {isGenerating404Fixes ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Fix 404s with Signal
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingRedirect(null)
              setDialogOpen(true)
            }}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Redirect
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Redirects', value: stats.total, icon: Link2, color: 'brand-primary' },
          { label: 'Active', value: stats.active, icon: CheckCircle, color: 'brand-secondary' },
          { label: '404 Fixes', value: stats['404Fixes'], icon: FileWarning, color: 'amber' },
          { label: 'Chains to Fix', value: stats.chains, icon: AlertTriangle, color: 'accent-red', alert: stats.chains > 0 },
        ].map((stat, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className={cn(
              "absolute w-24 h-24 -top-12 -right-12 rounded-full blur-3xl opacity-15",
              `bg-[var(--${stat.color})]`
            )} />
            <CardContent className="pt-4 relative">
              <stat.icon className={cn(
                "h-5 w-5 mb-2",
                stat.alert ? `text-[var(--${stat.color})]` : "text-[var(--text-tertiary)]"
              )} />
              <div className={cn(
                "text-3xl font-bold",
                stat.alert ? `text-[var(--${stat.color})]` : "text-[var(--text-primary)]"
              )}>
                {stat.value}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search redirects..."
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Redirects</SelectItem>
            <SelectItem value="301">301 Permanent</SelectItem>
            <SelectItem value="302">302 Temporary</SelectItem>
            <SelectItem value="404">404 Fixes</SelectItem>
            <SelectItem value="chain">Redirect Chains</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>
      
      {/* Redirects list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
        </div>
      ) : filteredRedirects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CornerDownRight className="h-12 w-12 mx-auto text-[var(--text-tertiary)] opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              {searchQuery || filterType !== 'all' ? 'No redirects match your filters' : 'No redirects yet'}
            </h3>
            <p className="text-[var(--text-secondary)] mt-1">
              Create redirects to fix broken links and manage URL changes
            </p>
            <Button
              onClick={() => {
                setEditingRedirect(null)
                setDialogOpen(true)
              }}
              className="mt-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Redirect
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRedirects.map(redirect => (
            <RedirectCard
              key={redirect.id}
              redirect={redirect}
              onEdit={(r) => {
                setEditingRedirect(r)
                setDialogOpen(true)
              }}
              onDelete={handleDeleteRedirect}
              onTest={(r) => window.open(r.from_path, '_blank')}
            />
          ))}
        </div>
      )}
      
      {/* Create/Edit Dialog */}
      <RedirectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        redirect={editingRedirect}
        onSave={handleSaveRedirect}
      />
    </div>
  )
}
