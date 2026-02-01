/**
 * @uptrade/site-kit/commerce - Server-side utilities
 * 
 * Helpers for server-side rendering and dynamic routes.
 * Use in Next.js getStaticPaths, getStaticProps, or App Router.
 * 
 * All data fetching goes through the Portal API.
 */

import type { CommerceOffering, OfferingType } from './types'

interface ServerConfig {
  apiUrl: string
  apiKey: string
  projectId: string
}

interface SlugItem {
  slug: string
}

async function apiFetch<T>(config: ServerConfig, endpoint: string): Promise<T | null> {
  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      headers: {
        'X-API-Key': config.apiKey,
        'X-Project-ID': config.projectId,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) return null
    return response.json()
  } catch (error) {
    console.error('API fetch error:', error)
    return null
  }
}

function transformOffering(data: Record<string, unknown>): CommerceOffering {
  return {
    id: data.id as string,
    project_id: data.project_id as string,
    type: data.type as OfferingType,
    status: data.status as 'draft' | 'active' | 'archived' | 'sold_out',
    name: data.name as string,
    slug: data.slug as string,
    description: data.description as string | undefined,
    short_description: data.short_description as string | undefined,
    long_description: data.long_description as string | undefined,
    featured_image_url: data.featured_image_url as string | undefined,
    gallery_images: (data.gallery_image_urls as string[]) || [],
    price_type: (data.price_type as 'fixed' | 'variable' | 'quote' | 'free') || 'fixed',
    price: data.price as number | undefined,
    compare_at_price: data.compare_at_price as number | undefined,
    currency: (data.currency as string) || 'USD',
    price_is_public: (data.price_is_public as boolean) ?? true,
    billing_period: data.billing_period as 'weekly' | 'monthly' | 'quarterly' | 'yearly' | undefined,
    track_inventory: data.track_inventory as boolean | undefined,
    inventory_count: data.inventory_count as number | undefined,
    allow_backorder: data.allow_backorder as boolean | undefined,
    duration_minutes: data.duration_minutes as number | undefined,
    capacity: data.capacity as number | undefined,
    location: data.location as string | undefined,
    is_virtual: data.is_virtual as boolean | undefined,
    virtual_meeting_url: data.virtual_meeting_url as string | undefined,
    requires_booking: data.requires_booking as boolean | undefined,
    booking_lead_time_hours: data.booking_lead_time_hours as number | undefined,
    category: data.category as CommerceOffering['category'],
    category_id: data.category_id as string | undefined,
    tags: (data.tags as string[]) || [],
    seo_title: data.seo_title as string | undefined,
    seo_description: data.seo_description as string | undefined,
    features: (data.features as string[]) || [],
    specifications: (data.specifications as Record<string, string>) || {},
    schedules: (data.schedules as CommerceOffering['schedules']) || [],
    variants: (data.variants as CommerceOffering['variants']) || [],
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  }
}

// ============================================
// Static Path Generators
// ============================================

/**
 * Get all product slugs for static generation
 * 
 * @example Next.js Pages Router
 * export async function getStaticPaths() {
 *   const paths = await getProductPaths(config)
 *   return { paths, fallback: 'blocking' }
 * }
 */
export async function getProductPaths(config: ServerConfig): Promise<{ params: { slug: string } }[]> {
  const data = await apiFetch<{ offerings: SlugItem[] }>(
    config,
    `/public/commerce/offerings?type=product&status=active&fields=slug`
  )
  
  if (!data?.offerings) return []
  
  return data.offerings.map((item: SlugItem) => ({ params: { slug: item.slug } }))
}

/**
 * Get all event slugs for static generation
 */
export async function getEventPaths(config: ServerConfig): Promise<{ params: { slug: string } }[]> {
  const data = await apiFetch<{ offerings: SlugItem[] }>(
    config,
    `/public/commerce/offerings?type=event&status=active&fields=slug`
  )
  
  if (!data?.offerings) return []
  
  return data.offerings.map((item: SlugItem) => ({ params: { slug: item.slug } }))
}

/**
 * Get all offering slugs for static generation (any type)
 */
export async function getOfferingPaths(
  config: ServerConfig,
  type?: OfferingType | OfferingType[]
): Promise<{ params: { slug: string } }[]> {
  let typeParam = ''
  if (type) {
    if (Array.isArray(type)) {
      typeParam = `&type=${type.join(',')}`
    } else {
      typeParam = `&type=${type}`
    }
  }
  
  const data = await apiFetch<{ offerings: SlugItem[] }>(
    config,
    `/public/commerce/offerings?status=active&fields=slug${typeParam}`
  )
  
  if (!data?.offerings) return []
  
  return data.offerings.map((item: SlugItem) => ({ params: { slug: item.slug } }))
}

