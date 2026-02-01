/**
 * @uptrade/site-kit/seo - Server-Only API Functions
 * 
 * SECURITY: These functions use private environment variables
 * and should ONLY be imported in server-side code (RSC, API routes, server actions).
 * 
 * DO NOT import this file in client components or it will expose API keys.
 */

import { cache } from 'react'
import 'server-only' // This ensures the module can only be imported server-side

// ============================================
// Server-Only API Config
// ============================================

function getSecureApiConfig() {
  // Use private env vars that won't be bundled into client code
  const apiUrl = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY || ''
  const projectId = process.env.UPTRADE_PROJECT_ID || ''
  
  if (!apiKey) {
    throw new Error('@uptrade/seo: UPTRADE_API_KEY environment variable is required for server-side SEO functions')
  }
  
  return { apiUrl, apiKey, projectId }
}

async function secureApiPost<T>(endpoint: string, body: Record<string, any> = {}): Promise<T | null> {
  const { apiUrl, apiKey } = getSecureApiConfig()
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
      next: { revalidate: 60 }, // Cache for 60 seconds
    })
    
    if (!response.ok) {
      console.error(`@uptrade/seo: API error ${response.status}: ${response.statusText}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('@uptrade/seo: Network error:', error)
    return null
  }
}

async function secureApiGet<T>(endpoint: string): Promise<T | null> {
  const { apiUrl, apiKey } = getSecureApiConfig()
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      next: { revalidate: 60 },
    })
    
    if (!response.ok) {
      console.error(`@uptrade/seo: API error ${response.status}: ${response.statusText}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('@uptrade/seo: Network error:', error)
    return null
  }
}

// ============================================
// Secure Cached Data Fetchers
// ============================================

/**
 * Fetch SEO page data - cached per request
 * @server-only
 */
export const getSEOPageData = cache(async (
  projectId: string,
  path: string
) => {
  const result = await secureApiPost<{ page: any }>('/api/public/seo/page', { 
    projectId,
    path 
  })
  return result?.page || null
})

/**
 * Fetch schema markups for a page - cached per request
 * @server-only
 */
export const getSchemaMarkups = cache(async (
  projectId: string,
  path: string,
  options?: { includeTypes?: string[]; excludeTypes?: string[] }
) => {
  const result = await secureApiPost<{ schemas: any[] }>('/api/public/seo/schemas', {
    projectId,
    path,
    includeTypes: options?.includeTypes,
    excludeTypes: options?.excludeTypes,
  })
  return result?.schemas || []
})

/**
 * Fetch FAQ data for a page - cached per request
 * @server-only
 */
export const getFAQData = cache(async (
  projectId: string,
  path: string
) => {
  const result = await secureApiPost<{ faq: any }>('/api/public/seo/faq', { 
    projectId,
    path 
  })
  return result?.faq || null
})

/**
 * Fetch internal links for a page - cached per request
 * @server-only
 */
export const getInternalLinks = cache(async (
  projectId: string,
  sourcePath: string,
  options?: { position?: string; limit?: number }
) => {
  const result = await secureApiPost<{ links: any[] }>('/api/public/seo/internal-links', {
    projectId,
    sourcePath,
    position: options?.position,
    limit: options?.limit,
  })
  return result?.links || []
})

/**
 * Fetch content block - cached per request
 * @server-only
 */
export const getContentBlock = cache(async (
  projectId: string,
  path: string,
  section: string
) => {
  const result = await secureApiPost<{ content: any }>('/api/public/seo/content', { 
    projectId,
    path, 
    section 
  })
  return result?.content || null
})

/**
 * Fetch A/B test and determine variant - cached per request
 * @server-only
 */
export const getABTest = cache(async (
  projectId: string,
  path: string,
  field: string
) => {
  const result = await secureApiPost<{ test: any }>('/api/public/seo/ab-test', { 
    projectId,
    path, 
    field 
  })
  return result?.test || null
})

/**
 * Record A/B test impression
 * @server-only
 */
export async function recordABImpression(
  testId: string,
  variant: 'a' | 'b',
  sessionId?: string
): Promise<void> {
  await secureApiPost('/api/public/seo/ab-impression', { testId, variant, sessionId })
}

/**
 * Fetch redirect for a path - cached per request
 * @server-only
 */
export const getRedirectData = cache(async (
  projectId: string,
  path: string
) => {
  const result = await secureApiPost<{ redirect: any }>('/api/public/seo/redirect', { 
    projectId,
    path 
  })
  return result?.redirect || null
})

/**
 * Fetch managed scripts - cached per request
 * @server-only
 */
export const getManagedScripts = cache(async (
  projectId: string,
  position: string,
  currentPath?: string
) => {
  const result = await secureApiPost<{ scripts: any[] }>('/api/public/seo/scripts', {
    projectId,
    position,
    currentPath,
  })
  return result?.scripts || []
})

/**
 * Fetch robots directive for a page - cached per request
 * @server-only
 */
export const getRobotsData = cache(async (
  projectId: string,
  path: string
) => {
  const result = await secureApiPost<{ page: any }>('/api/public/seo/page', { 
    projectId,
    path 
  })
  return result?.page?.managed_robots || null
})

