// src/hooks/useBroadcastInsights.js
// Hook to fetch real-time platform insights for post composers
import { useState, useEffect, useCallback } from 'react';
import { broadcastApi } from '@/lib/api/broadcast';

/**
 * Hook to fetch platform-specific insights for post/reel/story composers
 * 
 * Returns:
 * - peak_times: Best times to post based on audience activity
 * - top_formats: Top performing content formats from historical data
 * - trending_topics: Trending hashtags from Google Trends
 * - trending_hooks: Viral content hooks from our database
 * - source: 'live' | 'cache' | 'fallback'
 * - isLoading: Boolean
 * - error: Error message if any
 * - refetch: Function to manually refresh data
 */
export function useBroadcastInsights(projectId, platform) {
  const [insights, setInsights] = useState({
    peak_times: [],
    top_formats: [],
    trending_topics: [],
    trending_hooks: [],
    source: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = useCallback(async () => {
    if (!projectId || !platform) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await broadcastApi.getComposerInsights(projectId, platform);
      const data = response.data || response;

      setInsights({
        peak_times: data.peak_times || [],
        top_formats: data.top_formats || [],
        trending_topics: data.trending_topics || [],
        trending_hooks: data.trending_hooks || [],
        source: data.source || 'fallback',
      });
    } catch (err) {
      console.error('[useBroadcastInsights] Error fetching insights:', err);
      setError(err.message || 'Failed to fetch insights');
      
      // Keep existing data on error (don't clear it)
    } finally {
      setIsLoading(false);
    }
  }, [projectId, platform]);

  // Fetch when platform changes
  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    ...insights,
    isLoading,
    error,
    refetch: fetchInsights,
  };
}

/**
 * Transform insights data to match existing component expectations
 * 
 * The existing components expect:
 * - platformHooks: Array of { hook: string, uses: string, engagement: string }
 * - platformFormats: Array of { format: string, engagement: string, description: string }
 * - platformTopics: Array of strings like '#Hashtag'
 * - platformTimes: Array of { time: string, engagement: string }
 */
export function transformInsightsForComponent(insights) {
  return {
    platformHooks: insights.trending_hooks?.map(h => ({
      hook: h.hook,
      uses: h.uses || '0',
      engagement: h.engagement || '+0%',
    })) || [],
    
    platformFormats: insights.top_formats?.map(f => ({
      format: f.format,
      engagement: f.engagement || '+0%',
      description: f.description || '',
    })) || [],
    
    platformTopics: insights.trending_topics?.map(t => 
      t.hashtag?.startsWith('#') ? t.hashtag : `#${t.hashtag || t}`
    ) || [],
    
    platformTimes: insights.peak_times?.map(t => ({
      time: t.time,
      engagement: t.engagement || '+0%',
    })) || [],
  };
}

export default useBroadcastInsights;
