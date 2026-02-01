/**
 * @uptrade/site-kit/llms - Types
 * 
 * LLM Visibility Types for Answer Engine Optimization (AEO)
 */

// ============================================
// Core LLM Content Types
// ============================================

export interface LLMBusinessInfo {
  /** Business/organization name */
  name: string
  /** One-line tagline or mission */
  tagline?: string
  /** Longer description (1-3 paragraphs) */
  description: string
  /** Industry/category */
  industry?: string
  /** Primary service area (city, region, or "nationwide") */
  service_area?: string
  /** Year established */
  founded?: string
  /** Website URL */
  website: string
}

export interface LLMContactInfo {
  /** Primary phone */
  phone?: string
  /** Primary email */
  email?: string
  /** Street address */
  address?: string
  /** City */
  city?: string
  /** State/province */
  state?: string
  /** ZIP/postal code */
  postal_code?: string
  /** Country */
  country?: string
  /** Business hours (e.g., "Mon-Fri 9am-5pm EST") */
  hours?: string
}

export interface LLMService {
  /** Service name */
  name: string
  /** Brief description */
  description: string
  /** URL path to service page */
  url?: string
}

export interface LLMFAQItem {
  /** Question */
  question: string
  /** Answer */
  answer: string
}

export interface LLMPageSummary {
  /** Page path */
  path: string
  /** Page title */
  title: string
  /** Brief description of page content */
  description?: string
}

// ============================================
// llms.txt Generation Options
// ============================================

export interface GenerateLLMSTxtOptions {
  /** Project ID for fetching data (optional - uses API key's project) */
  projectId?: string
  /** Include business info section */
  includeBusinessInfo?: boolean
  /** Include services list */
  includeServices?: boolean
  /** Include FAQ section */
  includeFAQ?: boolean
  /** Include page index */
  includePages?: boolean
  /** Include contact info */
  includeContact?: boolean
  /** Maximum number of FAQ items */
  maxFAQItems?: number
  /** Maximum number of pages to list */
  maxPages?: number
  /** Custom sections to append */
  customSections?: Array<{
    title: string
    content: string
  }>
}

export interface LLMSTxtContent {
  /** Raw markdown content */
  markdown: string
  /** Metadata about generation */
  metadata: {
    generated_at: string
    project_id: string
    sections: string[]
  }
}

// ============================================
// Speakable Schema Types
// ============================================

export interface SpeakableConfig {
  /** CSS selectors for speakable content */
  cssSelectors?: string[]
  /** XPath selectors for speakable content */
  xPaths?: string[]
}

export interface SpeakableSchemaProps {
  /** Page type - Article or WebPage */
  type: 'Article' | 'WebPage'
  /** Page name/title */
  name: string
  /** Page URL */
  url: string
  /** Speakable content selectors */
  speakable: SpeakableConfig
  /** Additional schema properties */
  additionalProperties?: Record<string, unknown>
}

// ============================================
// AEO Block Component Types
// ============================================

export interface AEOBlockProps {
  /** Block ID for speakable reference */
  id?: string
  /** Type of content block */
  type: 'summary' | 'definition' | 'answer' | 'list' | 'steps' | 'comparison'
  /** Optional question (for Q&A format) */
  question?: string
  /** Whether to mark as speakable */
  speakable?: boolean
  /** Entity ID for knowledge graph linking */
  entityId?: string
  /** Children content */
  children: React.ReactNode
  /** Optional CSS class */
  className?: string
}

export interface AEOSummaryProps {
  /** Title for the summary */
  title?: string
  /** Key points to highlight */
  points: string[]
  /** Whether to mark as speakable */
  speakable?: boolean
  /** Entity ID for knowledge graph linking */
  entityId?: string
  /** Optional CSS class */
  className?: string
}

export interface AEODefinitionProps {
  /** Term being defined */
  term: string
  /** Definition */
  definition: string
  /** Whether to mark as speakable */
  speakable?: boolean
  /** Entity ID for knowledge graph linking */
  entityId?: string
  /** Source for the definition (e.g., statute code) */
  source?: string
  /** Optional CSS class */
  className?: string
}

/**
 * AEOClaimProps - AI-Verifiable Claim with Provenance
 * 
 * For wrapping factual claims with machine-readable source attribution.
 * LLMs heavily favor content with verifiable sources and confidence scores.
 */
export interface AEOClaimProps {
  /** Source reference (e.g., "KRS 281A.170", "NIH Study 2024") */
  source: string
  /** URL to source document */
  sourceUrl?: string
  /** Confidence score 0-1 */
  confidence?: number
  /** Type of claim */
  claimType?: 'fact' | 'statute' | 'study' | 'quote' | 'statistic'
  /** When the source was retrieved */
  retrievedAt?: string
  /** Children content */
  children: React.ReactNode
  /** Optional CSS class */
  className?: string
}

/**
 * AEOEntityProps - Inline Entity Annotation
 * 
 * For annotating entity mentions with knowledge graph IDs.
 */
export interface AEOEntityProps {
  /** Entity ID from knowledge graph */
  entityId: string
  /** Entity type */
  entityType: 'organization' | 'person' | 'service' | 'product' | 'location' | 'concept' | 'credential'
  /** Canonical entity name */
  name: string
  /** Entity URL */
  url?: string
  /** Children content */
  children: React.ReactNode
  /** Optional CSS class */
  className?: string
}

// ============================================
// Content Provenance Types
// ============================================

/**
 * ContentProvenance - Source attribution for content
 * 
 * Links content to authoritative sources for AI verification.
 */
export interface ContentProvenance {
  /** Unique provenance ID */
  id: string
  /** Type of source */
  source_type: 'press_release' | 'news_article' | 'legal_statute' | 'research_paper' | 'official_document' | 'internal' | 'citation'
  /** Source title */
  title: string
  /** Source URL */
  url?: string
  /** Publisher/organization name */
  publisher?: string
  /** Publication date */
  published_at?: string
  /** Date accessed */
  accessed_at?: string
  /** Brief excerpt or summary */
  excerpt?: string
  /** Confidence score 0-1 */
  confidence?: number
  /** DOI or other identifier */
  identifier?: string
}

/**
 * AEOProvenanceListProps - Display provenance sources
 */
export interface AEOProvenanceListProps {
  /** List of provenance sources */
  sources: ContentProvenance[]
  /** Title for the section */
  title?: string
  /** Optional CSS class */
  className?: string
}

/**
 * AEOCitedContentProps - Content with inline citations
 * 
 * Wraps content that has numbered citations referencing provenance sources.
 */
export interface AEOCitedContentProps {
  /** Content with [1], [2] style inline citations */
  children: React.ReactNode
  /** Provenance sources (index matches citation number) */
  sources: ContentProvenance[]
  /** Whether to show sources list at bottom */
  showSourcesList?: boolean
  /** Optional CSS class */
  className?: string
}

// ============================================
// API Response Types
// ============================================

export interface LLMsDataResponse {
  business: LLMBusinessInfo
  contact?: LLMContactInfo
  services: LLMService[]
  faq: LLMFAQItem[]
  pages: LLMPageSummary[]
}
