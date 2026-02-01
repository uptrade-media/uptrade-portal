/**
 * NotificationPreferences - Phase 3.4.3
 * 
 * Settings for message notifications:
 * - Sound/badge per tab (Echo, Team, Live)
 * - Email digest options
 * - Desktop notification permissions
 */

import { useState, useEffect } from 'react'
import { Bell, BellOff, Mail, Volume2, VolumeX } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/toast'

const STORAGE_KEY = 'messages-notification-prefs'

const DEFAULT_PREFS = {
  echo: {
    sound: true,
    badge: true,
    desktop: true,
  },
  team: {
    sound: true,
    badge: true,
    desktop: true,
  },
  live: {
    sound: true,
    badge: true,
    desktop: true,
  },
  email: {
    enabled: false,
    frequency: 'daily', // 'immediate', 'hourly', 'daily', 'weekly'
  },
}

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [desktopPermission, setDesktopPermission] = useState('default')

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) })
      }
    } catch (err) {
      console.error('Failed to load notification preferences:', err)
    }

    // Check desktop notification permission
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission)
    }
  }, [])

  // Save preferences to localStorage
  const savePrefs = (newPrefs) => {
    setPrefs(newPrefs)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs))
      toast.success('Notification preferences saved')
    } catch (err) {
      console.error('Failed to save notification preferences:', err)
      toast.error('Failed to save preferences')
    }
  }

  const updateTabPref = (tab, key, value) => {
    savePrefs({
      ...prefs,
      [tab]: {
        ...prefs[tab],
        [key]: value,
      },
    })
  }

  const updateEmailPref = (key, value) => {
    savePrefs({
      ...prefs,
      email: {
        ...prefs.email,
        [key]: value,
      },
    })
  }

  const requestDesktopPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Desktop notifications not supported')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setDesktopPermission(permission)
      if (permission === 'granted') {
        toast.success('Desktop notifications enabled')
      } else {
        toast.error('Desktop notifications denied')
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err)
      toast.error('Failed to enable notifications')
    }
  }

  const renderTabPrefs = (tab, label) => (
    <div key={tab} className="space-y-3 p-4 rounded-lg bg-[var(--surface-secondary)]/50">
      <h4 className="font-medium text-sm text-[var(--text-primary)]">{label}</h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${tab}-sound`} className="flex items-center gap-2 text-sm cursor-pointer">
            {prefs[tab].sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            Sound
          </Label>
          <Switch
            id={`${tab}-sound`}
            checked={prefs[tab].sound}
            onCheckedChange={(checked) => updateTabPref(tab, 'sound', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`${tab}-badge`} className="flex items-center gap-2 text-sm cursor-pointer">
            {prefs[tab].badge ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            Badge count
          </Label>
          <Switch
            id={`${tab}-badge`}
            checked={prefs[tab].badge}
            onCheckedChange={(checked) => updateTabPref(tab, 'badge', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor={`${tab}-desktop`} className="text-sm cursor-pointer">
            Desktop notifications
          </Label>
          <Switch
            id={`${tab}-desktop`}
            checked={prefs[tab].desktop}
            onCheckedChange={(checked) => updateTabPref(tab, 'desktop', checked)}
            disabled={desktopPermission !== 'granted'}
          />
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Control how you receive message notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Desktop notification permission */}
        {desktopPermission !== 'granted' && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
              Desktop notifications are {desktopPermission === 'denied' ? 'blocked' : 'not enabled'}
            </p>
            {desktopPermission === 'default' && (
              <Button
                size="sm"
                variant="outline"
                onClick={requestDesktopPermission}
                className="text-amber-700 dark:text-amber-400 border-amber-500/30"
              >
                Enable Desktop Notifications
              </Button>
            )}
            {desktopPermission === 'denied' && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Please enable notifications in your browser settings
              </p>
            )}
          </div>
        )}

        {/* Per-tab preferences */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Message Tabs</h3>
          {renderTabPrefs('echo', 'Echo AI')}
          {renderTabPrefs('team', 'Team Messages')}
          {renderTabPrefs('live', 'Live Chat (Visitors)')}
        </div>

        {/* Email digest */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Email Digest</h3>
          <div className="p-4 rounded-lg bg-[var(--surface-secondary)]/50 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-enabled" className="flex items-center gap-2 text-sm cursor-pointer">
                <Mail className="h-4 w-4" />
                Email notifications
              </Label>
              <Switch
                id="email-enabled"
                checked={prefs.email.enabled}
                onCheckedChange={(checked) => updateEmailPref('enabled', checked)}
              />
            </div>
            {prefs.email.enabled && (
              <div className="space-y-2">
                <Label htmlFor="email-frequency" className="text-sm">
                  Frequency
                </Label>
                <Select
                  value={prefs.email.frequency}
                  onValueChange={(value) => updateEmailPref('frequency', value)}
                >
                  <SelectTrigger id="email-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="hourly">Hourly digest</SelectItem>
                    <SelectItem value="daily">Daily digest</SelectItem>
                    <SelectItem value="weekly">Weekly digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
