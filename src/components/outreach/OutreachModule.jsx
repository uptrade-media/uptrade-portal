// src/components/outreach/OutreachModule.jsx
// Outreach Module - email campaigns, newsletters, and automation
// Uses ModuleLayout with left sidebar for tab navigation; EmailPlatform renders content only.

import { useState } from 'react'
import {
  BarChart3,
  Send,
  Zap,
  Bell,
  FileText,
  Users,
  Tag,
  UserPlus,
  Target,
  Settings,
} from 'lucide-react'
import { ModuleLayout } from '@/components/ModuleLayout'
import { MODULE_ICONS } from '@/lib/module-icons'
import { cn } from '@/lib/utils'
import EmailPlatform from '@/components/email/EmailPlatform'

const OUTREACH_TABS = [
  { value: 'overview', label: 'Overview', icon: BarChart3 },
  { value: 'campaigns', label: 'Campaigns', icon: Send },
  { value: 'automations', label: 'Automations', icon: Zap },
  { value: 'transactional', label: 'Transactional', icon: Bell },
  { value: 'templates', label: 'Templates', icon: FileText },
  { value: 'subscribers', label: 'Subscribers', icon: Users },
  { value: 'lists', label: 'Lists', icon: Tag },
  { value: 'people', label: 'People', icon: UserPlus },
  { value: 'testing', label: 'A/B Tests', icon: Target },
  { value: 'settings', label: 'Settings', icon: Settings },
]

export default function OutreachModule() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)

  const leftSidebarContent = (
    <div className="p-4 space-y-1">
      <p className="uppercase tracking-wider text-muted-foreground mb-2 px-2">
        Outreach
      </p>
      {OUTREACH_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => setActiveTab(tab.value)}
          className={cn(
            'w-full text-left px-3 py-2 rounded-md flex items-center gap-2.5 transition-colors',
            activeTab === tab.value
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted text-foreground'
          )}
        >
          <tab.icon className="h-4 w-4 flex-shrink-0" />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )

  return (
    <ModuleLayout
      ariaLabel="Outreach"
      leftSidebar={leftSidebarContent}
      leftSidebarOpen={showLeftSidebar}
      onLeftSidebarOpenChange={setShowLeftSidebar}
      leftSidebarTitle="Outreach"
      leftSidebarWidth={220}
      defaultLeftSidebarOpen
    >
      <ModuleLayout.Header
        title="Outreach"
        icon={MODULE_ICONS.outreach}
      />
      <ModuleLayout.Content noPadding>
        <EmailPlatform
          embedded
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </ModuleLayout.Content>
    </ModuleLayout>
  )
}
