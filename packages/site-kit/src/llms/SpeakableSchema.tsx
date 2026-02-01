/**
 * @uptrade/site-kit/llms - Speakable Schema Generator
 * 
 * Generates JSON-LD with SpeakableSpecification for voice assistant
 * and AI system content extraction.
 * 
 * @see https://schema.org/speakable
 * @see https://developers.google.com/search/docs/appearance/structured-data/speakable
 */

import * as React from 'react'
import type { SpeakableSchemaProps, SpeakableConfig } from './types'

/**
 * Generate a WebPage or Article schema with speakable specification
 * 
 * @example
 * ```tsx
 * // In a page component
 * <SpeakableSchema
 *   type="Article"
 *   name="Family Law Services in Cincinnati"
 *   url="https://heinrichlaw.com/family-law"
 *   speakable={{
 *     cssSelectors: ['.page-summary', '.key-points', 'h1']
 *   }}
 * />
 * ```
 */
export function SpeakableSchema({
  type,
  name,
  url,
  speakable,
  additionalProperties = {},
}: SpeakableSchemaProps): React.ReactElement {
  const schema = createSpeakableSchema(type, name, url, speakable, additionalProperties)
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 0),
      }}
    />
  )
}

/**
 * Create speakable schema object (for manual use or testing)
 */
export function createSpeakableSchema(
  type: 'Article' | 'WebPage',
  name: string,
  url: string,
  speakable: SpeakableConfig,
  additionalProperties: Record<string, unknown> = {}
): Record<string, unknown> {
  const speakableSpec: Record<string, unknown> = {
    '@type': 'SpeakableSpecification',
  }

  // Prefer CSS selectors, fall back to XPath
  if (speakable.cssSelectors?.length) {
    speakableSpec.cssSelector = speakable.cssSelectors
  } else if (speakable.xPaths?.length) {
    speakableSpec.xpath = speakable.xPaths
  } else {
    // Default speakable selectors for common patterns
    speakableSpec.cssSelector = [
      'h1',
      '[data-speakable]',
      '.page-summary',
      '.key-points',
      'meta[name="description"]'
    ]
  }

  return {
    '@context': 'https://schema.org',
    '@type': type,
    name,
    url,
    speakable: speakableSpec,
    ...additionalProperties,
  }
}

/**
 * Default speakable CSS selectors for common page elements
 */
export const DEFAULT_SPEAKABLE_SELECTORS = {
  /** Standard page elements */
  page: ['h1', 'meta[name="description"]', '.page-summary'],
  /** Article/blog post elements */
  article: ['h1', '.article-summary', '.article-intro', 'meta[name="description"]'],
  /** Service page elements */
  service: ['h1', '.service-overview', '.key-benefits', 'meta[name="description"]'],
  /** FAQ page elements */
  faq: ['h1', '.faq-intro', '.faq-item'],
  /** Contact page elements */
  contact: ['h1', '.contact-intro', '.business-hours', '.contact-info'],
}

/**
 * Get recommended speakable selectors for a page type
 */
export function getSpeakableSelectorsForPage(
  pageType: 'page' | 'article' | 'service' | 'faq' | 'contact'
): string[] {
  return DEFAULT_SPEAKABLE_SELECTORS[pageType] || DEFAULT_SPEAKABLE_SELECTORS.page
}

export default SpeakableSchema
