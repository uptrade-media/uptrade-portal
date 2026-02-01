/**
 * @uptrade/site-kit - SiteKitProvider
 * 
 * Unified provider component that initializes all enabled modules.
 * 
 * IMPORTANT: Client sites ONLY need to provide an API key.
 * - apiKey: Required - identifies project and provides access
 * - apiUrl: Optional - defaults to https://api.uptrademedia.com
 * 
 * All API calls go through Portal API with API key auth - never Supabase directly.
 * The API key identifies the project, so no project_id is needed.
 * 
 * Example minimal setup:
 * ```tsx
 * <SiteKitProvider
 *   apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
 *   analytics={{ enabled: true }}
 *   engage={{ enabled: true }}
 *   forms={{ enabled: true }}
 * >
 * ```
 */

'use client'

import React, { createContext, useContext, useMemo, useEffect, ReactNode, Suspense } from 'react'
import type { SiteKitConfig } from './types'

// Module providers
import { AnalyticsProvider } from './analytics/AnalyticsProvider'
import { EngageWidget } from './engage/EngageWidget'
import { configureFormsApi } from './forms/formsApi'
import { SitemapSync } from './seo/SitemapSync'
import { SignalBridge } from './signal/SignalBridge'

interface SignalConfig {
  enabled: boolean
  realtime?: boolean
  experiments?: boolean
  behaviorTracking?: boolean
}

interface SiteKitContextValue extends SiteKitConfig {
  isReady: boolean
  signal?: SignalConfig
  signalUrl?: string
}

const SiteKitContext = createContext<SiteKitContextValue | null>(null)

export function useSiteKit(): SiteKitContextValue {
  const context = useContext(SiteKitContext)
  if (!context) {
    throw new Error('useSiteKit must be used within a SiteKitProvider')
  }
  return context
}

interface SiteKitProviderProps extends SiteKitConfig {
  children: ReactNode
  signalUrl?: string
}

export function SiteKitProvider({
  children,
  apiKey,
  apiUrl,
  signalUrl,
  analytics,
  engage,
  forms,
  signal,
  debug = false,
}: SiteKitProviderProps & { signal?: SignalConfig }) {
  // Default to production URLs if not specified
  const finalApiUrl = apiUrl || 'https://api.uptrademedia.com'
  const finalSignalUrl = signalUrl || 'https://signal.uptrademedia.com'
  
  // Validate API key
  if (!apiKey) {
    console.error('@uptrade/site-kit: No API key provided. Set NEXT_PUBLIC_UPTRADE_API_KEY environment variable.')
  }
  
  // Set window globals for Portal API access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__SITE_KIT_API_URL__ = finalApiUrl
      ;(window as any).__SITE_KIT_SIGNAL_URL__ = finalSignalUrl
      ;(window as any).__SITE_KIT_API_KEY__ = apiKey
      ;(window as any).__SITE_KIT_DEBUG__ = debug
    }
    
    // Configure forms API
    if (apiKey) {
      configureFormsApi({
        baseUrl: finalApiUrl,
        apiKey,
      })
    }
  }, [finalApiUrl, finalSignalUrl, apiKey, debug])

  const contextValue = useMemo<SiteKitContextValue>(
    () => ({
      apiUrl: finalApiUrl,
      signalUrl: finalSignalUrl,
      apiKey,
      analytics,
      engage,
      forms,
      signal,
      debug,
      isReady: true,
    }),
    [finalApiUrl, finalSignalUrl, apiKey, analytics, engage, forms, signal, debug]
  )

  // Build the provider tree based on enabled modules
  let content = <>{children}</>

  // Wrap with SignalBridge if enabled (must be outermost for context access)
  if (signal?.enabled) {
    content = (
      <SignalBridge
        enabled={signal.enabled}
        realtime={signal.realtime !== false}
        experiments={signal.experiments !== false}
        behaviorTracking={signal.behaviorTracking !== false}
      >
        {content}
      </SignalBridge>
    )
  }

  // Wrap with Analytics if enabled
  if (analytics?.enabled) {
    content = (
      <Suspense fallback={null}>
        <AnalyticsProvider
          apiUrl={finalApiUrl}
          apiKey={apiKey}
          trackPageViews={analytics.trackPageViews !== false}
          trackWebVitals={analytics.trackWebVitals !== false}
          trackScrollDepth={analytics.trackScrollDepth !== false}
          trackClicks={analytics.trackClicks !== false}
          debug={debug}
        >
          {content}
        </AnalyticsProvider>
      </Suspense>
    )
  }

  // Add Engage widget if enabled (doesn't wrap, just renders alongside)
  if (engage?.enabled) {
    content = (
      <>
        {content}
        <EngageWidget 
          apiUrl={finalApiUrl} 
          apiKey={apiKey}
          position={engage.position || 'bottom-right'}
          chatEnabled={engage.chatEnabled !== false}
        />
      </>
    )
  }

  // Always include SitemapSync to keep seo_pages in sync with sitemap.xml
  // This is the canonical source of truth for what pages exist
  content = (
    <>
      {content}
      <SitemapSync debug={debug} />
    </>
  )

  return (
    <SiteKitContext.Provider value={contextValue}>
      {content}
    </SiteKitContext.Provider>
  )
}

/**
 * Hook to check if a specific module is enabled
 */
export function useModuleEnabled(module: 'analytics' | 'engage' | 'forms' | 'seo'): boolean {
  const context = useSiteKit()
  
  switch (module) {
    case 'analytics':
      return context.analytics?.enabled ?? false
    case 'engage':
      return context.engage?.enabled ?? false
    case 'forms':
      return context.forms?.enabled ?? false
    case 'seo':
      return true // SEO is always enabled via RSC components
    default:
      return false
  }
}
