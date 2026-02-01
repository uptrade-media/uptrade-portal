// src/components/engage/editor/EngageTemplates.jsx
// Brand-aware templates for quick element creation

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Sparkles, MessageSquare, Megaphone, Bell, PanelBottom } from 'lucide-react'
import { cn } from '@/lib/utils'
import SignalIcon from '@/components/ui/SignalIcon'

// Template categories
const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'promotional', label: 'Promotional' },
  { id: 'welcome', label: 'Welcome' },
  { id: 'newsletter', label: 'Newsletter' },
  { id: 'commerce', label: 'Commerce' },
  { id: 'feedback', label: 'Feedback' },
]

// Template definitions - using brand colors via CSS variables
const TEMPLATES = [
  {
    id: 'welcome-popup',
    name: 'Welcome Popup',
    category: 'welcome',
    element_type: 'popup',
    icon: MessageSquare,
    preview: {
      headline: 'Welcome to Our Site!',
      body: 'Get 10% off your first order when you sign up for our newsletter.',
      cta_text: 'Get My Discount',
    },
    config: {
      element_type: 'popup',
      position: 'center',
      trigger_type: 'time',
      trigger_config: { delay_seconds: 5 },
      frequency: 'once',
      animation: 'scale',
      headline: 'Welcome to Our Site!',
      body: 'Get 10% off your first order when you sign up for our newsletter.',
      cta_text: 'Get My Discount',
      cta_action: 'link',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        // primaryColor will be set from brand
        borderRadius: 16,
        shadow: 'xl',
        gradient: null,
      }
    }
  },
  {
    id: 'exit-intent-popup',
    name: 'Exit Intent',
    category: 'promotional',
    element_type: 'popup',
    icon: MessageSquare,
    preview: {
      headline: 'Wait! Don\'t Leave Yet',
      body: 'Complete your purchase and save 15% with code EXIT15.',
      cta_text: 'Apply Discount',
    },
    config: {
      element_type: 'popup',
      position: 'center',
      trigger_type: 'exit',
      trigger_config: {},
      frequency: 'session',
      animation: 'slide-up',
      headline: 'Wait! Don\'t Leave Yet',
      body: 'Complete your purchase and save 15% with code EXIT15.',
      cta_text: 'Apply Discount',
      cta_action: 'close',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        borderRadius: 16,
        shadow: '2xl',
        gradient: null,
      }
    }
  },
  {
    id: 'newsletter-slide-in',
    name: 'Newsletter Slide-in',
    category: 'newsletter',
    element_type: 'slide-in',
    icon: PanelBottom,
    preview: {
      headline: 'Stay Updated',
      body: 'Subscribe to our newsletter for exclusive offers and updates.',
      cta_text: 'Subscribe',
    },
    config: {
      element_type: 'slide-in',
      position: 'bottom-right',
      trigger_type: 'scroll',
      trigger_config: { scroll_percent: 50 },
      frequency: 'session',
      animation: 'slide-up',
      headline: 'Stay Updated',
      body: 'Subscribe to our newsletter for exclusive offers and updates.',
      cta_text: 'Subscribe',
      cta_action: 'link',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        borderRadius: 12,
        shadow: 'lg',
        gradient: null,
      }
    }
  },
  {
    id: 'promo-banner',
    name: 'Promo Banner',
    category: 'promotional',
    element_type: 'banner',
    icon: Megaphone,
    preview: {
      headline: 'Free Shipping on Orders Over $50!',
      body: '',
      cta_text: 'Shop Now',
    },
    config: {
      element_type: 'banner',
      position: 'top-bar',
      trigger_type: 'load',
      trigger_config: {},
      frequency: 'always',
      animation: 'slide-down',
      headline: 'Free Shipping on Orders Over $50!',
      body: '',
      cta_text: 'Shop Now',
      cta_action: 'link',
      appearance: {
        textColor: '#ffffff',
        borderRadius: 0,
        shadow: 'none',
        // Uses brand gradient
        gradient: {
          type: 'linear',
          angle: 90,
          // colors will be set from brand
        },
      }
    }
  },
  {
    id: 'sale-banner',
    name: 'Sale Banner',
    category: 'commerce',
    element_type: 'banner',
    icon: Megaphone,
    preview: {
      headline: '🔥 Flash Sale: Up to 50% Off - Limited Time!',
      body: '',
      cta_text: 'Shop Sale',
    },
    config: {
      element_type: 'banner',
      position: 'top-bar',
      trigger_type: 'load',
      trigger_config: {},
      frequency: 'always',
      animation: 'slide-down',
      headline: '🔥 Flash Sale: Up to 50% Off - Limited Time!',
      body: '',
      cta_text: 'Shop Sale',
      cta_action: 'link',
      appearance: {
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        borderRadius: 0,
        shadow: 'none',
        gradient: null,
      }
    }
  },
  {
    id: 'nudge-chat',
    name: 'Chat Nudge',
    category: 'feedback',
    element_type: 'nudge',
    icon: Sparkles,
    preview: {
      headline: 'Need Help?',
      body: 'Chat with us! We\'re here to answer your questions.',
      cta_text: 'Start Chat',
    },
    config: {
      element_type: 'nudge',
      position: 'bottom-right',
      trigger_type: 'time',
      trigger_config: { delay_seconds: 30 },
      frequency: 'session',
      animation: 'bounce',
      headline: 'Need Help?',
      body: 'Chat with us! We\'re here to answer your questions.',
      cta_text: 'Start Chat',
      cta_action: 'chat',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        borderRadius: 12,
        shadow: 'lg',
        gradient: null,
      }
    }
  },
  {
    id: 'feedback-nudge',
    name: 'Feedback Request',
    category: 'feedback',
    element_type: 'nudge',
    icon: Sparkles,
    preview: {
      headline: 'How was your experience?',
      body: 'We\'d love to hear your feedback to improve our service.',
      cta_text: 'Give Feedback',
    },
    config: {
      element_type: 'nudge',
      position: 'bottom-left',
      trigger_type: 'time',
      trigger_config: { delay_seconds: 60 },
      frequency: 'week',
      animation: 'slide-up',
      headline: 'How was your experience?',
      body: 'We\'d love to hear your feedback to improve our service.',
      cta_text: 'Give Feedback',
      cta_action: 'link',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        borderRadius: 12,
        shadow: 'lg',
        gradient: null,
      }
    }
  },
  {
    id: 'toast-notification',
    name: 'Recent Purchase',
    category: 'commerce',
    element_type: 'toast',
    icon: Bell,
    preview: {
      headline: 'Someone just purchased!',
      body: 'John from New York bought Premium Package',
      cta_text: 'View',
    },
    config: {
      element_type: 'toast',
      position: 'bottom-center',
      trigger_type: 'time',
      trigger_config: { delay_seconds: 10 },
      frequency: 'always',
      animation: 'slide-up',
      headline: 'Someone just purchased!',
      body: 'John from New York bought Premium Package',
      cta_text: 'View',
      cta_action: 'link',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        borderRadius: 8,
        shadow: 'md',
        gradient: null,
      }
    }
  },
  {
    id: 'product-popup',
    name: 'Product Spotlight',
    category: 'commerce',
    element_type: 'popup',
    icon: MessageSquare,
    preview: {
      headline: 'Featured Product',
      body: 'Check out our bestselling item - now 20% off!',
      cta_text: 'Shop Now',
    },
    config: {
      element_type: 'popup',
      position: 'center',
      trigger_type: 'scroll',
      trigger_config: { scroll_percent: 75 },
      frequency: 'day',
      animation: 'scale',
      headline: 'Featured Product',
      body: 'Check out our bestselling item - now 20% off!',
      cta_text: 'Shop Now',
      cta_action: 'link',
      appearance: {
        backgroundColor: '#ffffff',
        textColor: '#1a1a1a',
        borderRadius: 16,
        shadow: 'xl',
        gradient: null,
      }
    }
  },
  {
    id: 'brand-gradient-popup',
    name: 'Brand Gradient',
    category: 'promotional',
    element_type: 'popup',
    icon: MessageSquare,
    preview: {
      headline: 'Special Offer',
      body: 'Exclusive deal for our valued visitors.',
      cta_text: 'Claim Offer',
    },
    config: {
      element_type: 'popup',
      position: 'center',
      trigger_type: 'time',
      trigger_config: { delay_seconds: 8 },
      frequency: 'session',
      animation: 'fade',
      headline: 'Special Offer',
      body: 'Exclusive deal for our valued visitors.',
      cta_text: 'Claim Offer',
      cta_action: 'link',
      appearance: {
        textColor: '#ffffff',
        borderRadius: 20,
        shadow: '2xl',
        // Uses brand gradient
        gradient: {
          type: 'linear',
          angle: 135,
          // colors will be set from brand
        },
      }
    }
  },
]

