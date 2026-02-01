/**
 * Signal Query Hooks
 * 
 * TanStack Query hooks for Signal AI module.
 * Replaces parts of signal-store.js with automatic caching.
 * 
 * Note: Echo real-time chat state remains in signal-store.js (WebSocket, streaming).
 * This file handles the CRUD operations for knowledge base, FAQs, and module config.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signalApi } from '../signal-api'

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const signalKeys = {
  all: ['signal'],
  config: (projectId) => [...signalKeys.all, 'config', projectId],
  knowledge: (projectId) => [...signalKeys.all, 'knowledge', projectId],
  knowledgeList: (projectId, filters) => [...signalKeys.knowledge(projectId), 'list', filters],
  knowledgeDetail: (id) => [...signalKeys.all, 'knowledgeDetail', id],
  faqs: (projectId) => [...signalKeys.all, 'faqs', projectId],
  faqDetail: (id) => [...signalKeys.all, 'faqDetail', id],
  skills: () => [...signalKeys.all, 'skills'],
  skillDetail: (id) => [...signalKeys.all, 'skillDetail', id],
  conversations: (projectId) => [...signalKeys.all, 'conversations', projectId],
  conversationDetail: (id) => [...signalKeys.all, 'conversationDetail', id],
  memories: (projectId) => [...signalKeys.all, 'memories', projectId],
  patterns: (projectId) => [...signalKeys.all, 'patterns', projectId],
  suggestions: (projectId) => [...signalKeys.all, 'suggestions', projectId],
  analytics: (projectId) => [...signalKeys.all, 'analytics', projectId],
}

// ═══════════════════════════════════════════════════════════════════════════
// MODULE CONFIG
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch Signal module config for a project
 */
export function useSignalConfig(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.config(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/projects/${projectId}/config`)
      return response.data?.config || response.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 10, // 10 minutes
    ...options,
  })
}

/**
 * Update Signal module config
 */
export function useUpdateSignalConfig() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, config }) => {
      const response = await signalApi.put(`/projects/${projectId}/config`, config)
      return response.data?.config || response.data
    },
    onSuccess: (data, { projectId }) => {
      queryClient.setQueryData(signalKeys.config(projectId), data)
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch knowledge base entries
 */
export function useKnowledge(projectId, filters = {}, options = {}) {
  return useQuery({
    queryKey: signalKeys.knowledgeList(projectId, filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      if (filters.page) params.append('page', filters.page)
      if (filters.limit) params.append('limit', filters.limit)
      
      const queryString = params.toString()
      const response = await signalApi.get(`/knowledge/${projectId}${queryString ? `?${queryString}` : ''}`)
      const data = response.data
      return {
        items: data.items || data.knowledge || data || [],
        total: data.total || 0,
        categories: data.categories || [],
      }
    },
    enabled: !!projectId,
    ...options,
  })
}

/**
 * Fetch single knowledge entry
 */
export function useKnowledgeEntry(id, options = {}) {
  return useQuery({
    queryKey: signalKeys.knowledgeDetail(id),
    queryFn: async () => {
      const response = await signalApi.get(`/knowledge/entry/${id}`)
      return response.data?.entry || response.data
    },
    enabled: !!id,
    ...options,
  })
}

/**
 * Create knowledge entry
 */
export function useCreateKnowledge() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, data }) => {
      const response = await signalApi.post(`/knowledge/${projectId}`, data)
      return response.data?.entry || response.data
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: signalKeys.knowledge(projectId) })
    },
  })
}

/**
 * Update knowledge entry
 */
export function useUpdateKnowledge() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId, data }) => {
      const response = await signalApi.put(`/knowledge/entry/${id}`, data)
      return { ...(response.data?.entry || response.data), projectId }
    },
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(signalKeys.knowledgeDetail(id), data)
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.knowledge(data.projectId) })
      }
    },
  })
}

/**
 * Delete knowledge entry
 */
export function useDeleteKnowledge() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      await signalApi.delete(`/knowledge/entry/${id}`)
      return { id, projectId }
    },
    onSuccess: ({ id, projectId }) => {
      queryClient.removeQueries({ queryKey: signalKeys.knowledgeDetail(id) })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.knowledge(projectId) })
      }
    },
  })
}

/**
 * Sync knowledge from external source
 */
export function useSyncKnowledge() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, source, sourceUrl }) => {
      const response = await signalApi.post(`/knowledge/${projectId}/sync`, { source, sourceUrl })
      return response.data
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: signalKeys.knowledge(projectId) })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch FAQs
 */
export function useSignalFaqs(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.faqs(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/faqs/${projectId}`)
      return response.data?.faqs || response.data || []
    },
    enabled: !!projectId,
    ...options,
  })
}

