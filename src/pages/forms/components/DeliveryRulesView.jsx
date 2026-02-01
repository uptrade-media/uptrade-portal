// src/pages/forms/components/DeliveryRulesView.jsx
// Delivery rules management - routing, notifications, escalations, and delivery log

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  GitBranch,
  Bell,
  AlertTriangle,
  Clock,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  Webhook,
  MessageSquare,
  ArrowRight,
  Zap,
  Users,
  Play,
  Pause,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, isValid } from 'date-fns'

const ACTION_TYPES = {
  email: { label: 'Send Email', icon: Mail, color: 'blue' },
  webhook: { label: 'Webhook', icon: Webhook, color: 'violet' },
  slack: { label: 'Slack', icon: MessageSquare, color: 'green' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'amber' },
  crm: { label: 'Add to CRM', icon: Users, color: 'emerald' },
}

const CONDITION_FIELDS = [
  { value: 'quality_tier', label: 'Quality Tier' },
  { value: 'lead_score', label: 'Lead Score' },
  { value: 'form_id', label: 'Form' },
  { value: 'field_value', label: 'Field Value' },
]

const CONDITION_OPERATORS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'does not equal' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'contains', label: 'contains' },
]

// =============================================================================
// ROUTING RULES TAB
// =============================================================================

function RoutingRulesTab({ projectId, rules, onRefresh }) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingRule, setEditingRule] = useState(null)
  
  async function toggleRule(ruleId, isActive) {
    try {
      await supabase
        .from('form_routing_rules')
        .update({ is_active: isActive })
        .eq('id', ruleId)
      
      onRefresh()
    } catch (err) {
      console.error('Failed to toggle rule:', err)
    }
  }
  
  async function deleteRule(ruleId) {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      await supabase
        .from('form_routing_rules')
        .delete()
        .eq('id', ruleId)
      
      onRefresh()
    } catch (err) {
      console.error('Failed to delete rule:', err)
    }
  }
  
  if (rules.length === 0) {
    return (
      <div className="text-center py-12">
        <GitBranch className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          No routing rules yet
        </h3>
        <p className="text-[var(--text-secondary)] mb-4">
          Create rules to automatically route submissions based on conditions
        </p>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: 'var(--brand-primary)' }} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <RuleDialog 
            projectId={projectId}
            onClose={() => setIsCreating(false)}
            onSave={() => {
              setIsCreating(false)
              onRefresh()
            }}
          />
        </Dialog>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Rules are evaluated in priority order. First matching rule wins.
        </p>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: 'var(--brand-primary)' }} className="text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <RuleDialog 
            projectId={projectId}
            onClose={() => setIsCreating(false)}
            onSave={() => {
              setIsCreating(false)
              onRefresh()
            }}
          />
        </Dialog>
      </div>
      
      <div className="space-y-3">
        {rules.map((rule, index) => {
          const ActionIcon = ACTION_TYPES[rule.action_type]?.icon || Zap
          const actionColor = ACTION_TYPES[rule.action_type]?.color || 'gray'
          
          return (
            <Card 
              key={rule.id} 
              className={cn(
                "bg-[var(--glass-bg)] border-[var(--glass-border)]",
                !rule.is_active && "opacity-60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Priority Badge */}
                    <div 
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)',
                        color: 'var(--brand-primary)'
                      }}
                    >
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--text-primary)]">{rule.name}</h4>
                      
                      {/* Conditions */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs text-[var(--text-tertiary)]">When</span>
                        {rule.conditions?.conditions?.map((cond, i) => (
                          <Badge 
                            key={i} 
                            variant="outline" 
                            className="text-xs bg-[var(--glass-bg-hover)]"
                          >
                            {cond.field} {cond.operator} {cond.value}
                          </Badge>
                        ))}
                        
                        <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />
                        
                        {/* Action */}
                        <Badge className={cn(
                          "text-xs",
                          `bg-${actionColor}-500/10 text-${actionColor}-600 dark:text-${actionColor}-400`
                        )}>
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {ACTION_TYPES[rule.action_type]?.label || rule.action_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.is_active}
                      onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRule(rule)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit Rule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => deleteRule(rule.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <RuleDialog 
            projectId={projectId}
            rule={editingRule}
            onClose={() => setEditingRule(null)}
            onSave={() => {
              setEditingRule(null)
              onRefresh()
            }}
          />
        </Dialog>
      )}
    </div>
  )
}

// =============================================================================
// RULE DIALOG
// =============================================================================

