/**
 * @uptrade/site-kit/engage - Chat Widget (Enhanced)
 *
 * Single widget that encompasses:
 * - Echo (AI) chat when mode is ai or hybrid (session starts in AI; gateway returns Echo responses)
 * - Automated handoff to live agent when user requests or AI suggests (re-check availability; if agents online, POST handoff)
 * - Managed offline form when nobody is online (configurable prompt from project config)
 * - Socket.io for real-time live chat (replaces raw WebSocket)
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { ChatConfig } from './types'

interface ChatWidgetProps {
  projectId: string
  config?: Partial<ChatConfig>
  apiUrl?: string
}

interface MessageAttachment {
  name: string
  url: string
  size?: number
  mimeType?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'agent' | 'system'
  content: string
  timestamp: Date
  agentName?: string
  attachments?: MessageAttachment[]
  /** Echo quick-reply suggestions (render as chips) */
  suggestions?: string[]
  /** Shown when send failed (connection lost) */
  sendFailed?: boolean
}

interface AvailabilityStatus {
  available: boolean
  mode: 'live' | 'ai' | 'offline'
  agentsOnline: number
  operatingHoursActive: boolean
}

interface OfflineFormData {
  name: string
  email: string
  phone: string
  message: string
}

/** Widget config from API (engage_chat_config) for managed prompts */
interface WidgetConfigFromApi {
  initial_message?: string
  welcome_message?: string
  form_heading?: string
  form_description?: string
  offline_message?: string
  offlineFormSlug?: string
  chat_mode?: string
  offline_mode?: string
}

function getApiConfig() {
  const apiUrl = typeof window !== 'undefined' 
    ? (window as any).__SITE_KIT_API_URL__ || 'https://api.uptrademedia.com'
    : 'https://api.uptrademedia.com'
  const apiKey = typeof window !== 'undefined' 
    ? (window as any).__SITE_KIT_API_KEY__
    : undefined
  return { apiUrl, apiKey }
}

function generateVisitorId(): string {
  const stored = typeof localStorage !== 'undefined' 
    ? localStorage.getItem('engage_visitor_id') 
    : null
  if (stored) return stored
  
  const id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('engage_visitor_id', id)
  }
  return id
}

