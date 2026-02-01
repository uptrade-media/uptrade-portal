/**
 * @uptrade/site-kit/llms - Main Entry Point
 * 
 * LLM Visibility Module for Answer Engine Optimization (AEO)
 * 
 * This module provides tools for optimizing content visibility in:
 * - ChatGPT, Claude, Perplexity, and other AI assistants
 * - Google AI Overviews
 * - Voice assistants (Google Assistant, Alexa, Siri)
 * 
 * Features:
 * - llms.txt generation (per llmstxt.org spec)
 * - Speakable schema markup
 * - AEO-optimized content components
 */

// ============================================
// Types
// ============================================
export type {
  LLMBusinessInfo,
  LLMContactInfo,
  LLMService,
  LLMFAQItem,
  LLMPageSummary,
  GenerateLLMSTxtOptions,
  LLMSTxtContent,
  SpeakableConfig,
  SpeakableSchemaProps,
  AEOBlockProps,
  AEOSummaryProps,
  AEODefinitionProps,
  AEOClaimProps,
  AEOEntityProps,
  ContentProvenance,
  AEOProvenanceListProps,
  AEOCitedContentProps,
  LLMsDataResponse,
} from './types'

// ============================================
// llms.txt Generation
// ============================================
export { 
  generateLLMsTxt, 
  generateLLMsFullTxt 
} from './generateLLMsTxt'

// ============================================
// Route Handlers
// ============================================
export { 
  createLLMsTxtHandler, 
  createLLMsFullTxtHandler 
} from './handlers'

// ============================================
// Speakable Schema
// ============================================
export { 
  SpeakableSchema,
  createSpeakableSchema,
  getSpeakableSelectorsForPage,
  DEFAULT_SPEAKABLE_SELECTORS,
} from './SpeakableSchema'

// ============================================
// AEO Components (Sonor AI Visibility)
// ============================================
export {
  AEOBlock,
  AEOSummary,
  AEODefinition,
  AEOSteps,
  AEOStep,
  AEOComparison,
  AEOClaim,
  AEOEntity,
  AEOProvenanceList,
  AEOCitedContent,
} from './AEOComponents'

// ============================================
// API Functions
// ============================================
export {
  getLLMsData,
  getBusinessInfo,
  getServices,
  getFAQItems,
  getPageSummaries,
} from './api'
