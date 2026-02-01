/**
 * SEO Module TypeScript Types
 * 
 * Comprehensive type definitions for the SEO module.
 * Provides type safety across components, hooks, and API calls.
 */

// ============================================
// Base Types
// ============================================

export type UUID = string

export type PageStatus = 'active' | 'draft' | 'inactive' | 'archived'
export type OpportunityStatus = 'open' | 'in_progress' | 'applied' | 'dismissed'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type OpportunityType = 'technical' | 'content' | 'metadata' | 'links' | 'schema' | 'indexing'
export type ChangeType = 'metadata' | 'schema' | 'redirect' | 'faq' | 'content' | 'links'

// ============================================
// SEO Project
// ============================================

export interface SeoProject {
  id: UUID
  org_id: UUID
  domain: string
  name?: string
  industry?: string
  target_audience?: string
  gsc_property?: string
  gsc_connected: boolean
  analytics_connected: boolean
  health_score?: number
  total_pages?: number
  total_opportunities?: number
  created_at: string
  updated_at: string
}

// ============================================
// SEO Page
// ============================================

export interface SeoPage {
  id: UUID
  project_id: UUID
  url: string
  path: string
  title?: string
  meta_description?: string
  h1?: string
  
  // Managed fields (Signal-optimized)
  managed_title?: string
  managed_description?: string
  managed_robots?: string
  
  // Optimization tracking
  optimization_reason?: string
  predicted_position?: number
  confidence_score?: number
  previous_title?: string
  previous_description?: string
  last_optimized_at?: string
  last_optimized_by?: UUID
  
  // Metadata
  page_type?: string
  canonical?: string
  status: PageStatus
  word_count?: number
  health_score?: number
  
  // Metrics
  impressions_28d?: number
  clicks_28d?: number
  ctr_28d?: number
  position_avg?: number
  
  created_at: string
  updated_at: string
}

