/**
 * Chat Components - Barrel Exports
 * 
 * Custom chat implementation replacing OpenAI ChatKit.
 * Supports both AI (SSE streaming) and human-to-human (WebSocket) messaging.
 */

export { MessageBubble } from './MessageBubble'
export { MessageInput } from './MessageInput'
export { ChatArea } from './ChatArea'
export { ThreadList } from './ThreadList'
export { ThreadRepliesDrawer } from './ThreadRepliesDrawer'
export { ThreadListItem } from './ThreadListItem'
export { TypingIndicator } from './TypingIndicator'
export { WelcomeScreen } from './WelcomeScreen'
export { CodeBlock } from './CodeBlock'
export { FeedbackButtons } from './FeedbackButtons'
export { LinkPreviewCard, extractFirstUrl } from './LinkPreviewCard'

// Attachment components
export { 
  AttachmentPreview, 
  AttachmentThumbnail, 
  AttachmentUploadButton, 
  DropZone 
} from './Attachments'
export type { Attachment, PendingAttachment } from './Attachments'

// Types
export type { ChatKitThread, ChatKitItem, MessageContent, ItemReaction, PresenceStatus } from './types'