// Apply brand colors to template
function applyBrandColors(template, brandColors) {
  const config = { ...template.config }
  const appearance = { ...config.appearance }
  
  // Set primary color
  if (!appearance.primaryColor) {
    appearance.primaryColor = brandColors.primary
  }
  
  // Set gradient colors if gradient is enabled
  if (appearance.gradient && !appearance.gradient.colors) {
    appearance.gradient = {
      ...appearance.gradient,
      colors: [brandColors.primary, brandColors.secondary || brandColors.primaryDark]
    }
  }
  
  config.appearance = appearance
  return config
}

// Template card preview
function TemplateCard({ template, brandColors, onSelect }) {
  const Icon = template.icon
  const { preview } = template
  
  // Get preview styling
  const config = applyBrandColors(template, brandColors)
  const { appearance } = config
  
  const getBackground = () => {
    if (appearance.gradient) {
      const grad = appearance.gradient
      if (grad.type === 'radial') {
        return `radial-gradient(circle, ${grad.colors.join(', ')})`
      }
      return `linear-gradient(${grad.angle || 135}deg, ${grad.colors.join(', ')})`
    }
    return appearance.backgroundColor || '#ffffff'
  }
  
  return (
    <button
      onClick={() => onSelect(template)}
      className="group relative bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl overflow-hidden hover:border-[var(--brand-primary)] transition-colors text-left"
    >
      {/* Preview */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
        {/* Mock browser frame */}
        <div className="absolute inset-2 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
          {/* Element preview */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-[180px] p-3 transition-transform group-hover:scale-105"
              style={{
                background: getBackground(),
                color: appearance.textColor,
                borderRadius: `${Math.min(appearance.borderRadius || 16, 12)}px`,
                boxShadow: appearance.shadow !== 'none' ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              <div className="text-[10px] font-semibold truncate mb-1">
                {preview.headline}
              </div>
              {preview.body && (
                <div className="text-[8px] opacity-80 line-clamp-2 mb-2">
                  {preview.body}
                </div>
              )}
              <div
                className="inline-block px-2 py-0.5 text-[8px] font-medium rounded"
                style={{
                  backgroundColor: appearance.primaryColor || brandColors.primary,
                  color: '#ffffff',
                }}
              >
                {preview.cta_text}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-3">
        <div className="flex items-center gap-2">
          <div
            className="p-1.5 rounded-md"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
          >
            <Icon className="h-3 w-3" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div>
            <div className="text-sm font-medium">{template.name}</div>
            <div className="text-xs text-muted-foreground capitalize">{template.element_type}</div>
          </div>
        </div>
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-[var(--brand-primary)]/0 group-hover:bg-[var(--brand-primary)]/5 transition-colors pointer-events-none" />
    </button>
  )
}

export default function EngageTemplates({ brandColors, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  // Filter templates
  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.element_type.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const handleSelect = (template) => {
    // Apply brand colors and return config
    const config = applyBrandColors(template, brandColors)
    onSelect({
      ...config,
      name: template.name,
    })
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--glass-border)]">
        <h2 className="text-lg font-semibold mb-3">Start from a Template</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3 py-1 text-sm rounded-full transition-colors",
                selectedCategory === cat.id
                  ? "bg-[var(--brand-primary)] text-white"
                  : "bg-[var(--glass-bg)] hover:bg-[var(--brand-primary)]/10"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  brandColors={brandColors}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No templates match your search</p>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* AI Suggestion */}
      <div className="p-4 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
          >
            <SignalIcon className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">Need something custom?</div>
            <div className="text-xs text-muted-foreground">
              Use Signal AI to create a unique element
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">AI</Badge>
        </div>
      </div>
    </div>
  )
}