export interface SeoPageListResponse {
  pages: SeoPage[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// SEO Opportunity
// ============================================

export interface SeoOpportunity {
  id: UUID
  project_id: UUID
  page_id?: UUID
  type: OpportunityType
  title: string
  description: string
  priority: Priority
  status: OpportunityStatus
  
  // Impact estimates
  estimated_impact?: string
  estimated_position_change?: number
  estimated_traffic_increase?: number
  
  // Implementation
  fix_suggestion?: string
  automated_fix_available: boolean
  
  // Tracking
  applied_at?: string
  applied_by?: UUID
  dismissed_at?: string
  dismissed_by?: UUID
  created_by?: UUID
  
  created_at: string
  updated_at: string
}

export interface SeoOpportunityListResponse {
  opportunities: SeoOpportunity[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SeoOpportunitySummary {
  total: number
  byType: Record<OpportunityType, number>
  byPriority: Record<Priority, number>
  byStatus: Record<OpportunityStatus, number>
  estimatedTotalImpact?: number
}

// ============================================
// Google Search Console
// ============================================

export interface GscOverview {
  totalClicks: number
  totalImpressions: number
  averageCtr: number
  averagePosition: number
  period: {
    startDate: string
    endDate: string
  }
  change?: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
}

export interface GscQuery {
  id?: UUID
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  is_tracked?: boolean
  page_id?: UUID
}

export interface GscPage {
  url: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface TrackedQuery extends GscQuery {
  id: UUID
  project_id: UUID
  is_tracked: true
  target_position?: number
  notes?: string
  created_at: string
}

// ============================================
// Change Tracking
// ============================================

export interface SeoChangeTracking {
  id: UUID
  project_id: UUID
  page_id?: UUID
  change_type: ChangeType
  change_details: Record<string, any>
  before_state?: Record<string, any>
  after_state?: Record<string, any>
  deployed_at: string
  
  // Prediction
  predicted_position?: number
  predicted_confidence?: number
  
  // Actual outcome
  actual_position_before?: number
  actual_position_after?: number
  actual_position_change?: number
  prediction_accuracy?: number
  measurement_date?: string
  
  // Traffic impact
  clicks_before?: number
  clicks_after?: number
  impressions_before?: number
  impressions_after?: number
  ctr_before?: number
  ctr_after?: number
  
  created_by?: UUID
  source?: 'signal' | 'manual' | 'import'
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================
// A/B Testing
// ============================================

export interface SeoPageVariant {
  id: UUID
  page_id: UUID
  variant_name: string // 'a', 'b', 'c', 'control'
  
  // Variant content
  title?: string
  description?: string
  h1?: string
  content_changes?: Record<string, any>
  
  // Test configuration
  traffic_percentage: number
  test_starts_at?: string
  test_ends_at?: string
  status: 'active' | 'paused' | 'completed' | 'winner'
  
  // Performance metrics
  impressions: number
  clicks: number
  ctr?: number
  position_avg?: number
  conversions?: number
  conversion_rate?: number
  
  // Statistical significance
  confidence_level?: number // 0-100
  p_value?: number
  
  created_at: string
  updated_at: string
}

// ============================================
// Internal Links
// ============================================

export interface SeoManagedLink {
  id: UUID
  project_id: UUID
  from_page_id: UUID
  to_page_id: UUID
  
  // Link details
  anchor_text: string
  context?: string
  position: 'inline' | 'sidebar' | 'related' | 'footer'
  link_type: 'contextual' | 'navigational' | 'related'
  
  // Placement
  paragraph_index?: number
  sentence_index?: number
  placement_rules?: Record<string, any>
  
  // Metadata
  source: 'signal' | 'manual'
  reasoning?: string
  target_keyword?: string
  status: 'active' | 'pending' | 'archived'
  deployed_at?: string
  
  created_at: string
  updated_at: string
}

// ============================================
// Schema Markup
// ============================================

export interface SeoSchemaMarkup {
  id: UUID
  page_id: UUID
  schema_type: string
  schema_json: Record<string, any>
  source: 'signal' | 'manual'
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================
// Alerts & Issues
// ============================================

export interface SeoAlert {
  id: UUID
  project_id: UUID
  alert_type: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  is_read: boolean
  is_dismissed: boolean
  action_url?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface SeoIssue {
  id: UUID
  project_id: UUID
  page_id?: UUID
  issue_type: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved' | 'wontfix'
  fix_suggestion?: string
  resolved_at?: string
  resolved_by?: UUID
  created_at: string
  updated_at: string
}

// ============================================
// Competitors
// ============================================

export interface SeoCompetitor {
  id: UUID
  project_id: UUID
  domain: string
  name?: string
  is_primary_competitor: boolean
  health_score?: number
  created_at: string
  updated_at: string
}

// ============================================
// Backlinks
// ============================================

export interface SeoBacklink {
  id: UUID
  project_id: UUID
  source_url: string
  target_url: string
  anchor_text?: string
  domain_authority?: number
  page_authority?: number
  discovered_at: string
  status: 'active' | 'lost' | 'broken'
  last_checked_at?: string
}

// ============================================
// Local SEO
// ============================================

export interface SeoLocalEntity {
  id: UUID
  project_id: UUID
  gbp_id?: string
  business_name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  website?: string
  category?: string
  rating?: number
  review_count?: number
  health_score?: number
  created_at: string
  updated_at: string
}

// ============================================
// API Request/Response Types
// ============================================

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DateRangeParams {
  startDate?: string
  endDate?: string
}

export interface SeoPageListParams extends PaginationParams {
  status?: PageStatus
  search?: string
  pageType?: string
}

export interface SeoOpportunityListParams extends PaginationParams {
  type?: OpportunityType
  status?: OpportunityStatus
  priority?: Priority
  pageId?: UUID
}

export interface GscQueryParams extends DateRangeParams {
  limit?: number
  minPosition?: number
  maxPosition?: number
}

// ============================================
// Component Props
// ============================================

export interface SeoProjectSelectorProps {
  orgId: string
  value?: UUID
  onChange: (projectId: UUID) => void
  disabled?: boolean
}

export interface SeoPageListProps {
  projectId: UUID
  filters?: SeoPageListParams
  onPageClick?: (page: SeoPage) => void
}

export interface SeoOpportunityListProps {
  projectId: UUID
  filters?: SeoOpportunityListParams
  onApply?: (opportunity: SeoOpportunity) => void
  onDismiss?: (opportunity: SeoOpportunity) => void
}

// ============================================
// Form Data Types
// ============================================

export interface CreateSeoPageData {
  url: string
  path: string
  title?: string
  meta_description?: string
  h1?: string
  page_type?: string
  canonical?: string
  status: PageStatus
}

export interface UpdateSeoPageData {
  title?: string
  meta_description?: string
  h1?: string
  managed_title?: string
  managed_description?: string
  managed_robots?: string
  canonical?: string
  status?: PageStatus
  page_type?: string
}

export interface CreateOpportunityData {
  page_id?: UUID
  type: OpportunityType
  title: string
  description: string
  priority: Priority
  fix_suggestion?: string
  automated_fix_available?: boolean
  estimated_impact?: string
}

export interface UpdateOpportunityData {
  title?: string
  description?: string
  priority?: Priority
  status?: OpportunityStatus
  fix_suggestion?: string
}

export interface TrackQueriesData {
  queries: string[]
}

export interface BulkUpdateData {
  ids: UUID[]
  updates: Record<string, any>
}

// ============================================
// Signal AI Types
// ============================================

export interface SeoRecommendation {
  id: UUID
  project_id: UUID
  page_id?: UUID
  recommendation_type: string
  title: string
  description: string
  before_value?: string
  after_value?: string
  reasoning: string
  predicted_impact?: string
  confidence_score?: number
  status: 'pending' | 'applied' | 'rejected'
  created_at: string
}

export interface MetadataOptimizationResult {
  title: string
  description: string
  reasoning: string
  predicted_position?: number
  confidence?: number
  serp_preview?: {
    title: string
    description: string
    url: string
  }
}

export interface SchemaGenerationResult {
  schema_type: string
  schema_data: Record<string, any>
  validation: {
    isValid: boolean
    errors?: string[]
  }
}

export interface FAQGenerationResult {
  items: Array<{
    question: string
    answer: string
    source?: string
  }>
  schema?: Record<string, any>
}

// ============================================
// Analytics Types
// ============================================

export interface SeoTrend {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SeoMetrics {
  current: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  previous: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  change: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  trends: SeoTrend[]
}

// ============================================
// Entity Graph (AI Visibility)
// ============================================

export type EntityType = 
  | 'organization'
  | 'person'
  | 'service'
  | 'product'
  | 'location'
  | 'concept'
  | 'credential'

export interface SeoEntity {
  id: UUID
  project_id: UUID
  entity_type: EntityType
  name: string
  slug: string
  properties: Record<string, unknown>
  knows_about: string[]
  same_as: string[]
  schema_type?: string
  is_primary: boolean
}

export interface AIVisibilityScore {
  overall_score: number
  entity_coverage: number
  answer_density: number
  chunk_readability: number
  authority_signals: number
  schema_completeness: number
  page_path: string
}

// ============================================
// Error Types
// ============================================

export interface SeoError {
  message: string
  code?: string
  field?: string
  details?: Record<string, any>
}

export interface ApiErrorResponse {
  statusCode: number
  message: string | string[]
  error?: string
}

// ============================================
// Filter & Sort Types
// ============================================

export interface SeoFilters {
  status?: PageStatus | OpportunityStatus
  type?: OpportunityType
  priority?: Priority
  search?: string
  dateRange?: DateRangeParams
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}

// ============================================
// UI State Types
// ============================================

export interface SeoViewState {
  selectedProjectId?: UUID
  selectedPageId?: UUID
  selectedOpportunityId?: UUID
  filters: SeoFilters
  sort?: SortConfig
  view: 'dashboard' | 'pages' | 'opportunities' | 'keywords' | 'technical' | 'local'
  subView?: string
}

export interface SeoLoadingState {
  projects: boolean
  pages: boolean
  opportunities: boolean
  gsc: boolean
  [key: string]: boolean
}

export interface SeoErrorState {
  projects?: SeoError
  pages?: SeoError
  opportunities?: SeoError
  gsc?: SeoError
  [key: string]: SeoError | undefined
}

// ============================================
// Utility Types
// ============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

// ============================================
// Hook Return Types
// ============================================

export interface UseQueryResult<T> {
  data: T | undefined
  isLoading: boolean
  isError: boolean
  error: SeoError | null
  refetch: () => void
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => void
  mutateAsync: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  error: SeoError | null
  reset: () => void
}
