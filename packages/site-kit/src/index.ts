/**
 * @uptrade/site-kit - Main Entry Point
 * 
 * Unified package for all Uptrade client-side integrations.
 * All API calls go through Portal API with API key auth - never Supabase directly.
 * 
 * **Recommended: Server-First Architecture**
 * 
 * Most Site-Kit components are server components and work without a provider:
 * 
 * @example
 * ```tsx
 * // Server components (SEO, Images, Blog) - no provider needed
 * import { ManagedFavicon } from '@uptrade/site-kit/images'
 * import { ManagedMetadata } from '@uptrade/site-kit/seo'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <head>
 *         <ManagedFavicon />
 *       </head>
 *       <body>{children}</body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * **For client-side modules** (Analytics, Engage), use individual providers:
 * 
 * @example
 * ```tsx
 * import { AnalyticsProvider } from '@uptrade/site-kit/analytics'
 * 
 * export default function ClientLayout({ children }) {
 *   return (
 *     <AnalyticsProvider
 *       apiKey={process.env.NEXT_PUBLIC_UPTRADE_API_KEY}
 *       apiUrl={process.env.NEXT_PUBLIC_UPTRADE_API_URL}
 *     >
 *       {children}
 *     </AnalyticsProvider>
 *   )
 * }
 * ```
 * 
 * **SiteKitProvider is deprecated** - use individual components/providers instead.
 */

// Main Provider
export { SiteKitProvider, useSiteKit } from './SiteKitProvider'
export type { SiteKitConfig } from './types'

// Re-export module types for convenience
export type { ManagedMetadataResult, ManagedSchemaProps, ManagedFAQData } from './seo/types'
export type { AnalyticsConfig, AnalyticsEvent, PageView } from './analytics/types'
export type { EngageElement, WidgetConfig, ChatConfig } from './engage/types'
export type { ManagedFormConfig, FormSubmission, FormField } from './forms/types'
export type { BlogPost as BlogPostType, BlogAuthor, BlogCategory } from './blog/types'
export type { 
  CommerceOffering, 
  CommerceCategory, 
  CommerceVariant, 
  CommerceSchedule,
  OfferingType,
  Cart,
  CartItem,
} from './commerce/types'

// Commerce module exports
export {
  // Components
  OfferingCard,
  OfferingList,
  EventTile,
  UpcomingEvents,
  ProductEmbed,
  EventEmbed,
  CheckoutForm,
  RegistrationForm,
  CalendarView,
  EventModal,
  EventCalendar,
  // Hooks
  useEventModal,
  // API functions
  fetchOfferings,
  fetchOffering,
  fetchProducts,
  fetchServices,
  fetchUpcomingEvents,
  fetchNextEvent,
  createCheckoutSession,
  registerForEvent,
  // Utils
  formatPrice,
  formatDate,
  formatDateTime,
  getOfferingUrl,
} from './commerce'

// Affiliates module exports
export {
  // Components
  AffiliatesWidget,
  AffiliateCard,
  // Hooks
  useAffiliates,
  // API functions
  fetchAffiliates,
  getTrackingUrl,
} from './affiliates'
export type {
  Affiliate,
  AffiliateOffer,
  AffiliateWithOffers,
  AffiliatesWidgetProps,
  AffiliateCardProps,
  UseAffiliatesResult,
} from './affiliates'

// Redirects module exports
export {
  handleManagedRedirects,
  fetchRedirectRules,
  generateNextRedirects,
  clearRedirectCache,
} from './redirects'
export type { RedirectRule, RedirectConfig } from './redirects'

// Images module exports
export {
  ManagedImage,
  fetchManagedImage,
  fetchManagedImages,
  listImageFiles,
  uploadImage,
  assignImageToSlot,
  clearImageSlot,
} from './images'
export type { 
  ManagedImageProps, 
  ManagedImageData, 
  ImageFile,
  ImageApiConfig,
} from './images'

// Note: Pages are auto-discovered via site-kit page views
// No manual registration needed - SEO metadata is extracted and sent on every page load

// Signal AI module exports
export {
  SignalBridge,
  useSignal,
  useSignalConfig,
  useSignalEvent,
  useSignalOutcome,
  useSignalExperiment,
  SignalExperiment,
  useExperimentVariant,
  ExperimentConversion,
} from './signal'
export type {
  SignalConfig,
  SignalEvent,
  SignalOutcome,
  SignalContextValue,
  SignalBridgeProps,
  ExperimentConfig,
  ExperimentVariant,
  ExperimentAssignment,
  EngageOverride,
  MetaOverride,
  PriceOverride,
} from './signal'

// Setup module exports
export { SetupWizard } from './setup/SetupWizard'
export { SetupAssistant } from './setup/SetupAssistant'

// Reputation module exports
export {
  TestimonialSection,
  fetchReviews,
  fetchReviewStats,
} from './reputation'
export type {
  Review,
  ReviewStats,
  TestimonialSectionProps,
} from './reputation'

// Sync module exports (Booking Widget)
export {
  BookingWidget,
  fetchBookingTypes,
  fetchBookingTypeDetails,
  fetchAvailability,
  fetchAvailableDates,
  createSlotHold,
  releaseSlotHold,
  createBooking,
  detectTimezone,
  formatTime as formatBookingTime,
  formatDate as formatBookingDate,
  formatDuration,
} from './sync'
export type {
  BookingType,
  TimeSlot,
  Host,
  SlotHold,
  BookingResult,
  BookingWidgetProps,
  GuestInfo,
  SyncWidgetConfig,
} from './sync'

// LLM Visibility module exports (Answer Engine Optimization / Sonor AI Visibility)
export {
  // llms.txt generation
  generateLLMsTxt,
  generateLLMsFullTxt,
  createLLMsTxtHandler,
  createLLMsFullTxtHandler,
  // Speakable schema
  SpeakableSchema,
  createSpeakableSchema,
  getSpeakableSelectorsForPage,
  DEFAULT_SPEAKABLE_SELECTORS,
  // AEO Components (Sonor AI Visibility)
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
  // API functions
  getLLMsData,
  getBusinessInfo,
  getServices as getLLMServices,
  getFAQItems as getLLMFAQItems,
  getPageSummaries,
} from './llms'
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
} from './llms'
