/**
 * useProject - Convenience hook for project data
 * MIGRATED TO REACT QUERY HOOKS - Jan 29, 2026
 * 
 * Wraps the React Query useProject and useProjects hooks for easy access
 */
import useAuthStore from '@/lib/auth-store'
import { useProject as useProjectQuery, useProjects } from '@/lib/hooks'

// Convenience hook to access the current project and common project actions
export function useProject() {
  const { currentProject, setCurrentProject } = useAuthStore()
  
  // Fetch the current project details via React Query
  const { data: projectData, isLoading: projectLoading, error: projectError } = useProjectQuery(currentProject?.id)
  
  // Fetch all projects via React Query
  const { data: projectsData, isLoading: projectsLoading } = useProjects()
  const projects = projectsData?.projects || projectsData || []

  return {
    currentProject: projectData || currentProject,
    setCurrentProject,
    projects,
    isLoading: projectLoading || projectsLoading,
    error: projectError,
  }
}
