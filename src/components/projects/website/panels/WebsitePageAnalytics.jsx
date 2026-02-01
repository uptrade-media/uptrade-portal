/**
 * WebsitePageAnalytics - Read-only page-level traffic (views by day/hour).
 */
import { useMemo } from 'react'
import { BarChart3, Loader2, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePageViewsByDay, usePageViewsByHour } from '@/lib/hooks'

const DAYS = 30

export default function WebsitePageAnalytics({ projectId, selectedPage }) {
  const pagePath = selectedPage?.path ?? (selectedPage?.url ? new URL(selectedPage.url, 'https://x').pathname : '') ?? ''
  const { data: byDay = [], isLoading: loadingDay } = usePageViewsByDay(projectId, DAYS, {
    path: pagePath || undefined,
    enabled: !!projectId && !!pagePath,
  })
  const { data: byHour = [], isLoading: loadingHour } = usePageViewsByHour(projectId, DAYS, {
    path: pagePath || undefined,
    enabled: !!projectId && !!pagePath,
  })

  const totalViews = useMemo(() => {
    const list = Array.isArray(byDay) ? byDay : []
    return list.reduce((sum, d) => sum + (Number(d.views) || 0), 0)
  }, [byDay])

  const maxByDay = useMemo(() => {
    const list = Array.isArray(byDay) ? byDay : []
    return Math.max(...list.map((d) => Number(d.views) || 0), 1)
  }, [byDay])

  if (!projectId || !pagePath) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No page selected or no path available.
        </CardContent>
      </Card>
    )
  }

  if (loadingDay) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Page views (last {DAYS} days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <span className="text-muted-foreground text-sm">total views</span>
          </div>
          {Array.isArray(byDay) && byDay.length > 0 ? (
            <div className="space-y-1">
              <div className="flex gap-0.5 items-end h-20">
                {byDay.slice(-30).map((d, i) => (
                  <div
                    key={d.date || i}
                    className="flex-1 bg-primary/60 rounded-t min-w-0 hover:bg-primary transition-colors"
                    style={{
                      height: `${Math.max(((Number(d.views) || 0) / maxByDay) * 100, 2)}%`,
                    }}
                    title={`${d.date}: ${Number(d.views) || 0} views`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{byDay[0]?.date}</span>
                <span>{byDay[byDay.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No view data for this path yet.</p>
          )}
        </CardContent>
      </Card>
      {loadingHour ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Views by hour (last {DAYS} days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(byHour) && byHour.length > 0 ? (
              <div className="flex gap-0.5 items-end h-24">
                {byHour.map((h, i) => (
                  <div
                    key={h.hour ?? i}
                    className="flex-1 bg-muted hover:bg-primary/30 rounded-t min-w-0 transition-colors"
                    style={{
                      height: `${Math.max(((Number(h.views) || 0) / (Math.max(...byHour.map((x) => Number(x.views) || 0)) || 1)) * 100, 4)}%`,
                    }}
                    title={`Hour ${h.hour}: ${Number(h.views) || 0} views`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hourly data for this path yet.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