export function ChatWidget({ projectId, config, apiUrl: propApiUrl }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [availability, setAvailability] = useState<AvailabilityStatus | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [visitorId] = useState(generateVisitorId)
  const [agentTyping, setAgentTyping] = useState(false)
  const [showOfflineForm, setShowOfflineForm] = useState(false)
  const [offlineForm, setOfflineForm] = useState<OfflineFormData>({ name: '', email: '', phone: '', message: '' })
  const [offlineSubmitted, setOfflineSubmitted] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfigFromApi | null>(null)
  /** When handoff requested but no agents online, show form with this prompt */
  const [handoffOfflinePrompt, setHandoffOfflinePrompt] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [lastFailedSend, setLastFailedSend] = useState<{ content: string; attachments: MessageAttachment[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const position = config?.position || 'bottom-right'
  const buttonColor = config?.buttonColor || '#00afab'
  const welcomeMessage =
    widgetConfig?.initial_message ?? widgetConfig?.welcome_message ?? config?.welcomeMessage ?? "Hi! How can I help you today?"
  const offlineFormPrompt =
    handoffOfflinePrompt ??
    widgetConfig?.form_description ??
    widgetConfig?.offline_message ??
    config?.offlineMessage ??
    "We're currently offline. Leave us a message and we'll get back to you!"

  const baseUrl = propApiUrl || getApiConfig().apiUrl

  // Fetch widget config (managed prompts: welcome, offline form message)
  const fetchWidgetConfig = useCallback(async () => {
    try {
      const { apiKey } = getApiConfig()
      const response = await fetch(`${baseUrl}/api/engage/widget/config?projectId=${projectId}`, {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      })
      if (response.ok) {
        const { data } = await response.json()
        setWidgetConfig(data ?? null)
      }
    } catch (error) {
      console.error('[ChatWidget] Config fetch failed:', error)
    }
  }, [projectId, baseUrl])

  // Check agent availability on mount and periodically
  const checkAvailability = useCallback(async () => {
    try {
      const { apiKey } = getApiConfig()
      const response = await fetch(`${baseUrl}/api/engage/widget/availability?projectId=${projectId}`, {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      })
      if (response.ok) {
        const { data } = await response.json()
        setAvailability(data)
        if (data.mode === 'offline' && !sessionId) {
          setShowOfflineForm(true)
        }
      }
    } catch (error) {
      console.error('[ChatWidget] Availability check failed:', error)
    }
  }, [projectId, baseUrl, sessionId])

  // Create or restore session (backend sets status to 'ai' for ai/hybrid so Echo runs over socket)
  const initSession = useCallback(async () => {
    try {
      const { apiKey } = getApiConfig()
      const response = await fetch(`${baseUrl}/api/engage/widget/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'x-api-key': apiKey }),
        },
        body: JSON.stringify({
          projectId,
          visitorId,
          sourceUrl: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      })
      if (response.ok) {
        const { data } = await response.json()
        const sid = data.id || data.session_id
        setSessionId(sid)
        if (data.messages?.length > 0) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            role: m.role === 'visitor' ? 'user' : m.role,
            content: m.content,
            timestamp: new Date(m.created_at),
            agentName: m.sender_name,
          })))
        }
        return sid
      }
    } catch (error) {
      console.error('[ChatWidget] Session init failed:', error)
    }
    return null
  }, [projectId, visitorId, baseUrl])

  // Handle incoming socket messages (Echo = role 'ai', live = role 'agent')
  const handleSocketMessage = useCallback((data: any) => {
    switch (data.type || data.event) {
      case 'message': {
        const role =
          data.role === 'visitor' ? 'user' : data.role === 'ai' ? 'assistant' : (data.role as Message['role'])
        const newMessage: Message = {
          id: data.id || `msg-${Date.now()}`,
          role,
          content: data.content ?? '',
          timestamp: new Date(),
          agentName: data.agentName,
        }
        const withAttachments = data.attachments?.length ? { ...newMessage, attachments: data.attachments } : newMessage
        const withSuggestions = (data.suggestions?.length ? { ...withAttachments, suggestions: data.suggestions as string[] } : withAttachments) as Message & { suggestions?: string[] }
        setMessages(prev => [...prev, withSuggestions])
        if (role === 'assistant' || role === 'agent') {
          setAgentTyping(false)
          setIsLoading(false)
        }
        break
      }
        
      case 'agent:joined':
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          role: 'system',
          content: data.agentName ? `${data.agentName} has joined the chat.` : 'An agent has joined the chat.',
          timestamp: new Date(),
        }])
        break
        
      case 'typing':
        setAgentTyping(data.isTyping)
        break
        
      case 'handoff:initiated':
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          role: 'system',
          content: data.message || "Connecting you with a team member...",
          timestamp: new Date(),
        }])
        break
        
      case 'chat:closed':
        setMessages(prev => [...prev, {
          id: `system-${Date.now()}`,
          role: 'system',
          content: data.message || "This chat has been closed.",
          timestamp: new Date(),
        }])
        break
    }
  }, [])

  // Connect via Socket.io (Echo + live chat; gateway handles AI when session status is 'ai')
  const connectSocket = useCallback(
    (currentSessionId: string) => {
      if (socketRef.current?.connected) return

      const namespaceUrl = `${baseUrl.replace(/\/$/, '')}/engage/chat`
      const socket = io(namespaceUrl, {
        query: { projectId, visitorId, sessionId: currentSessionId },
        transports: ['websocket', 'polling'],
      })

      socket.on('connect', () => {
        setConnectionStatus('connected')
        console.log('[ChatWidget] Socket.io connected')
        // Refetch messages after reconnect so nothing is missed during disconnect
        if (currentSessionId) {
          const { apiKey } = getApiConfig()
          fetch(`${baseUrl}/api/engage/widget/messages?sessionId=${currentSessionId}`, {
            headers: apiKey ? { 'x-api-key': apiKey } : {},
          })
            .then((res) => res.ok ? res.json() : null)
            .then((json) => {
              const data = json?.data ?? json
              if (Array.isArray(data) && data.length) {
                setMessages(prev => {
                  const byId = new Map(prev.map(m => [m.id, m]))
                  data.forEach((m: any) => byId.set(m.id, { id: m.id, role: m.role === 'visitor' ? 'user' : m.role, content: m.content, timestamp: new Date(m.created_at), agentName: m.sender_name, attachments: m.attachments }))
                  return Array.from(byId.values()).sort((a, b) => (a.timestamp as Date).getTime() - (b.timestamp as Date).getTime())
                })
              }
            })
            .catch((err) => console.warn('[ChatWidget] Refetch messages on reconnect failed', err))
        }
      })

      socket.on('message', (data: { role?: string; content?: string; agentName?: string; suggestions?: string[]; attachments?: MessageAttachment[] }) => {
        handleSocketMessage({ type: 'message', ...data })
      })

      socket.on('agent:joined', (data: { agentName?: string }) => {
        handleSocketMessage({ type: 'agent:joined', ...data })
      })

      socket.on('typing', (data: { isTyping?: boolean }) => {
        handleSocketMessage({ type: 'typing', ...data })
      })

      socket.on('handoff:initiated', (data: { message?: string }) => {
        handleSocketMessage({ type: 'handoff:initiated', ...data })
      })

      socket.on('chat:closed', (data: { message?: string }) => {
        handleSocketMessage({ type: 'chat:closed', ...data })
      })

      socket.on('disconnect', (reason) => {
        setConnectionStatus('disconnected')
        console.log('[ChatWidget] Socket disconnected:', reason)
      })

      socket.on('connect_error', (err) => {
        console.error('[ChatWidget] Socket connect error:', err)
        setConnectionStatus('disconnected')
        if (isOpen && currentSessionId) startPolling(currentSessionId)
      })

      socketRef.current = socket
    },
    [projectId, visitorId, baseUrl, isOpen, handleSocketMessage, getApiConfig],
  )

  // Polling fallback when Socket.io fails to connect
  const startPolling = useCallback((currentSessionId: string) => {
    if (pollingIntervalRef.current) return
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const { apiKey } = getApiConfig()
        const response = await fetch(
          `${baseUrl}/api/engage/widget/messages?sessionId=${currentSessionId}`,
          { headers: apiKey ? { 'x-api-key': apiKey } : {} }
        )
        if (response.ok) {
          const { data } = await response.json()
          // Update messages if there are new ones
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = data.filter((m: any) => !existingIds.has(m.id))
            if (newMessages.length > 0) {
              return [...prev, ...newMessages.map((m: any) => ({
                id: m.id,
                role: m.role === 'visitor' ? 'user' : m.role,
                content: m.content,
                timestamp: new Date(m.created_at),
                agentName: m.sender_name,
              }))]
            }
            return prev
          })
        }
      } catch (error) {
        console.error('[ChatWidget] Polling failed:', error)
      }
    }, 3000)
  }, [baseUrl])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Check availability on mount; disconnect socket on unmount
  useEffect(() => {
    checkAvailability()
    const interval = setInterval(checkAvailability, 60000)
    return () => {
      clearInterval(interval)
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [checkAvailability])

  // Fetch widget config when opening (for managed welcome/offline prompts)
  useEffect(() => {
    if (isOpen) fetchWidgetConfig()
  }, [isOpen, fetchWidgetConfig])

  // Initialize session and connect Socket.io when chat opens (Echo + live both use socket)
  useEffect(() => {
    if (isOpen && !sessionId && availability?.mode !== 'offline') {
      initSession().then(id => {
        if (id && (availability?.mode === 'live' || availability?.mode === 'ai')) {
          setConnectionStatus('connecting')
          connectSocket(id)
        }
      })
    }
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [isOpen, sessionId, availability?.mode, initSession, connectSocket])

  // Handle chat toggle
  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev)
    if (!isOpen && messages.length === 0 && availability?.mode !== 'offline') {
      // Show welcome message on first open
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }])
    }
  }, [isOpen, messages.length, welcomeMessage, availability?.mode])

  // Upload a file for chat (widget endpoint: sessionId + visitorId)
  const uploadWidgetFile = useCallback(
    async (file: File): Promise<MessageAttachment | null> => {
      if (!sessionId || !visitorId) return null
      const { apiKey } = getApiConfig()
      const form = new FormData()
      form.append('file', file)
      form.append('sessionId', sessionId)
      form.append('visitorId', visitorId)
      const res = await fetch(`${baseUrl}/api/engage/widget/upload`, {
        method: 'POST',
        headers: apiKey ? { 'x-api-key': apiKey } : {},
        body: form,
      })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      const d = json?.data ?? json
      return d?.url ? { name: d.name ?? file.name, url: d.url, size: d.size, mimeType: d.mimeType } : null
    },
    [sessionId, visitorId, baseUrl],
  )

  // Send message via Socket.io (gateway returns Echo when session status is 'ai', else live)
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const hasText = !!inputValue.trim()
      const hasFiles = pendingFiles.length > 0
      if ((!hasText && !hasFiles) || isLoading) return

      const content = inputValue.trim() || ''
      let attachments: MessageAttachment[] = []
      if (pendingFiles.length) {
        try {
          for (const file of pendingFiles) {
            const att = await uploadWidgetFile(file)
            if (att) attachments.push(att)
          }
          setPendingFiles([])
        } catch (err) {
          console.error('[ChatWidget] File upload failed', err)
          setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'assistant', content: 'Failed to upload file. Please try again.', timestamp: new Date() }])
          return
        }
      }

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
        ...(attachments.length ? { attachments } : {}),
      }
      setMessages(prev => [...prev, userMessage])
      setInputValue('')
      setIsLoading(true)

      const socket = socketRef.current
      if (socket?.connected) {
        socket.emit('visitor:message', { content: userMessage.content, attachments: attachments.length ? attachments : undefined })
        setLastFailedSend(null)
        return
      }

      setLastFailedSend({ content: userMessage.content, attachments })
      setMessages(prev => [
        ...prev,
        { id: `error-${Date.now()}`, role: 'assistant', content: "Connection lost.", timestamp: new Date(), sendFailed: true },
      ])
      setIsLoading(false)
    },
    [inputValue, isLoading, pendingFiles, uploadWidgetFile, sessionId],
  )

  const retryFailedSend = useCallback(() => {
    if (!lastFailedSend || !sessionId) return
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit('visitor:message', { content: lastFailedSend.content, attachments: lastFailedSend.attachments?.length ? lastFailedSend.attachments : undefined })
      setLastFailedSend(null)
      setMessages(prev => prev.filter(m => !(m as Message & { sendFailed?: boolean }).sendFailed))
      setIsLoading(true)
    } else {
      connectSocket(sessionId)
      setLastFailedSend(lastFailedSend)
    }
  }, [lastFailedSend, sessionId, connectSocket])

  // Request handoff: re-check availability; if nobody online show managed offline form
  const requestHandoff = useCallback(async () => {
    if (!sessionId) return

    try {
      const { apiKey } = getApiConfig()
      const availRes = await fetch(`${baseUrl}/api/engage/widget/availability?projectId=${projectId}`, {
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      })
      const avail = availRes.ok ? (await availRes.json()).data : null

      if (avail?.agentsOnline === 0) {
        setHandoffOfflinePrompt(
          widgetConfig?.form_description ??
            widgetConfig?.offline_message ??
            "Nobody is online right now. Leave your details and we'll get back to you.",
        )
        setShowOfflineForm(true)
        setMessages(prev => [
          ...prev,
          {
            id: `handoff-offline-${Date.now()}`,
            role: 'system',
            content: "We're not available at the moment. Please leave your info below and we'll follow up soon.",
            timestamp: new Date(),
          },
        ])
        return
      }

      await fetch(`${baseUrl}/api/engage/widget/handoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'x-api-key': apiKey }),
        },
        body: JSON.stringify({ sessionId }),
      })
      setMessages(prev => [
        ...prev,
        {
          id: `handoff-${Date.now()}`,
          role: 'system',
          content: "Connecting you with a team member. Please hold on!",
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('[ChatWidget] Handoff request failed:', error)
    }
  }, [sessionId, baseUrl, projectId, widgetConfig])

  // Handle offline form submission
  const handleOfflineSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offlineForm.name || !offlineForm.email || !offlineForm.message) return
    
    setIsLoading(true)
    
    try {
      const { apiKey } = getApiConfig()
      const response = await fetch(`${baseUrl}/api/engage/widget/offline-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'x-api-key': apiKey }),
        },
        body: JSON.stringify({
          projectId,
          visitorId,
          ...offlineForm,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          ...(widgetConfig?.offlineFormSlug && { formSlug: widgetConfig.offlineFormSlug }),
        }),
      })
      
      if (response.ok) {
        setOfflineSubmitted(true)
      }
    } catch (error) {
      console.error('[ChatWidget] Offline form submission failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [offlineForm, projectId, visitorId, baseUrl])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }, [handleSubmit])

  // Send typing indicator via Socket.io
  const handleTyping = useCallback(() => {
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit('visitor:typing', { isTyping: true })
      setTimeout(() => {
        if (socketRef.current?.connected) {
          socketRef.current.emit('visitor:typing', { isTyping: false })
        }
      }, 2000)
    }
  }, [])

  // Chat bubble button
  const ChatButton = (
    <button
      onClick={handleToggle}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      style={{
        position: 'fixed',
        [position === 'bottom-left' ? 'left' : 'right']: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: '50%',
        backgroundColor: buttonColor,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        zIndex: 9999,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)'
      }}
    >
      {isOpen ? (
        // Close icon (X)
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        // Chat icon
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )}
    </button>
  )

  // Chat popup window
  const ChatPopup = isOpen && (
    <div
      style={{
        position: 'fixed',
        [position === 'bottom-left' ? 'left' : 'right']: 20,
        bottom: 90,
        width: 380,
        maxWidth: 'calc(100vw - 40px)',
        height: 500,
        maxHeight: 'calc(100vh - 120px)',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 9998,
        animation: 'chatSlideUp 0.3s ease-out',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: `linear-gradient(135deg, ${buttonColor}, ${adjustColor(buttonColor, -20)})`,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {showOfflineForm ? 'Leave a Message' : 'Chat with us'}
          </div>
          <div style={{ fontSize: 13, opacity: 0.9, display: 'flex', alignItems: 'center', gap: 6 }}>
            {availability?.mode === 'live' && availability.agentsOnline > 0 ? (
              <>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }} />
                {availability.agentsOnline} online
              </>
            ) : availability?.mode === 'ai' ? (
              'AI-powered support'
            ) : (
              "We'll respond soon"
            )}
          </div>
        </div>
        
        {/* Switch between form and chat */}
        {availability?.mode === 'offline' && !offlineSubmitted && (
          <button
            onClick={() => setShowOfflineForm(prev => !prev)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              color: 'white',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {showOfflineForm ? 'Try Chat' : 'Leave Message'}
          </button>
        )}
      </div>

      {/* Offline Form Content */}
      {showOfflineForm ? (
        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {offlineSubmitted ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>Message Sent!</h3>
              <p style={{ margin: 0, color: '#666', fontSize: 14 }}>
                We'll get back to you as soon as possible.
              </p>
            </div>
          ) : (
            <form onSubmit={handleOfflineSubmit}>
              <p style={{ margin: '0 0 16px', color: '#666', fontSize: 14 }}>
                {offlineFormPrompt}
              </p>
              
              <div style={{ marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Your name *"
                  value={offlineForm.name}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <input
                  type="email"
                  placeholder="Your email *"
                  value={offlineForm.email}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 12 }}>
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={offlineForm.phone}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, phone: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <textarea
                  placeholder="How can we help? *"
                  value={offlineForm.message}
                  onChange={(e) => setOfflineForm(prev => ({ ...prev, message: e.target.value }))}
                  required
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: buttonColor,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isLoading ? 'wait' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              backgroundColor: '#f8f9fa',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: message.role === 'system' ? '8px 12px' : '10px 14px',
                    borderRadius: message.role === 'user' 
                      ? '16px 16px 4px 16px' 
                      : message.role === 'system'
                      ? '8px'
                      : '16px 16px 16px 4px',
                    backgroundColor: message.role === 'user' 
                      ? buttonColor 
                      : message.role === 'system'
                      ? '#e5e7eb'
                      : '#ffffff',
                    color: message.role === 'user' 
                      ? 'white' 
                      : message.role === 'system'
                      ? '#666'
                      : '#1a1a1a',
                    boxShadow: message.role === 'system' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)',
                    fontSize: message.role === 'system' ? 13 : 14,
                    fontStyle: message.role === 'system' ? 'italic' : 'normal',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.agentName && message.role === 'agent' && (
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      {message.agentName}
                    </div>
                  )}
                  {message.content}
                  {message.attachments?.length ? (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {message.attachments.map((att, i) => (
                        att.mimeType?.startsWith('image/') ? (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                            <img src={att.url} alt={att.name} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, objectFit: 'contain' }} />
                          </a>
                        ) : (
                          <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, wordBreak: 'break-all' }}>
                            📎 {att.name}
                          </a>
                        )
                      ))}
                    </div>
                  ) : null}
                  {/* Echo suggestion chips */}
                  {message.suggestions?.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {message.suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setInputValue(s); inputRef.current?.focus() }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 16,
                            border: `1px solid ${buttonColor}`,
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            color: buttonColor,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {/* Failed send: show Retry */}
                  {message.sendFailed && lastFailedSend && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={retryFailedSend}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: '1px solid #ef4444',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        Retry send
                      </button>
                    </div>
                  )}
                  {/* Handoff button for system prompts */}
                  {message.content.includes('speak with') && (
                    <button
                      onClick={requestHandoff}
                      style={{
                        display: 'block',
                        marginTop: 8,
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: `1px solid ${buttonColor}`,
                        backgroundColor: 'transparent',
                        color: buttonColor,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Talk to a person
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {(isLoading || agentTyping) && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    display: 'flex',
                    gap: 4,
                  }}
                >
                  <span style={{ animation: 'chatDot 1.4s infinite ease-in-out', animationDelay: '0s' }}>●</span>
                  <span style={{ animation: 'chatDot 1.4s infinite ease-in-out', animationDelay: '0.2s' }}>●</span>
                  <span style={{ animation: 'chatDot 1.4s infinite ease-in-out', animationDelay: '0.4s' }}>●</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Failed send bar */}
          {lastFailedSend && (
            <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderTop: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#dc2626' }}>Failed to send</span>
              <button type="button" onClick={retryFailedSend} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #dc2626', background: '#fff', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>Retry</button>
            </div>
          )}
          {/* Input */}
          <form onSubmit={handleSubmit} style={{ padding: 12, borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  handleTyping()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 24,
                  border: '1px solid #e5e7eb',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = buttonColor}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: (inputValue.trim() || pendingFiles.length) && !isLoading ? buttonColor : '#e5e7eb',
                  color: 'white',
                  cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          </form>
        </>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes chatSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes chatDot {
          0%, 80%, 100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )

  return (
    <>
      {ChatPopup}
      {ChatButton}
    </>
  )
}

// Helper to darken/lighten a hex color
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
}
