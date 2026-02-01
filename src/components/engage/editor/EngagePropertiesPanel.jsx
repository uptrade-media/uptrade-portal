// src/components/engage/editor/EngagePropertiesPanel.jsx
// Right panel - Design, Triggers, Targeting properties

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Palette,
  Settings,
  Clock,
  Target,
  Type,
  Square,
  Droplets,
  Circle,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  MousePointerClick,
  ArrowUpFromLine,
  Timer,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import GradientPicker from './controls/GradientPicker'
import ColorPicker from './controls/ColorPicker'

// Position options by element type
const POSITIONS = {
  popup: [
    { value: 'center', label: 'Center' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'bottom-center', label: 'Bottom Center' },
  ],
  banner: [
    { value: 'top-bar', label: 'Top Bar' },
    { value: 'bottom-bar', label: 'Bottom Bar' },
  ],
  nudge: [
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-left', label: 'Top Left' },
  ],
  toast: [
    { value: 'top-right', label: 'Top Right' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'bottom-center', label: 'Bottom Center' },
  ],
  'slide-in': [
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'center-right', label: 'Center Right' },
    { value: 'center-left', label: 'Center Left' },
  ],
}

// Trigger types
const TRIGGERS = [
  { value: 'time', label: 'Time Delay', icon: Timer },
  { value: 'scroll', label: 'Scroll Depth', icon: MousePointerClick },
  { value: 'exit', label: 'Exit Intent', icon: ArrowUpFromLine },
  { value: 'load', label: 'Page Load', icon: Globe },
  { value: 'inactivity', label: 'Inactivity', icon: Clock },
]

// Animation options
const ANIMATIONS = [
  { value: 'fade', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'scale', label: 'Scale' },
  { value: 'bounce', label: 'Bounce' },
]

// Shadow options
const SHADOWS = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
  { value: '2xl', label: '2X Large' },
]

// CTA actions
const CTA_ACTIONS = [
  { value: 'link', label: 'Open Link' },
  { value: 'chat', label: 'Open Chat' },
  { value: 'scheduler', label: 'Open Scheduler' },
  { value: 'close', label: 'Close Element' },
  { value: 'custom', label: 'Custom Action' },
]

// Frequency options
const FREQUENCIES = [
  { value: 'once', label: 'Once Ever' },
  { value: 'session', label: 'Once Per Session' },
  { value: 'day', label: 'Once Per Day' },
  { value: 'week', label: 'Once Per Week' },
  { value: 'always', label: 'Always Show' },
]

