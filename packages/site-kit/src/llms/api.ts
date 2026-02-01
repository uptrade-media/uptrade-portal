/**
 * @uptrade/site-kit/llms - API Functions
 * 
 * Data fetching for LLM visibility content.
 * Pulls from Signal knowledge base and project data.
 */

import { cache } from 'react'
import type { LLMsDataResponse, LLMBusinessInfo, LLMContactInfo, LLMService, LLMFAQItem, LLMPageSummary } from './types'

// ============================================
// API Config
// ============================================

function getApiConfig() {
  // Use site-kit globals if available, otherwise fall back to env vars
  const apiUrl = (typeof window !== 'undefined' && (window as any).__SITE_KIT_API_URL__) 
    || process.env.NEXT_PUBLIC_UPTRADE_API_URL 
    || 'https://api.uptrademedia.com'
  
  const apiKey = (typeof window !== 'undefined' && (window as any).__SITE_KIT_API_KEY__)
    || process.env.NEXT_PUBLIC_UPTRADE_API_KEY 
    || ''
  
  return { apiUrl, apiKey }
}

async function apiGet<T>(endpoint: string): Promise<T | null> {
  const { apiUrl, apiKey } = getApiConfig()
  
  if (!apiKey) {
    console.error('@uptrade/llms: No API key configured. Set NEXT_PUBLIC_UPTRADE_API_KEY.')
    return null
  }
  
  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!response.ok) {
      console.error(`@uptrade/llms: API error: ${response.statusText}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('@uptrade/llms: Network error:', error)
    return null
  }
}

// ============================================
// Cached Data Fetchers
// ============================================

/**
 * Fetch all LLM visibility data for a project - cached per request
 * This is the main data source for llms.txt generation
 * 
 * @param projectId - Optional project ID (API key identifies project if omitted)
 */
export const getLLMsData = cache(async (
  projectId?: string
): Promise<LLMsDataResponse | null> => {
  return apiGet<LLMsDataResponse>(`/api/public/llms/data`)
})

/**
 * Fetch business info only - cached per request
 */
export const getBusinessInfo = cache(async (
  projectId?: string
): Promise<LLMBusinessInfo | null> => {
  const result = await apiGet<{ business: LLMBusinessInfo }>(`/api/public/llms/business`)
  return result?.business || null
})

/**
 * Fetch services list - cached per request
 */
export const getServices = cache(async (
  projectId?: string
): Promise<LLMService[]> => {
  const result = await apiGet<{ services: LLMService[] }>(`/api/public/llms/services`)
  return result?.services || []
})

/**
 * Fetch FAQ items - cached per request
 */
export const getFAQItems = cache(async (
  projectId?: string,
  limit?: number
): Promise<LLMFAQItem[]> => {
  const endpoint = limit 
    ? `/api/public/llms/faq?limit=${limit}`
    : '/api/public/llms/faq'
  const result = await apiGet<{ faq: LLMFAQItem[] }>(endpoint)
  return result?.faq || []
})

/**
 * Fetch page summaries for sitemap - cached per request
 */
export const getPageSummaries = cache(async (
  projectId?: string,
  limit?: number
): Promise<LLMPageSummary[]> => {
  const endpoint = limit 
    ? `/api/public/llms/pages?limit=${limit}`
    : '/api/public/llms/pages'
  const result = await apiGet<{ pages: LLMPageSummary[] }>(endpoint)
  return result?.pages || []
})
