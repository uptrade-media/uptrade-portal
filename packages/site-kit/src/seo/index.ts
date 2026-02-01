// @uptrade/seo - Main entry point
// React Server Components and utilities for managed SEO

// ============================================
// Types
// ============================================
export type {
  UptradeSEOConfig,
  SEOPageData,
  GetManagedMetadataOptions,
  ManagedMetadataResult,
  SchemaMarkup,
  ManagedSchemaProps,
  FAQItem,
  ManagedFAQData,
  ManagedFAQProps,
  ManagedLink,
  ManagedInternalLinksProps,
  ManagedContentBlock,
  ManagedContentProps,
  ABTest,
  ABTestResult,
  GetABVariantOptions,
  ManagedRedirect,
  GetRedirectOptions,
  RedirectResult,
  ManagedScript,
  ManagedScriptsProps,
  RobotsDirective,
  GetRobotsOptions,
  SitemapEntry,
  GetSitemapEntriesOptions,
} from './types'

// Entity Graph types
export type {
  EntityType,
  SEOEntity,
} from './server-api'

// ============================================
// Metadata Functions
// ============================================
export { 
  getManagedMetadata,
  getManagedMetadataWithAB,
  getABVariant,
} from './getManagedMetadata'

// ============================================
// Routing Functions
// ============================================
export {
  getRedirect,
  getRobotsDirective,
  generateSitemap,
  isIndexable,
} from './routing'

// ============================================
// Server-Side API Functions (Secure)
// ============================================
// These use private env vars and are safe for server-side use
export {
  getSEOPageData,
  getSchemaMarkups,
  getFAQData,
  getInternalLinks,
  getContentBlock,
  getABTest,
  recordABImpression,
  getRedirectData,
  getManagedScripts,
  getRobotsData,
  getSitemapEntries,
  registerSitemap,
  // Entity Graph & AI Visibility
  getEntities,
  getPrimaryEntity,
  getEntityEnhancedSchema,
  getVisibilityScore,
  getVisibilitySummary,
} from './server-api'

// ============================================
// React Server Components
// ============================================
export { ManagedSchema, createSchema, createBreadcrumbSchema } from './ManagedSchema'
export { ManagedFAQ } from './ManagedFAQ'
export { ManagedInternalLinks } from './ManagedInternalLinks'
export { ManagedContent, getManagedContentData } from './ManagedContent'
export { ManagedScripts, ManagedNoScripts } from './ManagedScripts'
export { 
  LocationPageContent, 
  getLocationSection,
  type LocationPageContentProps,
  type LocationSectionData,
  type LocationHeroContent,
  type LocationServicesContent,
  type LocationTextContent,
} from './LocationPageContent'

// ============================================
// Client Components
// ============================================
export { SitemapSync } from './SitemapSync'

// ============================================
// Default exports for convenience
// ============================================
export { ManagedSchema as default } from './ManagedSchema'
