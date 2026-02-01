/**
 * TypingIndicator Component
 * 
 * Animated dots showing someone is typing.
 */

import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  /** Name to show (e.g., "Echo is typing...") */
  name?: string
  className?: string
}

export function TypingIndicator({ name, className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-[var(--surface-secondary)]">
        <span 
          className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '600ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce"
          style={{ animationDelay: '150ms', animationDuration: '600ms' }}
        />
        <span 
          className="w-2 h-2 rounded-full bg-[var(--text-tertiary)] animate-bounce"
          style={{ animationDelay: '300ms', animationDuration: '600ms' }}
        />
      </div>
      {name && (
        <span className="text-xs text-[var(--text-tertiary)]">
          {name} is typing...
        </span>
      )}
    </div>
  )
}