export default function EngagePropertiesPanel({
  element,
  onUpdateElement,
  onUpdateAppearance,
  onUpdateTriggerConfig,
  activeTab,
  onTabChange,
  brandColors
}) {
  // Section expansion state
  const [sectionsOpen, setSectionsOpen] = useState({
    content: true,
    position: true,
    colors: true,
    styling: false,
    trigger: true,
    frequency: false,
    pages: false,
    devices: false,
  })
  
  const toggleSection = (section) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  const positions = POSITIONS[element.element_type] || POSITIONS.popup

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="p-2 border-b border-[var(--glass-border)]">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="design" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Design
            </TabsTrigger>
            <TabsTrigger value="triggers" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Triggers
            </TabsTrigger>
            <TabsTrigger value="targeting" className="text-xs">
              <Target className="h-3 w-3 mr-1" />
              Target
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* ═══════════════════════════════════════════════════════════════════
              DESIGN TAB
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'design' && (
            <>
              {/* Content Section */}
              <Collapsible open={sectionsOpen.content} onOpenChange={() => toggleSection('content')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Content
                  </span>
                  {sectionsOpen.content ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Headline</Label>
                    <Input
                      value={element.headline || ''}
                      onChange={(e) => onUpdateElement({ headline: e.target.value })}
                      placeholder="Your headline here"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Body Text</Label>
                    <Textarea
                      value={element.body || ''}
                      onChange={(e) => onUpdateElement({ body: e.target.value })}
                      placeholder="Your message here"
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Button Text</Label>
                    <Input
                      value={element.cta_text || ''}
                      onChange={(e) => onUpdateElement({ cta_text: e.target.value })}
                      placeholder="Get Started"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Button Action</Label>
                    <Select
                      value={element.cta_action || 'link'}
                      onValueChange={(v) => onUpdateElement({ cta_action: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CTA_ACTIONS.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {element.cta_action === 'link' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Button URL</Label>
                      <Input
                        value={element.cta_url || ''}
                        onChange={(e) => onUpdateElement({ cta_url: e.target.value })}
                        placeholder="https://..."
                        className="mt-1"
                      />
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Position Section */}
              <Collapsible open={sectionsOpen.position} onOpenChange={() => toggleSection('position')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Position
                  </span>
                  {sectionsOpen.position ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Position</Label>
                    <Select
                      value={element.position || 'center'}
                      onValueChange={(v) => onUpdateElement({ position: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map(pos => (
                          <SelectItem key={pos.value} value={pos.value}>
                            {pos.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Animation</Label>
                    <Select
                      value={element.animation || 'fade'}
                      onValueChange={(v) => onUpdateElement({ animation: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANIMATIONS.map(anim => (
                          <SelectItem key={anim.value} value={anim.value}>
                            {anim.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Colors Section */}
              <Collapsible open={sectionsOpen.colors} onOpenChange={() => toggleSection('colors')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Colors
                  </span>
                  {sectionsOpen.colors ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <ColorPicker
                    label="Background"
                    value={element.appearance?.backgroundColor || '#ffffff'}
                    onChange={(v) => onUpdateAppearance('backgroundColor', v)}
                    brandColors={brandColors}
                  />
                  <ColorPicker
                    label="Text Color"
                    value={element.appearance?.textColor || '#1a1a1a'}
                    onChange={(v) => onUpdateAppearance('textColor', v)}
                    brandColors={brandColors}
                  />
                  <ColorPicker
                    label="Button Color"
                    value={element.appearance?.primaryColor || brandColors.primary}
                    onChange={(v) => onUpdateAppearance('primaryColor', v)}
                    brandColors={brandColors}
                  />
                  
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-muted-foreground">Gradient Background</Label>
                      <Switch
                        checked={!!element.appearance?.gradient}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onUpdateAppearance('gradient', {
                              type: 'linear',
                              angle: 135,
                              colors: [brandColors.primary, brandColors.secondary || brandColors.primaryDark]
                            })
                          } else {
                            onUpdateAppearance('gradient', null)
                          }
                        }}
                      />
                    </div>
                    {element.appearance?.gradient && (
                      <GradientPicker
                        value={element.appearance.gradient}
                        onChange={(v) => onUpdateAppearance('gradient', v)}
                        brandColors={brandColors}
                      />
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Styling Section */}
              <Collapsible open={sectionsOpen.styling} onOpenChange={() => toggleSection('styling')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Styling
                  </span>
                  {sectionsOpen.styling ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Border Radius</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <Slider
                        value={[element.appearance?.borderRadius || 16]}
                        onValueChange={([v]) => onUpdateAppearance('borderRadius', v)}
                        min={0}
                        max={32}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {element.appearance?.borderRadius || 16}px
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Shadow</Label>
                    <Select
                      value={element.appearance?.shadow || 'xl'}
                      onValueChange={(v) => onUpdateAppearance('shadow', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHADOWS.map(shadow => (
                          <SelectItem key={shadow.value} value={shadow.value}>
                            {shadow.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {element.element_type === 'popup' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Backdrop Opacity</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Slider
                          value={[(element.appearance?.backdropOpacity || 0.5) * 100]}
                          onValueChange={([v]) => onUpdateAppearance('backdropOpacity', v / 100)}
                          min={0}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {Math.round((element.appearance?.backdropOpacity || 0.5) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TRIGGERS TAB
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'triggers' && (
            <>
              {/* Trigger Type Section */}
              <Collapsible open={sectionsOpen.trigger} onOpenChange={() => toggleSection('trigger')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Trigger
                  </span>
                  {sectionsOpen.trigger ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Trigger Type</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {TRIGGERS.map(trigger => {
                        const Icon = trigger.icon
                        return (
                          <button
                            key={trigger.value}
                            onClick={() => onUpdateElement({ trigger_type: trigger.value })}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors",
                              element.trigger_type === trigger.value
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10"
                                : "border-[var(--glass-border)] hover:bg-[var(--glass-bg)]"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {trigger.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Trigger-specific config */}
                  {element.trigger_type === 'time' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Delay (seconds)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Slider
                          value={[element.trigger_config?.delay_seconds || 5]}
                          onValueChange={([v]) => onUpdateTriggerConfig('delay_seconds', v)}
                          min={1}
                          max={60}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {element.trigger_config?.delay_seconds || 5}s
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {element.trigger_type === 'scroll' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Scroll Depth (%)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Slider
                          value={[element.trigger_config?.scroll_percent || 50]}
                          onValueChange={([v]) => onUpdateTriggerConfig('scroll_percent', v)}
                          min={10}
                          max={100}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {element.trigger_config?.scroll_percent || 50}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {element.trigger_type === 'inactivity' && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Inactivity Time (seconds)</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <Slider
                          value={[element.trigger_config?.inactivity_seconds || 30]}
                          onValueChange={([v]) => onUpdateTriggerConfig('inactivity_seconds', v)}
                          min={5}
                          max={120}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {element.trigger_config?.inactivity_seconds || 30}s
                        </span>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Frequency Section */}
              <Collapsible open={sectionsOpen.frequency} onOpenChange={() => toggleSection('frequency')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Frequency
                  </span>
                  {sectionsOpen.frequency ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Show Frequency</Label>
                    <Select
                      value={element.frequency || 'session'}
                      onValueChange={(v) => onUpdateElement({ frequency: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FREQUENCIES.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              TARGETING TAB
              ═══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'targeting' && (
            <>
              {/* Pages Section */}
              <Collapsible open={sectionsOpen.pages} onOpenChange={() => toggleSection('pages')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Pages
                  </span>
                  {sectionsOpen.pages ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="space-y-2">
                    {(element.page_patterns || ['*']).map((pattern, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={pattern}
                          onChange={(e) => {
                            const patterns = [...(element.page_patterns || ['*'])]
                            patterns[index] = e.target.value
                            onUpdateElement({ page_patterns: patterns })
                          }}
                          placeholder="/path/* or *"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 flex-shrink-0"
                          onClick={() => {
                            const patterns = [...(element.page_patterns || ['*'])]
                            patterns.splice(index, 1)
                            onUpdateElement({ page_patterns: patterns.length ? patterns : ['*'] })
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const patterns = [...(element.page_patterns || ['*']), '']
                        onUpdateElement({ page_patterns: patterns })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Page Pattern
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use * for all pages, /path/* for path matching
                  </p>
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Devices Section */}
              <Collapsible open={sectionsOpen.devices} onOpenChange={() => toggleSection('devices')}>
                <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Devices
                  </span>
                  {sectionsOpen.devices ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="space-y-2">
                    {[
                      { value: 'desktop', label: 'Desktop', icon: Monitor },
                      { value: 'tablet', label: 'Tablet', icon: Tablet },
                      { value: 'mobile', label: 'Mobile', icon: Smartphone },
                    ].map(device => {
                      const isEnabled = (element.device_targets || ['desktop', 'mobile', 'tablet']).includes(device.value)
                      const Icon = device.icon
                      
                      return (
                        <button
                          key={device.value}
                          onClick={() => {
                            const targets = [...(element.device_targets || ['desktop', 'mobile', 'tablet'])]
                            if (isEnabled) {
                              const newTargets = targets.filter(t => t !== device.value)
                              onUpdateElement({ device_targets: newTargets.length ? newTargets : targets })
                            } else {
                              onUpdateElement({ device_targets: [...targets, device.value] })
                            }
                          }}
                          className={cn(
                            "flex items-center justify-between w-full p-3 rounded-lg border transition-colors",
                            isEnabled
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10"
                              : "border-[var(--glass-border)] hover:bg-[var(--glass-bg)]"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {device.label}
                          </span>
                          <div className={cn(
                            "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                            isEnabled ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]" : "border-gray-300"
                          )}>
                            {isEnabled && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 0 0-1.06 1.06l3 3a.75.75 0 0 0 1.06 0l7-7a.75.75 0 1 0-1.06-1.06z"/>
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