/**
 * Create FAQ
 */
export function useCreateSignalFaq() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, data }) => {
      const response = await signalApi.post(`/faqs/${projectId}`, data)
      return response.data?.faq || response.data
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: signalKeys.faqs(projectId) })
    },
  })
}

/**
 * Update FAQ
 */
export function useUpdateSignalFaq() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId, data }) => {
      const response = await signalApi.put(`/faqs/entry/${id}`, data)
      return { ...(response.data?.faq || response.data), projectId }
    },
    onSuccess: (data) => {
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.faqs(data.projectId) })
      }
    },
  })
}

/**
 * Delete FAQ
 */
export function useDeleteSignalFaq() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      await signalApi.delete(`/faqs/entry/${id}`)
      return { id, projectId }
    },
    onSuccess: ({ projectId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.faqs(projectId) })
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILLS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch all skills
 */
export function useSignalSkills(options = {}) {
  return useQuery({
    queryKey: signalKeys.skills(),
    queryFn: async () => {
      const response = await signalApi.get('/skills')
      return response.data?.skills || response.data || []
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    ...options,
  })
}

/**
 * Fetch single skill
 */
export function useSignalSkill(id, options = {}) {
  return useQuery({
    queryKey: signalKeys.skillDetail(id),
    queryFn: async () => {
      const response = await signalApi.get(`/skills/${id}`)
      return response.data?.skill || response.data
    },
    enabled: !!id,
    ...options,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch conversations
 */
export function useSignalConversations(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.conversations(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/conversations/${projectId}`)
      return response.data?.conversations || response.data || []
    },
    enabled: !!projectId,
    ...options,
  })
}

/**
 * Fetch single conversation
 */
export function useSignalConversation(id, options = {}) {
  return useQuery({
    queryKey: signalKeys.conversationDetail(id),
    queryFn: async () => {
      const response = await signalApi.get(`/conversations/detail/${id}`)
      return response.data?.conversation || response.data
    },
    enabled: !!id,
    ...options,
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMORIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch org memories
 */
export function useSignalMemories(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.memories(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/memories/${projectId}`)
      return response.data?.memories || response.data || []
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 15, // 15 minutes
    ...options,
  })
}

/**
 * Create memory
 */
export function useCreateSignalMemory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, data }) => {
      const response = await signalApi.post(`/memories/${projectId}`, data)
      return response.data?.memory || response.data
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: signalKeys.memories(projectId) })
    },
  })
}

/**
 * Delete memory
 */
export function useDeleteSignalMemory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      await signalApi.delete(`/memories/entry/${id}`)
      return { id, projectId }
    },
    onSuccess: ({ projectId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.memories(projectId) })
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// PATTERNS & SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch learned patterns
 */
export function useSignalPatterns(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.patterns(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/patterns/${projectId}`)
      return response.data?.patterns || response.data || []
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 15, // 15 minutes
    ...options,
  })
}

/**
 * Fetch learning suggestions (cached 24h so navigating to Signal doesn't refetch every time)
 */
export function useSignalSuggestions(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.suggestions(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/learning/${projectId}/suggestions`)
      return response.data?.suggestions || response.data || []
    },
    enabled: !!projectId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  })
}

/**
 * Accept a learning suggestion
 */
export function useAcceptSignalSuggestion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const response = await signalApi.post(`/learning/suggestions/${id}/accept`)
      return { ...(response.data || {}), projectId }
    },
    onSuccess: ({ projectId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.suggestions(projectId) })
        queryClient.invalidateQueries({ queryKey: signalKeys.knowledge(projectId) })
      }
    },
  })
}

/**
 * Dismiss a learning suggestion
 */
export function useDismissSignalSuggestion() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }) => {
      const response = await signalApi.post(`/learning/suggestions/${id}/dismiss`)
      return { ...(response.data || {}), projectId }
    },
    onSuccess: ({ projectId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: signalKeys.suggestions(projectId) })
      }
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch Signal analytics
 */
export function useSignalAnalytics(projectId, options = {}) {
  return useQuery({
    queryKey: signalKeys.analytics(projectId),
    queryFn: async () => {
      const response = await signalApi.get(`/analytics/${projectId}`)
      return response.data
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  })
}
