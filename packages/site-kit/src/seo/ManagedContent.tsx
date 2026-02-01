import * as React from 'react'
import { getContentBlock, getEntities, getPrimaryEntity } from './api'
import type { ManagedContentProps, ManagedContentBlock, SEOEntity } from './types'

/**
 * Parse and render markdown content (basic support)
 * For full markdown, use a proper parser in your custom renderer
 */
function renderMarkdown(content: string): string {
  return content
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    // Paragraphs
    .replace(/\n\n/gim, '</p><p>')
    .replace(/^(.+)$/gim, '<p>$1</p>')
}

/**
 * Inject entity annotations into HTML content
 * Wraps entity mentions with data-sonor-entity attributes for knowledge graph linking
 */
function injectEntityAnnotations(html: string, entities: SEOEntity[]): string {
  if (!entities.length) return html
  
  let annotatedHtml = html
  
  // Sort entities by name length (longest first) to avoid partial matches
  const sortedEntities = [...entities].sort((a, b) => b.name.length - a.name.length)
  
  for (const entity of sortedEntities) {
    // Skip very short names to avoid false positives
    if (entity.name.length < 3) continue
    
    // Create case-insensitive regex for entity name
    // Avoid matching inside HTML tags or existing annotations
    const regex = new RegExp(
      `(?<![\\w-])(?<!data-sonor-entity=")${escapeRegExp(entity.name)}(?![\\w-])`,
      'gi'
    )
    
    // Determine schema type for microdata
    const schemaType = getSchemaTypeForEntity(entity.entity_type)
    
    annotatedHtml = annotatedHtml.replace(regex, (match) => {
      return `<span class="aeo-entity aeo-entity-${entity.entity_type}" ` +
        `data-sonor-entity="${entity.id}" ` +
        `data-sonor-entity-type="${entity.entity_type}" ` +
        `data-sonor-entity-name="${entity.name}" ` +
        `itemscope itemtype="https://schema.org/${schemaType}">` +
        `<span itemprop="name">${match}</span></span>`
    })
  }
  
  return annotatedHtml
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getSchemaTypeForEntity(entityType: string): string {
  const typeMap: Record<string, string> = {
    organization: 'Organization',
    person: 'Person',
    service: 'Service',
    product: 'Product',
    location: 'Place',
    concept: 'Thing',
    credential: 'EducationalOccupationalCredential',
  }
  return typeMap[entityType] || 'Thing'
}

/**
 * ManagedContent - Server Component for CMS-controlled content blocks
 * 
 * Fetches content sections from Portal and renders them
 * Supports HTML, Markdown, JSON, and React component references
 * 
 * @example
 * ```tsx
 * // Hero section managed by Portal
 * import { ManagedContent } from '@uptrade/seo'
 * 
 * export default async function ServicePage({ params }) {
 *   return (
 *     <main>
 *       <ManagedContent 
 *         projectId={process.env.UPTRADE_PROJECT_ID!}
 *         path={`/services/${params.slug}`}
 *         section="hero"
 *         fallback={<DefaultHero />}
 *       />
 *       
 *       <ManagedContent 
 *         projectId={process.env.UPTRADE_PROJECT_ID!}
 *         path={`/services/${params.slug}`}
 *         section="features"
 *       />
 *       
 *       <ManagedContent 
 *         projectId={process.env.UPTRADE_PROJECT_ID!}
 *         path={`/services/${params.slug}`}
 *         section="cta"
 *       />
 *     </main>
 *   )
 * }
 * ```
 */
export async function ManagedContent({
  projectId,
  path,
  section,
  fallback,
  className,
  components = {},
  injectEntityAnnotations: shouldInjectEntities = false,
}: ManagedContentProps): Promise<React.ReactElement | null> {
  const block = await getContentBlock(projectId, path, section)

  if (!block) {
    if (fallback) {
      return <>{fallback}</>
    }
    return null
  }

  // Fetch entities if annotation is enabled
  let entities: SEOEntity[] = []
  if (shouldInjectEntities) {
    try {
      entities = await getEntities(projectId) as SEOEntity[]
    } catch (err) {
      console.warn('@uptrade/seo: Failed to fetch entities for annotation:', err)
    }
  }

  const containerClass = className || `uptrade-content uptrade-content--${section}`

  // Helper to process HTML with optional entity injection
  const processHtml = (html: string): string => {
    if (shouldInjectEntities && entities.length > 0) {
      return injectEntityAnnotations(html, entities)
    }
    return html
  }

  // Handle different content types
  switch (block.content_type) {
    case 'html':
      return (
        <div 
          className={containerClass}
          dangerouslySetInnerHTML={{ __html: processHtml(block.content as string) }}
        />
      )

    case 'markdown':
      const htmlContent = processHtml(renderMarkdown(block.content as string))
      return (
        <div 
          className={containerClass}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      )

    case 'json':
      // JSON content for structured data - render as data attributes or custom handling
      const jsonData = typeof block.content === 'string' 
        ? JSON.parse(block.content)
        : block.content

      return (
        <div 
          className={containerClass}
          data-content={JSON.stringify(jsonData)}
        >
          {/* Render JSON structure - customize based on your needs */}
          {jsonData.title && <h2>{jsonData.title}</h2>}
          {jsonData.subtitle && <p className="subtitle">{jsonData.subtitle}</p>}
          {jsonData.content && <div dangerouslySetInnerHTML={{ __html: jsonData.content }} />}
          {jsonData.items && (
            <ul>
              {jsonData.items.map((item: { text: string } | string, index: number) => (
                <li key={index}>{typeof item === 'string' ? item : item.text}</li>
              ))}
            </ul>
          )}
        </div>
      )

    case 'react':
      // React component reference - lookup from provided components map
      const componentData = typeof block.content === 'string'
        ? JSON.parse(block.content)
        : block.content as Record<string, unknown>

      const componentName = componentData.component as string
      const componentProps = componentData.props as Record<string, unknown> || {}

      const Component = components[componentName]
      
      if (!Component) {
        console.warn(`@uptrade/seo: Component "${componentName}" not found in components map`)
        return fallback ? <>{fallback}</> : null
      }

      return (
        <div className={containerClass}>
          <Component {...componentProps} />
        </div>
      )

    default:
      console.warn(`@uptrade/seo: Unknown content type "${block.content_type}"`)
      return fallback ? <>{fallback}</> : null
  }
}

/**
 * Get content block data without rendering
 * 
 * Useful when you need to access the raw data
 */
export async function getManagedContentData(
  projectId: string,
  path: string,
  section: string
): Promise<ManagedContentBlock | null> {
  return getContentBlock(projectId, path, section)
}

export default ManagedContent
