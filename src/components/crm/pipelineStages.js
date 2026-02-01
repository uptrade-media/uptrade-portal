/**
 * Shared pipeline stages - single source of truth for CRM sidebar and kanban.
 * Sidebar stage filters and kanban columns use the same config (including colors from "Configure pipeline").
 */
import {
  Star,
  MessageSquare,
  UserCheck,
  FileText,
  Handshake,
  CheckCircle2,
  XCircle,
  Sparkles,
  Phone,
  Send,
  CheckCheck,
} from 'lucide-react'

export const ICON_MAP = {
  sparkles: Sparkles,
  phone: Phone,
  send: Send,
  message: MessageSquare,
  check: CheckCircle2,
  checkcheck: CheckCheck,
  x: XCircle,
}

/** Hex to rgba with alpha (e.g. 0.1 for bgLight) */
function hexToRgba(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Default pipeline stages - used when API returns none or before load */
export const DEFAULT_PIPELINE_STAGES = {
  new_lead: {
    key: 'new_lead',
    label: 'New Lead',
    color: '#3B82F6',
    bgLight: 'rgba(59, 130, 246, 0.1)',
    textColor: '#2563EB',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    icon: Star,
    order: 1,
  },
  contacted: {
    key: 'contacted',
    label: 'Contacted',
    color: '#F59E0B',
    bgLight: 'rgba(245, 158, 11, 0.1)',
    textColor: '#D97706',
    borderColor: 'rgba(245, 158, 11, 0.2)',
    icon: MessageSquare,
    order: 2,
  },
  qualified: {
    key: 'qualified',
    label: 'Qualified',
    color: '#8B5CF6',
    bgLight: 'rgba(139, 92, 246, 0.1)',
    textColor: '#7C3AED',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    icon: UserCheck,
    order: 3,
  },
  proposal_sent: {
    key: 'proposal_sent',
    label: 'Proposal Sent',
    color: '#F97316',
    bgLight: 'rgba(249, 115, 22, 0.1)',
    textColor: '#EA580C',
    borderColor: 'rgba(249, 115, 22, 0.2)',
    icon: FileText,
    order: 4,
  },
  negotiating: {
    key: 'negotiating',
    label: 'Negotiating',
    color: '#06B6D4',
    bgLight: 'rgba(6, 182, 212, 0.1)',
    textColor: '#0891B2',
    borderColor: 'rgba(6, 182, 212, 0.2)',
    icon: Handshake,
    order: 5,
  },
  closed_won: {
    key: 'closed_won',
    label: 'Closed Won',
    color: '#10B981',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    textColor: '#059669',
    borderColor: 'rgba(16, 185, 129, 0.2)',
    icon: CheckCircle2,
    order: 6,
  },
  closed_lost: {
    key: 'closed_lost',
    label: 'Closed Lost',
    color: '#EF4444',
    bgLight: 'rgba(239, 68, 68, 0.1)',
    textColor: '#DC2626',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    icon: XCircle,
    order: 7,
  },
}

export const ACTIVE_STAGES = ['new_lead', 'contacted', 'qualified', 'proposal_sent', 'negotiating']

/** Backward-compat alias for consumers that import PIPELINE_STAGES */
export const PIPELINE_STAGES = DEFAULT_PIPELINE_STAGES

/**
 * Map API pipeline stages (from getPipelineStages) to the config shape used by sidebar and kanban.
 * @param {Array} apiStages - [{ stage_key, stage_label, color, icon, sort_order, is_won, is_lost }]
 * @returns {Object} { [stage_key]: { key, label, color, bgLight, textColor, borderColor, icon, order } }
 */
export function mapApiStagesToConfig(apiStages) {
  if (!Array.isArray(apiStages) || apiStages.length === 0) return null
  const config = {}
  apiStages
    .sort((a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0))
    .forEach((s, index) => {
      const key = (s.stage_key ?? s.stageKey ?? `stage_${index}`).toLowerCase().replace(/\s+/g, '_')
      const color = s.color || '#6B7280'
      const iconName = (s.icon || 'sparkles').toLowerCase()
      config[key] = {
        key,
        label: s.stage_label ?? s.stageLabel ?? key,
        color,
        bgLight: hexToRgba(color, 0.1),
        textColor: color,
        borderColor: hexToRgba(color, 0.2),
        icon: ICON_MAP[iconName] || Sparkles,
        order: s.sort_order ?? s.sortOrder ?? index,
      }
    })
  return Object.keys(config).length > 0 ? config : null
}
