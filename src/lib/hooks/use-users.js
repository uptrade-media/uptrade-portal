/**
 * Users Query Hooks
 * 
 * TanStack Query hooks for Users/Members management.
 * Replaces users-store.js with automatic caching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../portal-api'

// ═══════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════

export const usersKeys = {
  all: ['users'],
  orgMembers: (orgId) => [...usersKeys.all, 'orgMembers', orgId],
  projectMembers: (projectId) => [...usersKeys.all, 'projectMembers', projectId],
  user: (id) => [...usersKeys.all, 'user', id],
}

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZATION MEMBERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch organization members
 */
export function useOrgMembers(organizationId, options = {}) {
  return useQuery({
    queryKey: usersKeys.orgMembers(organizationId),
    queryFn: async () => {
      const response = await adminApi.listOrgMembers(organizationId)
      const data = response.data || response
      console.log('[useOrgMembers] Response:', { organizationId, response, data })
      return data.members || data || []
    },
    enabled: !!organizationId,
    ...options,
  })
}

/**
 * Invite organization member
 */
export function useInviteOrgMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ organizationId, email, role }) => {
      const response = await adminApi.inviteOrgMember(organizationId, { email, role })
      return response.data || response
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.orgMembers(organizationId) })
    },
  })
}

/**
 * Update organization member role
 */
export function useUpdateOrgMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ organizationId, userId, role }) => {
      const response = await adminApi.updateOrgMember(organizationId, userId, { role })
      return response.data || response
    },
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.orgMembers(organizationId) })
    },
  })
}

/**
 * Remove organization member
 */
export function useRemoveOrgMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ organizationId, userId }) => {
      await adminApi.removeOrgMember(organizationId, userId)
      return { organizationId, userId }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.orgMembers(organizationId) })
    },
  })
}

/**
 * Update organization member role
 */
export function useUpdateOrgMemberRole() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ organizationId, userId, role }) => {
      await adminApi.updateOrgMember(organizationId, userId, { role })
      return { organizationId, userId, role }
    },
    onSuccess: ({ organizationId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.orgMembers(organizationId) })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT MEMBERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch project members
 */
export function useProjectMembers(projectId, options = {}) {
  return useQuery({
    queryKey: usersKeys.projectMembers(projectId),
    queryFn: async () => {
      const response = await adminApi.listProjectMembers(projectId)
      const data = response.data || response
      return data.members || data || []
    },
    enabled: !!projectId,
    ...options,
  })
}

/**
 * Add project member
 */
export function useAddProjectMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, userId, role }) => {
      const response = await adminApi.addProjectMember(projectId, { userId, role })
      return response.data || response
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.projectMembers(projectId) })
    },
  })
}

/**
 * Update project member role
 */
export function useUpdateProjectMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, userId, role }) => {
      const response = await adminApi.updateProjectMember(projectId, userId, { role })
      return response.data || response
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.projectMembers(projectId) })
    },
  })
}

/**
 * Remove project member
 */
export function useRemoveProjectMember() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ projectId, userId }) => {
      await adminApi.removeProjectMember(projectId, userId)
      return { projectId, userId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.projectMembers(projectId) })
    },
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch user profile
 */
export function useUser(userId, options = {}) {
  return useQuery({
    queryKey: usersKeys.user(userId),
    queryFn: async () => {
      const response = await adminApi.getUser(userId)
      return response.data?.user || response.data
    },
    enabled: !!userId,
    ...options,
  })
}

/**
 * Update user profile
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await adminApi.updateUser(userId, data)
      return response.data?.user || response.data
    },
    onSuccess: (data, { userId }) => {
      queryClient.setQueryData(usersKeys.user(userId), data)
    },
  })
}