// ============================================
// Data Fetchers
// ============================================

/**
 * Fetch a single offering by slug (server-side)
 * 
 * @example Next.js Pages Router
 * export async function getStaticProps({ params }) {
 *   const product = await getOfferingBySlug(config, params.slug)
 *   if (!product) return { notFound: true }
 *   return { props: { product }, revalidate: 60 }
 * }
 */
export async function getOfferingBySlug(
  config: ServerConfig,
  slug: string
): Promise<CommerceOffering | null> {
  const data = await apiFetch<{ offering: Record<string, unknown> }>(
    config,
    `/public/commerce/offerings/${slug}`
  )
  
  if (!data?.offering) return null
  
  return transformOffering(data.offering)
}

/**
 * Fetch all offerings of a type (server-side)
 */
export async function getOfferings(
  config: ServerConfig,
  options: {
    type?: OfferingType | OfferingType[]
    category?: string
    limit?: number
    status?: string
  } = {}
): Promise<CommerceOffering[]> {
  const params = new URLSearchParams()
  params.set('status', options.status || 'active')
  
  if (options.type) {
    if (Array.isArray(options.type)) {
      params.set('type', options.type.join(','))
    } else {
      params.set('type', options.type)
    }
  }
  
  if (options.category) {
    params.set('category', options.category)
  }
  
  if (options.limit) {
    params.set('limit', options.limit.toString())
  }
  
  const data = await apiFetch<{ offerings: Record<string, unknown>[] }>(
    config,
    `/public/commerce/offerings?${params.toString()}`
  )
  
  if (!data?.offerings) return []
  
  return data.offerings.map(transformOffering)
}

/**
 * Fetch upcoming events (server-side)
 */
export async function getUpcomingEvents(
  config: ServerConfig,
  options: { limit?: number; category?: string } = {}
): Promise<CommerceOffering[]> {
  const params = new URLSearchParams()
  params.set('type', 'event')
  params.set('status', 'active')
  params.set('upcoming', 'true')
  
  if (options.category) {
    params.set('category', options.category)
  }
  
  if (options.limit) {
    params.set('limit', options.limit.toString())
  }
  
  const data = await apiFetch<{ offerings: Record<string, unknown>[] }>(
    config,
    `/public/commerce/offerings?${params.toString()}`
  )
  
  if (!data?.offerings) return []
  
  return data.offerings.map(transformOffering)
}

/**
 * Get next upcoming event (server-side)
 */
export async function getNextEvent(
  config: ServerConfig,
  category?: string
): Promise<CommerceOffering | null> {
  const events = await getUpcomingEvents(config, { limit: 1, category })
  return events[0] || null
}

// ============================================
// Metadata Helpers
// ============================================

/**
 * Generate page metadata for an offering
 * 
 * @example Next.js App Router
 * export async function generateMetadata({ params }) {
 *   const product = await getOfferingBySlug(config, params.slug)
 *   return generateOfferingMetadata(product, 'https://example.com')
 * }
 */
export function generateOfferingMetadata(
  offering: CommerceOffering | null,
  siteUrl: string
): {
  title: string
  description: string
  openGraph: {
    title: string
    description: string
    images: string[]
    type: string
    url: string
  }
} | null {
  if (!offering) return null
  
  const title = offering.seo_title || offering.name
  const description = offering.seo_description || offering.short_description || offering.description || ''
  const images = offering.featured_image_url ? [offering.featured_image_url] : []
  
  const typeMap: Record<OfferingType, string> = {
    product: 'product',
    service: 'website',
    event: 'website',
    class: 'website',
    subscription: 'product',
  }
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: typeMap[offering.type] || 'website',
      url: `${siteUrl}/${offering.type}s/${offering.slug}`,
    },
  }
}

// ============================================
// Export config builder
// ============================================

/**
 * Create a server config for API calls
 * 
 * @param apiUrl - Portal API URL (e.g., 'https://api.uptrademedia.com')
 * @param apiKey - Project API key
 * @param projectId - Project ID
 */
export function createServerConfig(
  apiUrl: string,
  apiKey: string,
  projectId: string
): ServerConfig {
  return { apiUrl, apiKey, projectId }
}
