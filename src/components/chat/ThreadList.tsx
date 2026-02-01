/**
 * ThreadList Component
 * 
 * Sidebar list of chat threads with:
 * - Thread previews
 * - Unread badges
 * - Empty state with new thread action
 * - Pin/delete support via context menu
 */

import { useMemo } from 'react'
import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThreadListItem } from './ThreadListItem'
import type { ChatKitThread } from './types'

interface ThreadListProps {
  threads: ChatKitThread[]
  selectedThreadId: string | null
  onSelectThread: (thread: ChatKitThread) => void
  onNewThread: () => void
  onPinThread?: (threadId: string, pinned: boolean) => Promise<void>
  onDeleteThread?: (threadId: string) => Promise<void>
  /** Mute toggle (Phase 3.4.1). */
  onMuteThread?: (threadId: string, muted: boolean) => Promise<void>
  threadType: 'echo' | 'user' | 'visitor'
  isLoading?: boolean
  /** Presence (Phase 2.10). (userId) => status. */
  presenceFor?: (userId: string) => string
  className?: string
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onNewThread,
  onPinThread,
  onDeleteThread,
  onMuteThread,
  threadType,
  isLoading = false,
  presenceFor,
  className,
}: ThreadListProps) {
  // Sort: pinned first, then unread at top, then by last_message_at
  const { unreadThreads, readThreads } = useMemo(() => {
    const sorted = [...threads].sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      const unreadA = (a.unread_count ?? 0) > 0 ? 1 : 0
      const unreadB = (b.unread_count ?? 0) > 0 ? 1 : 0
      if (unreadB !== unreadA) return unreadB - unreadA
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : (a.updated_at ? new Date(a.updated_at).getTime() : 0)
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : (b.updated_at ? new Date(b.updated_at).getTime() : 0)
      return bTime - aTime
    })
    const unread = sorted.filter((t) => (t.unread_count ?? 0) > 0)
    const read = sorted.filter((t) => (t.unread_count ?? 0) === 0)
    return { unreadThreads: unread, readThreads: read }
  }, [threads])
  const showUnreadSection = unreadThreads.length > 0 && (threadType === 'user' || threadType === 'visitor')
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-[var(--surface-tertiary)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-[var(--surface-tertiary)]" />
                  <div className="h-3 w-1/2 rounded bg-[var(--surface-tertiary)]" />
                </div>
              </div>
            ))}
          </div>
        ) : threads.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--surface-secondary)] mb-3">
              <MessageCircle className="h-6 w-6 text-[var(--text-tertiary)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {threadType === 'echo' && 'No conversations yet'}
              {threadType === 'user' && 'No team messages yet'}
              {threadType === 'visitor' && 'No live chats waiting'}
            </p>
            {threadType !== 'visitor' && (
              <button
                onClick={onNewThread}
                className="mt-3 text-sm font-medium text-[var(--brand-primary)] hover:underline"
              >
                Start a new conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1" role="list" aria-label="Conversations">
            {showUnreadSection && (
              <>
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                  Unread
                </div>
                {unreadThreads.map((thread) => {
                  const stableId = thread.thread_id || (thread as { id?: string }).id
                  return (
                    <ThreadListItem
                      key={stableId}
                      thread={thread}
                      isSelected={stableId === selectedThreadId}
                      onClick={() => onSelectThread(thread)}
                      onPin={onPinThread}
                      onDelete={onDeleteThread}
                      onMute={onMuteThread}
                      presenceFor={presenceFor}
                    />
                  )
                })}
                <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mt-2">
                  All
                </div>
              </>
            )}
            {(showUnreadSection ? readThreads : unreadThreads.concat(readThreads)).map((thread) => {
              const stableId = thread.thread_id || (thread as { id?: string }).id
              return (
                <ThreadListItem
                  key={stableId}
                  thread={thread}
                  isSelected={stableId === selectedThreadId}
                  onClick={() => onSelectThread(thread)}
                  onPin={onPinThread}
                  onDelete={onDeleteThread}
                  onMute={onMuteThread}
                  presenceFor={presenceFor}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}