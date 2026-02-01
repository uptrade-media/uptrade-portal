// src/pages/forms/components/SubmissionsView.jsx
// Submissions table with lead scoring, tags, AI analysis, and status management

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Mail,
  Phone,
  User,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  AlertTriangle,
  Clock,
  Tag,
  Sparkles,
  ExternalLink,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import SignalIcon from '@/components/ui/SignalIcon'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, isValid } from 'date-fns'

// Quality tier config
const QUALITY_TIER = {
  high: { 
    label: 'High Intent', 
    icon: Star,
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
  },
  medium: { 
    label: 'Medium', 
    icon: null,
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
  },
  low: { 
    label: 'Low', 
    icon: null,
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' 
  },
  spam: { 
    label: 'Spam', 
    icon: AlertTriangle,
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' 
  },
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'blue' },
  { value: 'contacted', label: 'Contacted', color: 'amber' },
  { value: 'qualified', label: 'Qualified', color: 'emerald' },
  { value: 'converted', label: 'Converted', color: 'violet' },
  { value: 'closed', label: 'Closed', color: 'gray' },
]

function SubmissionDetailSheet({ submission, hasSignal }) {
  if (!submission) return null
  
  // Fields is the jsonb column, plus we have direct name/email columns
  const fields = submission.fields || {}
  const name = submission.name || fields.name || fields.full_name || fields.first_name || 'Anonymous Submission'
  const createdAt = submission.created_at ? new Date(submission.created_at) : null
  
  return (
    <SheetContent className="w-[500px] sm:max-w-[500px]">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {name}
        </SheetTitle>
        <SheetDescription>
          Submitted {createdAt && isValid(createdAt) 
            ? format(createdAt, 'PPpp')
            : 'Unknown date'
          }
        </SheetDescription>
      </SheetHeader>
      
      <div className="mt-6 space-y-6">
        {/* Lead Score & Quality */}
        {hasSignal && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-[var(--brand-primary)]/5 to-[var(--brand-secondary)]/5 border border-[var(--glass-border)]">
            <div className="flex items-center gap-2 mb-3">
              <SignalIcon className="h-4 w-4 text-[var(--brand-primary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Signal Analysis</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Lead Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${submission.lead_score || 0}%`,
                        backgroundColor: 'var(--brand-primary)'
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {submission.lead_score || 0}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">Quality</p>
                {submission.quality_tier && QUALITY_TIER[submission.quality_tier] && (
                  <Badge className={QUALITY_TIER[submission.quality_tier].className}>
                    {QUALITY_TIER[submission.quality_tier].label}
                  </Badge>
                )}
              </div>
            </div>
            
            {submission.ai_analysis && (
              <div className="mt-4 pt-4 border-t border-[var(--glass-border)]">
                <p className="text-xs text-[var(--text-tertiary)] mb-2">AI Insights</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {typeof submission.ai_analysis === 'string' 
                    ? submission.ai_analysis 
                    : submission.ai_analysis.summary || 'No analysis available'
                  }
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Contact Information</h4>
          <div className="space-y-2">
            {(submission.email || fields.email) && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--glass-bg-hover)]">
                <Mail className="h-4 w-4 text-[var(--text-tertiary)]" />
                <a href={`mailto:${submission.email || fields.email}`} className="text-sm text-[var(--text-primary)] hover:underline">
                  {submission.email || fields.email}
                </a>
              </div>
            )}
            {(submission.phone || fields.phone) && (
              <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--glass-bg-hover)]">
                <Phone className="h-4 w-4 text-[var(--text-tertiary)]" />
                <a href={`tel:${submission.phone || fields.phone}`} className="text-sm text-[var(--text-primary)] hover:underline">
                  {submission.phone || fields.phone}
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Form Data */}
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Form Responses</h4>
          <div className="space-y-3">
            {Object.entries(fields).map(([key, value]) => {
              // Skip common contact fields already shown
              if (['email', 'phone', 'name', 'full_name', 'first_name', 'last_name'].includes(key)) {
                return null
              }
              
              return (
                <div key={key} className="p-3 rounded-lg bg-[var(--glass-bg-hover)]">
                  <p className="text-xs text-[var(--text-tertiary)] capitalize mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Tags */}
        {submission.tags && submission.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {submission.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="pt-4 border-t border-[var(--glass-border)] flex gap-2">
          <Button variant="outline" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
          <Button style={{ backgroundColor: 'var(--brand-primary)' }} className="flex-1 text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Qualified
          </Button>
        </div>
      </div>
    </SheetContent>
  )
}

function SubmissionRow({ submission, hasSignal, onView, onUpdateStatus, isSelected, onSelect }) {
  const [detailOpen, setDetailOpen] = useState(false)
  // Fields is the jsonb column, plus direct name/email columns
  const fields = submission.fields || {}
  const createdAt = submission.created_at ? new Date(submission.created_at) : null
  
  const name = submission.name || fields.name || fields.full_name || fields.first_name || 'Anonymous'
  const email = submission.email || fields.email || ''
  const qualityTier = submission.quality_tier || 'medium'
  const status = submission.status || 'new'
  
  return (
    <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
      <TableRow className="group">
        <TableCell className="w-12">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(submission.id, checked)}
          />
        </TableCell>
        <TableCell>
          <SheetTrigger asChild>
            <button className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
              <div 
                className="h-9 w-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--text-primary)]">{name}</span>
                  {status === 'new' && (
                    <span className="flex h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
                  )}
                </div>
                <span className="text-sm text-[var(--text-tertiary)]">{email || 'No email'}</span>
              </div>
            </button>
          </SheetTrigger>
        </TableCell>
        <TableCell className="text-[var(--text-secondary)] text-sm">
          {submission.form?.name || 'Unknown Form'}
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 gap-1">
                <span className={cn(
                  "h-2 w-2 rounded-full",
                  status === 'new' && "bg-blue-500",
                  status === 'contacted' && "bg-amber-500",
                  status === 'qualified' && "bg-emerald-500",
                  status === 'converted' && "bg-violet-500",
                  status === 'closed' && "bg-gray-500",
                )} />
                <span className="text-xs capitalize">{status}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem 
                  key={opt.value}
                  onClick={() => onUpdateStatus?.(submission.id, opt.value)}
                >
                  <span className={cn(
                    "h-2 w-2 rounded-full mr-2",
                    opt.color === 'blue' && "bg-blue-500",
                    opt.color === 'amber' && "bg-amber-500",
                    opt.color === 'emerald' && "bg-emerald-500",
                    opt.color === 'violet' && "bg-violet-500",
                    opt.color === 'gray' && "bg-gray-500",
                  )} />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
        <TableCell>
          {qualityTier && QUALITY_TIER[qualityTier] && (() => {
            const QualityIcon = QUALITY_TIER[qualityTier].icon
            return (
              <Badge className={cn("text-xs", QUALITY_TIER[qualityTier].className)}>
                {QualityIcon && <QualityIcon className="h-3 w-3 mr-1" />}
                {QUALITY_TIER[qualityTier].label}
              </Badge>
            )
          })()}
        </TableCell>
        <TableCell>
          {hasSignal && submission.lead_score !== undefined && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${submission.lead_score}%`,
                    backgroundColor: 'var(--brand-primary)'
                  }}
                />
              </div>
              <span className="text-xs text-[var(--text-secondary)]">{submission.lead_score}</span>
            </div>
          )}
        </TableCell>
        <TableCell className="text-[var(--text-tertiary)] text-sm">
          {createdAt && isValid(createdAt) 
            ? formatDistanceToNow(createdAt, { addSuffix: true })
            : '-'
          }
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Add to CRM
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>
      <SubmissionDetailSheet submission={submission} hasSignal={hasSignal} />
    </Sheet>
  )
}

export default function SubmissionsView({
  submissions = [],
  isLoading,
  viewMode = 'list',
  filter = 'all',
  hasSignal = false,
  onView,
  onUpdateStatus,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set())
  
  const handleSelect = (id, checked) => {
    const newSet = new Set(selectedIds)
    if (checked) {
      newSet.add(id)
    } else {
      newSet.delete(id)
    }
    setSelectedIds(newSet)
  }
  
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(submissions.map(s => s.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-[var(--glass-bg)] rounded-lg">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          No submissions yet
        </h3>
        <p className="text-[var(--text-secondary)]">
          Submissions from your forms will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-2 bg-[var(--brand-primary)]/10 border-b border-[var(--glass-border)] flex items-center gap-4">
          <span className="text-sm text-[var(--text-primary)]">
            {selectedIds.size} selected
          </span>
          <Button variant="ghost" size="sm">Mark Contacted</Button>
          <Button variant="ghost" size="sm">Mark Qualified</Button>
          <Button variant="ghost" size="sm" className="text-red-600">Delete</Button>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedIds.size === submissions.length && submissions.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Contact</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Form</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Status</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Quality</TableHead>
            {hasSignal && <TableHead className="text-[var(--text-tertiary)]">Score</TableHead>}
            <TableHead className="text-[var(--text-tertiary)]">Submitted</TableHead>
            <TableHead className="text-[var(--text-tertiary)] w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <SubmissionRow
              key={submission.id}
              submission={submission}
              hasSignal={hasSignal}
              onView={onView}
              onUpdateStatus={onUpdateStatus}
              isSelected={selectedIds.has(submission.id)}
              onSelect={handleSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
