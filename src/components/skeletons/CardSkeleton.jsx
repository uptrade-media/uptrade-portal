import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

/**
 * CardSkeleton - Placeholder for card components during loading
 * @param {boolean} showHeader - Whether to show header area
 * @param {number} contentLines - Number of content skeleton lines
 */
export function CardSkeleton({ showHeader = true, contentLines = 3 }) {
  return (
    <Card className="bg-[var(--glass-bg)] backdrop-blur-sm border-[var(--glass-border)]">
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
      )}
      <CardContent className={showHeader ? '' : 'pt-6'}>
        <div className="space-y-2">
          {Array.from({ length: contentLines }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4"
              style={{ width: i === contentLines - 1 ? '75%' : '100%' }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