function RuleDialog({ projectId, rule, onClose, onSave }) {
  const [name, setName] = useState(rule?.name || '')
  const [actionType, setActionType] = useState(rule?.action_type || 'email')
  const [priority, setPriority] = useState(rule?.priority || 0)
  const [conditions, setConditions] = useState(
    rule?.conditions?.conditions || [{ field: 'quality_tier', operator: 'equals', value: 'high' }]
  )
  const [actionConfig, setActionConfig] = useState(rule?.action_config || {})
  const [isSaving, setIsSaving] = useState(false)
  
  async function handleSave() {
    if (!name.trim()) return
    
    setIsSaving(true)
    try {
      const data = {
        project_id: projectId,
        name,
        conditions: { conditions, logic: 'and' },
        action_type: actionType,
        action_config: actionConfig,
        priority,
        is_active: true,
      }
      
      if (rule?.id) {
        await supabase
          .from('form_routing_rules')
          .update(data)
          .eq('id', rule.id)
      } else {
        await supabase
          .from('form_routing_rules')
          .insert(data)
      }
      
      onSave()
    } catch (err) {
      console.error('Failed to save rule:', err)
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{rule ? 'Edit Rule' : 'Create Routing Rule'}</DialogTitle>
        <DialogDescription>
          Define when and how submissions should be routed
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Rule Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., High-value leads to sales team"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Conditions</Label>
          {conditions.map((cond, index) => (
            <div key={index} className="flex items-center gap-2">
              <Select 
                value={cond.field} 
                onValueChange={(val) => {
                  const newConds = [...conditions]
                  newConds[index].field = val
                  setConditions(newConds)
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_FIELDS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={cond.operator} 
                onValueChange={(val) => {
                  const newConds = [...conditions]
                  newConds[index].operator = val
                  setConditions(newConds)
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPERATORS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                value={cond.value}
                onChange={(e) => {
                  const newConds = [...conditions]
                  newConds[index].value = e.target.value
                  setConditions(newConds)
                }}
                className="flex-1"
                placeholder="Value"
              />
              
              {conditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConditions(conditions.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConditions([...conditions, { field: 'quality_tier', operator: 'equals', value: '' }])}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label>Action</Label>
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Action-specific config */}
        {actionType === 'email' && (
          <div className="space-y-2">
            <Label>Email Recipients</Label>
            <Input
              value={actionConfig.recipients || ''}
              onChange={(e) => setActionConfig({ ...actionConfig, recipients: e.target.value })}
              placeholder="email@example.com, another@example.com"
            />
          </div>
        )}
        
        {actionType === 'webhook' && (
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input
              value={actionConfig.url || ''}
              onChange={(e) => setActionConfig({ ...actionConfig, url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Priority (higher = evaluated first)</Label>
          <Input
            type="number"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          style={{ backgroundColor: 'var(--brand-primary)' }}
          className="text-white"
        >
          {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

// =============================================================================
// DELIVERY LOG TAB
// =============================================================================

function DeliveryLogTab({ projectId }) {
  const [logs, setLogs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    if (projectId) {
      loadLogs()
    }
  }, [projectId])
  
  async function loadLogs() {
    setIsLoading(true)
    try {
      const { data } = await supabase
        .from('form_delivery_log')
        .select(`
          *,
          submission:form_submissions(id, form_data),
          rule:form_routing_rules(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100)
      
      setLogs(data || [])
    } catch (err) {
      console.error('Failed to load delivery logs:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }
  
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto text-[var(--text-tertiary)] mb-4" />
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          No delivery logs yet
        </h3>
        <p className="text-[var(--text-secondary)]">
          Delivery events will appear here when rules are triggered
        </p>
      </div>
    )
  }
  
  return (
    <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[var(--text-tertiary)]">Time</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Rule</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Action</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Status</TableHead>
            <TableHead className="text-[var(--text-tertiary)]">Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => {
            const createdAt = log.created_at ? new Date(log.created_at) : null
            const ActionIcon = ACTION_TYPES[log.action_type]?.icon || Zap
            
            return (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-[var(--text-secondary)]">
                  {createdAt && isValid(createdAt)
                    ? formatDistanceToNow(createdAt, { addSuffix: true })
                    : '-'
                  }
                </TableCell>
                <TableCell className="text-sm text-[var(--text-primary)]">
                  {log.rule?.name || 'Unknown Rule'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    <ActionIcon className="h-3 w-3 mr-1" />
                    {ACTION_TYPES[log.action_type]?.label || log.action_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.status === 'success' ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : log.status === 'failed' ? (
                    <Badge className="bg-red-500/10 text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-[var(--text-tertiary)] max-w-[200px] truncate">
                  {log.error_message || log.response_data?.message || '-'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function DeliveryRulesView({ projectId, rules = [], tab = 'rules', onRefresh }) {
  const [currentTab, setCurrentTab] = useState(tab)
  
  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
      <TabsList className="bg-[var(--glass-bg)] border border-[var(--glass-border)]">
        <TabsTrigger value="rules" className="data-[state=active]:bg-[var(--brand-primary)]/10">
          <GitBranch className="h-4 w-4 mr-2" />
          Routing Rules
        </TabsTrigger>
        <TabsTrigger value="notifications" className="data-[state=active]:bg-[var(--brand-primary)]/10">
          <Bell className="h-4 w-4 mr-2" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="escalations" className="data-[state=active]:bg-[var(--brand-primary)]/10">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Escalations
        </TabsTrigger>
        <TabsTrigger value="log" className="data-[state=active]:bg-[var(--brand-primary)]/10">
          <Clock className="h-4 w-4 mr-2" />
          Delivery Log
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="rules" className="mt-6">
        <RoutingRulesTab projectId={projectId} rules={rules} onRefresh={onRefresh} />
      </TabsContent>
      
      <TabsContent value="notifications" className="mt-6">
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-base">Notification Settings</CardTitle>
            <CardDescription>Configure default notifications for new submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--glass-bg-hover)]">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Email Notifications</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Send email for every new submission</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--glass-bg-hover)]">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-[var(--text-tertiary)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Portal Notifications</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Show notification in portal dashboard</p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="escalations" className="mt-6">
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-base">Escalation Rules</CardTitle>
            <CardDescription>Automatically escalate submissions that haven't been responded to</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-[var(--glass-bg-hover)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">First Escalation</p>
                <Switch defaultChecked />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">
                If no response after 1 hour, notify additional recipients
              </p>
              <Input placeholder="escalation-email@example.com" />
            </div>
            
            <div className="p-4 rounded-lg bg-[var(--glass-bg-hover)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[var(--text-primary)]">Final Escalation</p>
                <Switch />
              </div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">
                If no response after 24 hours, notify management
              </p>
              <Input placeholder="manager@example.com" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="log" className="mt-6">
        <DeliveryLogTab projectId={projectId} />
      </TabsContent>
    </Tabs>
  )
}
