/**
 * useEchoChat - AI Chat Hook with SSE Streaming
 * 
 * Manages Echo (AI) conversations using Server-Sent Events for streaming.
 * Connects to Signal API for AI-powered responses.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase-auth'
import type { ChatKitThread, ChatKitItem, SSEEvent } from '@/components/chat/types'

const SIGNAL_API_URL = import.meta.env.VITE_SIGNAL_API_URL || 'https://signal.uptrademedia.com'

interface UseEchoChatOptions {
  /** Thread ID to load */
  threadId?: string | null
  /** Pre-scoped skill (for module Echo) */
  skill?: string | null
  /** Context ID (project, site, etc.) */
  contextId?: string | null
  /** Project ID */
  projectId?: string | null
  /** Enable the chat */
  enabled?: boolean
}

interface UseEchoChatReturn {
  thread: ChatKitThread | null
  messages: ChatKitItem[]
  isLoading: boolean
  isStreaming: boolean
  streamingContent: string
  error: Error | null
  
  // Actions
  sendMessage: (content: string) => Promise<void>
  loadThread: (threadId: string) => Promise<void>
  createThread: () => Promise<string>
  retryMessage: (messageId: string) => Promise<void>
  sendFeedback: (messageId: string, type: 'positive' | 'negative') => void
  loadThreads: () => Promise<ChatKitThread[]>
}

