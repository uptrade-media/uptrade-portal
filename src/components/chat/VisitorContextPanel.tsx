/**
 * VisitorContextPanel – visitor metadata for Live chat thread
 * Shows source_url, referrer, visitor_name, visitor_email, device/user_agent summary.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Globe, User, Mail, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VisitorContextData {
  source_url?: string
  referrer?: string
  visitor_name?: string
  visitor_email?: string
  user_agent?: string
  visitorContext?: Record<string, unknown>
}

function summarizeUserAgent(ua: string | undefined): string {
  if (!ua) return '—'
  const s = ua.toLowerCase()
  if (s.includes('mobile') && !s.includes('ipad')) return 'Mobile'
  if (s.includes('ipad') || s.includes('tablet')) return 'Tablet'
  return 'Desktop'
}

interface VisitorContextPanelProps {
  data: VisitorContextData
  className?: string
}

export function VisitorContextPanel({ data, className }: VisitorContextPanelProps) {
  const [open, setOpen] = useState(true)
  const hasAny =
    data.source_url ||
    data.referrer ||
    data.visitor_name ||
    data.visitor_email ||
    data.user_agent

  if (!hasAny) return null

  const device = summarizeUserAgent(data.user_agent)

  return (
    <div
      className={cn(
        'border-b border-[var(--glass-border)]/30 bg-[var(--surface-secondary)]/50',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        Visitor context
      </button>
      {open && (
        <div className="space-y-2 px-3 pb-3 text-xs">
          {(data.visitor_name || data.visitor_email) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {data.visitor_name && (
                <span className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[var(--text-secondary)]">{data.visitor_name}</span>
                </span>
              )}
              {data.visitor_email && (
                <a
                  href={`mailto:${data.visitor_email}`}
                  className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-[var(--text-secondary)] truncate max-w-[180px]">
                    {data.visitor_email}
                  </span>
                </a>
              )}
            </div>
          )}
          {data.source_url && (
            <div className="flex items-start gap-1.5">
              <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
              <div className="min-w-0 flex-1">
                <span className="text-[var(--text-tertiary)]">Page: </span>
                <a
                  href={data.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:underline truncate block"
                  title={data.source_url}
                >
                  {data.source_url}
                </a>
              </div>
            </div>
          )}
          {data.referrer && (
            <div className="flex items-start gap-1.5">
              <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--text-tertiary)]" />
              <div className="min-w-0 flex-1">
                <span className="text-[var(--text-tertiary)]">Referrer: </span>
                <a
                  href={data.referrer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:underline truncate block"
                  title={data.referrer}
                >
                  {data.referrer}
                </a>
              </div>
            </div>
          )}
          {data.user_agent && (
            <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[var(--text-secondary)]">{device}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
