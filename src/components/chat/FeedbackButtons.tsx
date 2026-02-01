/**
 * FeedbackButtons Component
 * 
 * Thumbs up/down for AI message feedback.
 * Only shown on assistant messages in Echo.
 */

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeedbackButtonsProps {
  messageId: string
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void
  className?: string
}

export function FeedbackButtons({ messageId, onFeedback, className }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  
  const handleFeedback = (type: 'positive' | 'negative') => {
    // Toggle if same, otherwise set new
    const newFeedback = feedback === type ? null : type
    setFeedback(newFeedback)
    
    if (newFeedback && onFeedback) {
      onFeedback(messageId, newFeedback)
    }
  }
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        onClick={() => handleFeedback('positive')}
        className={cn(
          'p-1 rounded transition-colors',
          feedback === 'positive'
            ? 'text-green-500 bg-green-500/10'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
        )}
        aria-label="Good response"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => handleFeedback('negative')}
        className={cn(
          'p-1 rounded transition-colors',
          feedback === 'negative'
            ? 'text-red-500 bg-red-500/10'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
        )}
        aria-label="Poor response"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