export function useEchoChat(options: UseEchoChatOptions): UseEchoChatReturn {
  const {
    threadId,
    skill,
    contextId,
    projectId,
    enabled = true,
  } = options
  
  const [thread, setThread] = useState<ChatKitThread | null>(null)
  const [messages, setMessages] = useState<ChatKitItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<Error | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  const loadedThreadRef = useRef<string | null>(null)
  
  // Get auth headers
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()
    
    return {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
      'X-ChatKit-Skill': skill || '',
      'X-ChatKit-Context-Id': contextId || '',
      'X-ChatKit-Project-Id': projectId || '',
      'X-ChatKit-User-Id': user?.id || '',
      'X-ChatKit-Thread-Type': 'echo',
    }
  }, [skill, contextId, projectId])
  
  // Load a list of Echo threads
  const loadThreads = useCallback(async (): Promise<ChatKitThread[]> => {
    try {
      const headers = await getAuthHeaders()
      const res = await fetch(`${SIGNAL_API_URL}/chatkit/threads?thread_type=echo&limit=50`, {
        headers,
      })
      
      if (!res.ok) throw new Error('Failed to load threads')
      const data = await res.json()
      return data.data || []
    } catch (err) {
      console.error('[useEchoChat] Load threads error:', err)
      return []
    }
  }, [getAuthHeaders])
  
  // Load thread and messages
  const loadThread = useCallback(async (id: string) => {
    if (!enabled || loadedThreadRef.current === id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const headers = await getAuthHeaders()
      
      // Load thread details
      const threadRes = await fetch(`${SIGNAL_API_URL}/chatkit/threads/${id}`, {
        headers,
      })
      
      if (!threadRes.ok) throw new Error('Failed to load thread')
      const threadData = await threadRes.json()
      setThread(threadData.data || threadData)
      
      // Load messages
      const itemsRes = await fetch(`${SIGNAL_API_URL}/chatkit/threads/${id}/items?limit=50&order=asc`, {
        headers,
      })
      
      if (!itemsRes.ok) throw new Error('Failed to load messages')
      const itemsData = await itemsRes.json()
      setMessages(itemsData.data || [])
      
      loadedThreadRef.current = id
    } catch (err) {
      console.error('[useEchoChat] Load error:', err)
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, getAuthHeaders])
  
  // Create a new thread
  const createThread = useCallback(async (): Promise<string> => {
    const headers = await getAuthHeaders()
    
    // Signal API uses POST /chatkit with type: 'thread.create'
    const res = await fetch(`${SIGNAL_API_URL}/chatkit`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'thread.create',
        thread_type: 'echo',
        skill_key: skill,
        project_id: projectId,
        metadata: {
          context_id: contextId,
        },
      }),
    })
    
    if (!res.ok) throw new Error('Failed to create thread')
    const data = await res.json()
    const newThread = data.data || data
    
    setThread(newThread)
    setMessages([])
    loadedThreadRef.current = newThread.thread_id
    
    return newThread.thread_id
  }, [getAuthHeaders, skill, projectId, contextId])
  
  // Send a message and stream response
  const sendMessage = useCallback(async (content: string) => {
    // Create thread if needed
    let currentThreadId = thread?.thread_id || loadedThreadRef.current
    if (!currentThreadId) {
      currentThreadId = await createThread()
    }
    
    // Add user message immediately
    const userMessageId = `user-${Date.now()}`
    const userMessage: ChatKitItem = {
      id: userMessageId,
      thread_id: currentThreadId,
      type: 'user_message',
      content: [{ type: 'input_text', text: content }],
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    
    // Start streaming
    setIsStreaming(true)
    setStreamingContent('')
    setError(null)
    
    // Cancel any existing stream
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    
    try {
      const headers = await getAuthHeaders()
      
      const res = await fetch(`${SIGNAL_API_URL}/chatkit`, {
        method: 'POST',
        headers: {
          ...headers,
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          type: 'message',
          thread_id: currentThreadId,
          message: {
            content: [{ type: 'input_text', text: content }],
          },
        }),
        signal: abortControllerRef.current.signal,
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      // Handle SSE stream
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      let assistantMessageId = ''
      
      if (!reader) throw new Error('No response body')
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          
          try {
            const event: SSEEvent = JSON.parse(line.slice(6))
            
            switch (event.type) {
              case 'thread.item.start':
                assistantMessageId = event.item?.id || `assistant-${Date.now()}`
                break
                
              case 'thread.item.delta':
                if (event.delta?.text) {
                  fullContent += event.delta.text
                  setStreamingContent(fullContent)
                }
                break
                
              case 'thread.item.done':
                // Add completed assistant message
                const assistantMessage: ChatKitItem = {
                  id: assistantMessageId,
                  thread_id: currentThreadId,
                  type: 'assistant_message',
                  content: event.item?.content || [{ type: 'output_text', text: fullContent }],
                  created_at: new Date().toISOString(),
                }
                setMessages(prev => [...prev, assistantMessage])
                break
                
              case 'response.done':
                // Streaming complete
                break
                
              case 'error':
                throw new Error(event.error?.message || 'Stream error')
            }
          } catch (parseErr) {
            // Skip invalid JSON lines
            if (line.trim() !== 'data: [DONE]') {
              console.warn('[useEchoChat] Parse error:', parseErr, line)
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        console.log('[useEchoChat] Stream aborted')
      } else {
        console.error('[useEchoChat] Stream error:', err)
        setError(err as Error)
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [thread, createThread, getAuthHeaders])
  
  // Retry a failed message
  const retryMessage = useCallback(async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message || message.type !== 'user_message') return
    
    // Extract text from content
    const content = typeof message.content === 'string' 
      ? message.content 
      : message.content.map(c => c.text).join('\n')
    
    // Remove the message and any following assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId)
    setMessages(prev => prev.slice(0, messageIndex))
    
    // Re-send
    await sendMessage(content)
  }, [messages, sendMessage])
  
  // Send feedback
  const sendFeedback = useCallback(async (messageId: string, type: 'positive' | 'negative') => {
    try {
      const headers = await getAuthHeaders()
      await fetch(`${SIGNAL_API_URL}/chatkit/items/${messageId}/feedback`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ type }),
      })
    } catch (err) {
      console.error('[useEchoChat] Feedback error:', err)
    }
  }, [getAuthHeaders])
  
  // Load thread when threadId changes
  useEffect(() => {
    if (threadId && enabled) {
      loadThread(threadId)
    }
    
    return () => {
      // Abort any active stream
      abortControllerRef.current?.abort()
    }
  }, [threadId, enabled, loadThread])
  
  return {
    thread,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    loadThread,
    createThread,
    retryMessage,
    sendFeedback,
    loadThreads,
  }
}
