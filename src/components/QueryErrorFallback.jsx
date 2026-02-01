/**
 * QueryErrorFallback - Inline error message for failed React Query requests.
 * Use when isError is true: show message + Retry button that calls refetch().
 */
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function QueryErrorFallback({
  message = 'Something went wrong loading data.',
  onRetry,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center',
        compact && 'p-4 gap-2',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className={compact ? 'h-4 w-4' : 'h-5 w-5'} aria-hidden />
        <p className={cn('text-sm text-foreground', compact && 'text-xs')}>{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size={compact ? 'sm' : 'default'} onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
      )}
    </div>
  )
}

export default QueryErrorFallback
