/**
 * ThreadRepliesDrawer (Phase 2.6)
 *
 * Sheet/drawer showing a parent message and its replies, with an input to send
 * replies (parent_id). Used for "Reply in thread" on Team chat.
 */

import { useRef, useEffect } from 'react'
import { User } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import type { ChatKitItem, ChatKitThread, MessageContent } from './types'

function messagePreview(item: ChatKitItem): string {
  if (typeof item.content === 'string') return item.content
  if (Array.isArray(item.content)) {
    return (item.content as MessageContent[])
      .filter(c => c.type === 'text' || c.type === 'output_text' || c.type === 'input_text')
      .map(c => c.text)
      .join('\n')
  }
  const c = item.content as { text?: string } | null
  if (c && typeof c === 'object' && 'text' in c) return c.text ?? ''
  return ''
}

interface ThreadRepliesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  thread: ChatKitThread | null
  parentMessage: ChatKitItem | null
  replies: ChatKitItem[]
  isLoadingReplies?: boolean
  onSendReply: (content: string, parentId: string) => void
  currentUserId: string
  mentionContacts?: Array<{ id: string; name?: string; email?: string }>
  canReact?: boolean
  onAddReaction?: (itemId: string, emoji: string) => void
  onRemoveReaction?: (itemId: string, emoji: string) => void
  /** Retry failed reply (Phase 3.1.1) */
  onRetry?: (messageId: string) => void
}

export function ThreadRepliesDrawer({
  open,
  onOpenChange,
  thread,
  parentMessage,
  replies,
  isLoadingReplies = false,
  onSendReply,
  currentUserId,
  mentionContacts,
  canReact = false,
  onAddReaction,
  onRemoveReaction,
  onRetry,
}: ThreadRepliesDrawerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (replies.length && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [replies.length])

  const preview = parentMessage ? messagePreview(parentMessage) : ''
  const previewShort = preview.length > 80 ? `${preview.slice(0, 80)}…` : preview

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full max-w-md flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b border-[var(--glass-border)]/50 px-4 py-3">
          <SheetTitle className="text-base font-medium">Thread</SheetTitle>
          {parentMessage && (
            <div className="flex items-start gap-2 rounded-lg bg-[var(--surface-secondary)]/80 px-3 py-2 text-sm">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-tertiary)]">
                {parentMessage.sender?.avatar_url ? (
                  <img
                    src={parentMessage.sender.avatar_url}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-[var(--text-secondary)]">
                  {parentMessage.sender?.full_name ?? 'User'}
                </span>
                <p className="mt-0.5 truncate text-[var(--text-tertiary)]">
                  {previewShort || 'Message'}
                </p>
              </div>
            </div>
          )}
        </SheetHeader>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {isLoadingReplies ? (
            <div className="flex items-center justify-center py-8 text-sm text-[var(--text-tertiary)]">
              Loading replies…
            </div>
          ) : replies.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No replies yet. Send one below.
            </div>
          ) : (
            replies.map((m) => {
              const isOwn = m.sender_id === currentUserId
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwn={isOwn}
                  showTimestamp
                  reactions={m.reactions ?? []}
                  canReact={canReact}
                  currentUserId={currentUserId}
                  onAddReaction={onAddReaction ? (emoji) => onAddReaction(m.id, emoji) : undefined}
                  onRemoveReaction={onRemoveReaction ? (emoji) => onRemoveReaction(m.id, emoji) : undefined}
                  onRetry={onRetry && (m as { sendFailed?: boolean }).sendFailed ? () => onRetry!(m.id) : undefined}
                />
              )
            })
          )}
        </div>

        {thread && parentMessage && (
          <div className="shrink-0 border-t border-[var(--glass-border)]/50 p-3">
            <MessageInput
              onSend={(content) => onSendReply(content, parentMessage.id)}
              placeholder="Reply in thread…"
              showAttachments
              mentionContacts={mentionContacts}
              draftKey={thread?.thread_id && parentMessage?.id ? `replies-${thread.thread_id}-${parentMessage.id}` : null}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
