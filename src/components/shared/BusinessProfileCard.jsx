// src/components/shared/BusinessProfileCard.jsx
// Shared Business Profile component - Single source of truth for NAP (Name, Address, Phone)
// Used in: Project Settings, Local SEO Citations
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Info, MapPin, Phone as PhoneIcon } from 'lucide-react'
import { US_STATES } from '@/lib/constants/us-states'
import { INDUSTRY_CATEGORIES } from '@/lib/constants/industries'

export default function BusinessProfileCard({ 
  data = {}, 
  onChange, 
  mode = 'edit', // 'edit' or 'display'
  showIndustry = true,
  title = 'Business Profile',
  description = 'Business location and industry information. Used across the portal for personalization, Signal AI context, trending topics, and local SEO insights.'
}) {
  const handleChange = (field, value) => {
    if (onChange) {
      onChange({ ...data, [field]: value })
    }
  }

  // Display mode - show data only
  if (mode === 'display') {
    const fullAddress = [
      data.address_line1,
      data.address_line2,
      data.city,
      data.state_code,
      data.postal_code
    ].filter(Boolean).join(', ')

    if (!data.address_line1 && !data.phone) {
      return (
        <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--brand-primary)]" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-[var(--text-secondary)]">
                Set up your business profile in Project Settings to enable Local SEO features
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[var(--brand-primary)]" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-[var(--text-secondary)] mt-0.5" />
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Business Name</p>
                <p className="font-medium text-[var(--text-primary)]">{data.title || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-[var(--text-secondary)] mt-0.5" />
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Address</p>
                <p className="font-medium text-[var(--text-primary)]">{fullAddress || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <PhoneIcon className="h-5 w-5 text-[var(--text-secondary)] mt-0.5" />
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Phone</p>
                <p className="font-medium text-[var(--text-primary)]">{data.phone || 'Not set'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Edit mode - full form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Industry (optional) */}
        {showIndustry && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Industry</Label>
              <Select
                value={data.industry || ''}
                onValueChange={(v) => handleChange('industry', v)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legal">Legal / Law Firm</SelectItem>
                  <SelectItem value="healthcare">Healthcare / Medical</SelectItem>
                  <SelectItem value="home_services">Home Services</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="finance">Finance / Banking</SelectItem>
                  <SelectItem value="technology">Technology / SaaS</SelectItem>
                  <SelectItem value="ecommerce">E-commerce / Retail</SelectItem>
                  <SelectItem value="restaurant">Restaurant / Hospitality</SelectItem>
                  <SelectItem value="construction">Construction / Trades</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="beauty_fitness">Beauty & Fitness</SelectItem>
                  <SelectItem value="automotive">Automotive</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="nonprofit">Non-Profit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Trending Topics Category</Label>
              <Select
                value={String(data.google_trends_category_id || 0)}
                onValueChange={(v) => handleChange('google_trends_category_id', parseInt(v, 10))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Phone */}
        <div>
          <Label>Business Phone</Label>
          <Input
            type="tel"
            value={data.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="(555) 555-5555"
            className="mt-1.5"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Primary contact number for NAP consistency
          </p>
        </div>
        
        {/* Address */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Business Address</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Street Address</Label>
              <Input
                value={data.address_line1 || ''}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                placeholder="123 Main Street"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Suite / Unit</Label>
              <Input
                value={data.address_line2 || ''}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                placeholder="Suite 200"
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">City</Label>
              <Input
                value={data.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cincinnati"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">State</Label>
              <Select
                value={data.state_code || ''}
                onValueChange={(v) => handleChange('state_code', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(state => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">ZIP Code</Label>
              <Input
                value={data.postal_code || ''}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="45202"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select
                value={data.country_code || 'US'}
                onValueChange={(v) => handleChange('country_code', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
          <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="text-muted-foreground">
            <p>
              <strong>Why this matters:</strong> Your business profile is used by Signal AI to provide
              relevant insights, Echo uses it for personalized content ideas, and Local SEO uses it
              for NAP consistency tracking. Connect Google Business Profile to auto-populate this information.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