/**
 * Fetch sitemap entries - cached per request
 * @server-only
 */
export const getSitemapEntries = cache(async (
  projectId: string,
  options?: { publishedOnly?: boolean }
) => {
  const result = await secureApiPost<{ entries: any[] }>('/api/public/seo/sitemap', {
    projectId,
    publishedOnly: options?.publishedOnly,
  })
  return result?.entries || []
})

/**
 * Register/sync sitemap entries from the client site
 * Call this at build time to populate seo_pages from your sitemap.xml
 * @server-only
 * 
 * @example
 * ```ts
 * // scripts/register-sitemap.ts (run at build time)
 * import { registerSitemap } from '@uptrade/seo/server'
 * 
 * await registerSitemap([
 *   { path: '/', priority: 1.0, changefreq: 'daily' },
 *   { path: '/about', priority: 0.8, changefreq: 'weekly' },
 * ])
 * ```
 */
export async function registerSitemap(
  entries: Array<{
    path: string
    title?: string
    priority?: number
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  }>
): Promise<{ success: boolean; created: number; updated: number }> {
  const { apiUrl, apiKey, projectId } = getSecureApiConfig()
  
  try {
    const response = await fetch(`${apiUrl}/api/public/seo/register-sitemap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ projectId, entries }),
    })
    
    if (!response.ok) {
      console.error(`@uptrade/seo: Sitemap registration failed: ${response.statusText}`)
      return { success: false, created: 0, updated: 0 }
    }
    
    return await response.json()
  } catch (error) {
    console.error('@uptrade/seo: Sitemap registration error:', error)
    return { success: false, created: 0, updated: 0 }
  }
}

// ============================================
// AI Visibility & Entity Graph API (Signal)
// ============================================

function getSignalApiConfig() {
  const apiUrl = process.env.SIGNAL_API_URL || process.env.NEXT_PUBLIC_SIGNAL_API_URL || 'https://signal.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY || ''
  return { apiUrl, apiKey }
}

async function signalApiGet<T>(endpoint: string): Promise<T | null> {
  const { apiUrl, apiKey } = getSignalApiConfig()
  
  if (!apiKey) {
    return null
  }
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })
    
    if (!response.ok) {
      return null
    }
    
    const result = await response.json()
    return result?.data || result
  } catch (error) {
    console.error('@uptrade/seo: Signal API error:', error)
    return null
  }
}

/**
 * Entity types for the knowledge graph
 */
export type EntityType = 
  | 'organization'
  | 'person'
  | 'service'
  | 'product'
  | 'location'
  | 'concept'
  | 'credential'

/**
 * Entity from the knowledge graph
 */
export interface SEOEntity {
  id: string
  project_id: string
  entity_type: EntityType
  name: string
  slug: string
  properties: Record<string, unknown>
  knows_about: string[]
  same_as: string[]
  schema_type?: string
  is_primary: boolean
}

/**
 * Fetch entities for a project - cached per request
 * Returns the entity graph for enhanced schema markup
 * @server-only
 */
export const getEntities = cache(async (
  projectId: string,
  options?: { type?: EntityType }
): Promise<SEOEntity[]> => {
  let endpoint = `/skills/seo/entities/${projectId}`
  if (options?.type) {
    endpoint += `?type=${options.type}`
  }
  const result = await signalApiGet<SEOEntity[]>(endpoint)
  return result || []
})

/**
 * Fetch primary entity (the business) - cached per request
 * @server-only
 */
export const getPrimaryEntity = cache(async (
  projectId: string
): Promise<SEOEntity | null> => {
  return signalApiGet<SEOEntity>(`/skills/seo/entities/${projectId}/primary`)
})

/**
 * Fetch entity-enhanced schema for a page
 * Returns Organization schema with knowsAbout, areaServed, employee, etc.
 * @server-only
 */
export const getEntityEnhancedSchema = cache(async (
  projectId: string,
  pagePath: string
): Promise<object[]> => {
  const result = await signalApiGet<{ schemas: object[] }>(
    `/skills/seo/schema/${projectId}/entity-enhanced?pagePath=${encodeURIComponent(pagePath)}`
  )
  return result?.schemas || []
})

/**
 * Get AI visibility score for a page
 * @server-only
 */
export const getVisibilityScore = cache(async (
  projectId: string,
  pagePath: string
): Promise<{
  overall_score: number
  entity_coverage: number
  answer_density: number
  chunk_readability: number
  authority_signals: number
  schema_completeness: number
} | null> => {
  const result = await signalApiGet<any[]>(`/skills/seo/visibility/${projectId}`)
  if (!result) return null
  return result.find(s => s.page_path === pagePath) || null
})

/**
 * Get AI visibility summary for project
 * @server-only
 */
export const getVisibilitySummary = cache(async (
  projectId: string
): Promise<{
  overall_score: number
  total_entities: number
  pages_analyzed: number
  top_recommendations: Array<{ priority: string; type: string; message: string }>
} | null> => {
  return signalApiGet(`/skills/seo/visibility/${projectId}/summary`)
})
