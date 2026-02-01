// src/pages/forms/components/FormsSettingsView.jsx
// Forms module settings - notifications, spam filters, defaults

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  Shield,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function FormsSettingsView({ projectId }) {
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    defaultNotificationEmails: [],
    defaultSuccessMessage: 'Thank you for your submission!',
    enableSpamFilter: true,
    enableHoneypot: true,
    requireRecaptcha: false,
    allowDrafts: false,
    defaultSubmitButtonText: 'Submit',
  })
  const [emailInput, setEmailInput] = useState('')
  
  useEffect(() => {
    loadSettings()
  }, [projectId])
  
  async function loadSettings() {
    if (!projectId) return
    
    try {
      const { data } = await supabase
        .from('projects')
        .select('settings')
        .eq('id', projectId)
        .single()
      
      if (data?.settings?.forms) {
        setSettings({ ...settings, ...data.settings.forms })
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    }
  }
  
  async function handleSave() {
    if (!projectId) return
    
    setIsSaving(true)
    try {
      // Get current settings
      const { data: currentData } = await supabase
        .from('projects')
        .select('settings')
        .eq('id', projectId)
        .single()
      
      const currentSettings = currentData?.settings || {}
      
      // Update with forms settings
      const { error } = await supabase
        .from('projects')
        .update({
          settings: {
            ...currentSettings,
            forms: settings,
          },
        })
        .eq('id', projectId)
      
      if (error) throw error
      
      toast.success('Settings saved')
    } catch (err) {
      console.error('Failed to save settings:', err)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }
  
  function handleAddEmail() {
    const email = emailInput.trim()
    if (!email) return
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }
    
    if (settings.defaultNotificationEmails.includes(email)) {
      toast.error('Email already added')
      return
    }
    
    setSettings({
      ...settings,
      defaultNotificationEmails: [...settings.defaultNotificationEmails, email],
    })
    setEmailInput('')
  }
  
  function handleRemoveEmail(email) {
    setSettings({
      ...settings,
      defaultNotificationEmails: settings.defaultNotificationEmails.filter(e => e !== email),
    })
  }
  
  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Forms Settings</h2>
            <p className="text-[var(--text-secondary)] mt-1">
              Configure default settings for all forms in this project
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2 text-white"
            style={{ backgroundColor: 'var(--brand-primary)' }}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Notifications */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
              >
                <Bell className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Default email recipients for form submissions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Default Notification Emails</Label>
              <p className="text-sm text-muted-foreground mb-2">
                These emails will receive notifications for all new forms by default
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="email@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                />
                <Button onClick={handleAddEmail} variant="outline">
                  Add
                </Button>
              </div>
              {settings.defaultNotificationEmails.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {settings.defaultNotificationEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Default Messages */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
              >
                <MessageSquare className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <CardTitle>Default Messages</CardTitle>
                <CardDescription>Default text for new forms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Success Message</Label>
              <Textarea
                placeholder="Thank you for your submission!"
                value={settings.defaultSuccessMessage}
                onChange={(e) => setSettings({ ...settings, defaultSuccessMessage: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Submit Button Text</Label>
              <Input
                placeholder="Submit"
                value={settings.defaultSubmitButtonText}
                onChange={(e) => setSettings({ ...settings, defaultSubmitButtonText: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Spam Protection */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
              >
                <Shield className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <CardTitle>Security & Spam Protection</CardTitle>
                <CardDescription>Protect your forms from spam and abuse</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Spam Filter</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically flag suspicious submissions
                </p>
              </div>
              <Switch
                checked={settings.enableSpamFilter}
                onCheckedChange={(checked) => setSettings({ ...settings, enableSpamFilter: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Honeypot Field</Label>
                <p className="text-sm text-muted-foreground">
                  Add hidden field to catch bots (recommended)
                </p>
              </div>
              <Switch
                checked={settings.enableHoneypot}
                onCheckedChange={(checked) => setSettings({ ...settings, enableHoneypot: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require reCAPTCHA</Label>
                <p className="text-sm text-muted-foreground">
                  Require reCAPTCHA verification (requires setup)
                </p>
              </div>
              <Switch
                checked={settings.requireRecaptcha}
                onCheckedChange={(checked) => setSettings({ ...settings, requireRecaptcha: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Features */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary) 15%, transparent)' }}
              >
                <CheckCircle className="h-4 w-4" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div>
                <CardTitle>Form Features</CardTitle>
                <CardDescription>Default feature settings for new forms</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Save Draft</Label>
                <p className="text-sm text-muted-foreground">
                  Enable users to save and resume forms later
                </p>
              </div>
              <Switch
                checked={settings.allowDrafts}
                onCheckedChange={(checked) => setSettings({ ...settings, allowDrafts: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
