import * as React from 'react'
import { getSchemaMarkups, getEntityEnhancedSchema } from './api'
import type { ManagedSchemaProps } from './types'

/**
 * Speakable configuration for schema markup
 */
export interface SpeakableSpec {
  /** CSS selectors for speakable content */
  cssSelector?: string[]
  /** XPath selectors for speakable content */
  xpath?: string[]
}

/**
 * Extended schema props with speakable and entity support
 */
export interface EnhancedManagedSchemaProps extends ManagedSchemaProps {
  /** Add speakable specification to page schema */
  speakable?: SpeakableSpec | boolean
  /** Page type for speakable (WebPage or Article) */
  pageType?: 'WebPage' | 'Article'
  /** Page name for speakable schema */
  pageName?: string
  /** Page URL for speakable schema */
  pageUrl?: string
  /** Include entity-enhanced schema from knowledge graph (AI Visibility) */
  includeEntityGraph?: boolean
}

/**
 * Default speakable selectors for common page elements
 */
export const DEFAULT_SPEAKABLE_SELECTORS = [
  'h1',
  '[data-speakable="true"]',
  '.page-summary',
  '.key-points',
  '.aeo-block[data-speakable="true"]',
]

/**
 * ManagedSchema - Server Component that injects JSON-LD schema
 * 
 * Fetches schema markup from Portal and renders as script tags.
 * Now with speakable support for voice assistants and AI systems.
 * 
 * @example
 * ```tsx
 * // app/services/[slug]/page.tsx
 * import { ManagedSchema } from '@uptrade/seo'
 * 
 * export default async function ServicePage({ params }) {
 *   return (
 *     <>
 *       <ManagedSchema 
 *         projectId={process.env.UPTRADE_PROJECT_ID!}
 *         path={`/services/${params.slug}`}
 *         speakable={true}
 *         pageName="Family Law Services"
 *         pageUrl="https://example.com/services/family-law"
 *       />
 *       <main>...</main>
 *     </>
 *   )
 * }
 * ```
 */
export async function ManagedSchema({
  projectId,
  path,
  additionalSchemas = [],
  includeTypes,
  excludeTypes,
  speakable,
  pageType = 'WebPage',
  pageName,
  pageUrl,
  includeEntityGraph = false,
}: EnhancedManagedSchemaProps): Promise<React.ReactElement | null> {
  // Fetch managed schemas from Portal
  const schemas = await getSchemaMarkups(projectId, path, {
    includeTypes,
    excludeTypes,
  })

  // Fetch entity-enhanced schemas if enabled
  let entitySchemas: object[] = []
  if (includeEntityGraph) {
    entitySchemas = await getEntityEnhancedSchema(projectId, path)
  }

  // Combine all schemas: entity-enhanced + managed + additional
  const allSchemas = [
    ...entitySchemas,
    ...schemas.map(s => s.schema_json),
    ...additionalSchemas,
  ]

  // Add speakable schema if requested
  if (speakable && pageName && pageUrl) {
    const speakableSchema = createSpeakableWebPageSchema(
      pageType,
      pageName,
      pageUrl,
      typeof speakable === 'object' ? speakable : undefined
    )
    allSchemas.push(speakableSchema)
  }

  if (allSchemas.length === 0) {
    return null
  }

  // If multiple schemas, wrap in @graph
  const schemaContent = allSchemas.length === 1
    ? allSchemas[0]
    : {
        '@context': 'https://schema.org',
        '@graph': allSchemas.map(s => {
          // Remove @context from individual schemas when in graph
          const { '@context': _, ...rest } = s as Record<string, unknown>
          return rest
        }),
      }

  // Add @context if not in graph mode
  const finalSchema = allSchemas.length === 1
    ? { '@context': 'https://schema.org', ...schemaContent as Record<string, unknown> }
    : schemaContent

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(finalSchema, null, 0),
      }}
    />
  )
}

/**
 * Generate schema for a specific type with managed data
 * 
 * Helper to create common schema types
 */
export function createSchema(
  type: string,
  data: Record<string, unknown>
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }
}

/**
 * Create a WebPage or Article schema with speakable specification
 * 
 * This helps voice assistants and AI systems identify key content to read aloud.
 * 
 * @see https://schema.org/speakable
 * @see https://developers.google.com/search/docs/appearance/structured-data/speakable
 */
export function createSpeakableWebPageSchema(
  type: 'WebPage' | 'Article',
  name: string,
  url: string,
  speakable?: SpeakableSpec
): Record<string, unknown> {
  const speakableSpec: Record<string, unknown> = {
    '@type': 'SpeakableSpecification',
  }

  if (speakable?.cssSelector?.length) {
    speakableSpec.cssSelector = speakable.cssSelector
  } else if (speakable?.xpath?.length) {
    speakableSpec.xpath = speakable.xpath
  } else {
    // Use default selectors
    speakableSpec.cssSelector = DEFAULT_SPEAKABLE_SELECTORS
  }

  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    url,
    speakable: speakableSpec,
  }
}

/**
 * Create BreadcrumbList schema from path
 */
export function createBreadcrumbSchema(
  baseUrl: string,
  path: string,
  labels?: Record<string, string>
): Record<string, unknown> {
  const segments = path.split('/').filter(Boolean)
  
  const items = segments.map((segment, index) => {
    const itemPath = '/' + segments.slice(0, index + 1).join('/')
    const label = labels?.[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: label,
      item: `${baseUrl}${itemPath}`,
    }
  })

  // Add home as first item
  items.unshift({
    '@type': 'ListItem',
    position: 0,
    name: 'Home',
    item: baseUrl,
  })

  // Re-number positions
  items.forEach((item, index) => {
    item.position = index + 1
  })

  return createSchema('BreadcrumbList', {
    itemListElement: items,
  })
}

export default ManagedSchema
