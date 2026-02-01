import { Skeleton } from '@/components/ui/skeleton'

/**
 * ListSkeleton - Placeholder for list views during loading
 * @param {number} items - Number of skeleton list items
 * @param {boolean} showAvatar - Whether each item has an avatar
 */
export function ListSkeleton({ items = 5, showAvatar = true }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          {showAvatar && (
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          )}
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
