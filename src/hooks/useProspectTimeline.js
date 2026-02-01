/**
 * useProspectTimeline - Hook for fetching and managing prospect timeline
 * Uses React Query for automatic caching and background refresh
 */
import { useCallback } from 'react'
import { useTimeline, useAttribution } from '@/lib/hooks'

export function useProspectTimeline(prospectId, options = {}) {
  const {
    includeAttribution = true,
    ...queryOptions
  } = options
  
  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
    refetch: refetchTimeline
  } = useTimeline(prospectId, { enabled: !!prospectId, ...queryOptions })
  
  const {
    data: attribution,
    isLoading: attributionLoading,
    refetch: refetchAttribution
  } = useAttribution(prospectId, { enabled: !!prospectId && includeAttribution, ...queryOptions })
  
  // Refresh both timeline and attribution
  const refresh = useCallback(() => {
    if (prospectId) {
      refetchTimeline()
      if (includeAttribution) {
        refetchAttribution()
      }
    }
  }, [prospectId, includeAttribution, refetchTimeline, refetchAttribution])
  
  return {
    events: timeline?.events || [],
    isLoading: timelineLoading,
    error: timelineError,
    hasMore: false, // Pagination can be added later if needed
    onLoadMore: () => {}, // Placeholder for backward compatibility
    attribution,
    isLoadingAttribution: attributionLoading,
    refresh
  }
}

export default useProspectTimeline
