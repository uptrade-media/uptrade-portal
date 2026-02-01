// src/components/sync/useKeyboardShortcuts.js
// Keyboard shortcuts hook for Sync module power users

import { useEffect, useCallback, useState } from 'react'

/**
 * Keyboard shortcuts for Sync module:
 * 
 * Navigation & Selection:
 * - j/k: Move selection down/up
 * - Enter: View/open selected task
 * - Escape: Clear selection
 * 
 * Actions:
 * - n: New task
 * - d: Mark selected as done
 * - a: Approve selected (if Signal action)
 * - r: Reject selected (if Signal action)
 * - s: Auto-schedule selected
 * - /: Focus search
 * 
 * Views:
 * - t: Jump to Today section
 * - o: Jump to Overdue section
 * - ?: Show shortcuts help
 */

export const SHORTCUTS = [
  { key: 'n', description: 'New task', category: 'Actions' },
  { key: 'd', description: 'Mark selected as done', category: 'Actions' },
  { key: 'a', description: 'Approve action', category: 'Actions' },
  { key: 'r', description: 'Reject action', category: 'Actions' },
  { key: 's', description: 'Auto-schedule task', category: 'Actions' },
  { key: 'j', description: 'Move selection down', category: 'Navigation' },
  { key: 'k', description: 'Move selection up', category: 'Navigation' },
  { key: 'Enter', description: 'Open selected task', category: 'Navigation' },
  { key: 'Escape', description: 'Clear selection', category: 'Navigation' },
  { key: '/', description: 'Focus search', category: 'Navigation' },
  { key: 't', description: 'Jump to Today', category: 'Views' },
  { key: 'o', description: 'Jump to Overdue', category: 'Views' },
  { key: '?', description: 'Show shortcuts', category: 'Help' },
]

export function useKeyboardShortcuts({
  enabled = true,
  tasks = [],
  selectedIndex = -1,
  onSelectIndex,
  onNewTask,
  onComplete,
  onApprove,
  onReject,
  onAutoSchedule,
  onView,
  onSearch,
  onShowHelp,
  onJumpToSection,
}) {
  const [isEnabled, setIsEnabled] = useState(enabled)

  const handleKeyDown = useCallback((e) => {
    // Don't capture if typing in input/textarea
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TEXTAREA' ||
      e.target.isContentEditable
    ) {
      // Allow Escape to blur
      if (e.key === 'Escape') {
        e.target.blur()
      }
      return
    }

    // Don't capture if modifier keys (except Shift for ?)
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return
    }

    const selectedTask = selectedIndex >= 0 && selectedIndex < tasks.length 
      ? tasks[selectedIndex] 
      : null

    switch (e.key) {
      // Navigation
      case 'j':
        e.preventDefault()
        if (tasks.length > 0) {
          const newIndex = Math.min(selectedIndex + 1, tasks.length - 1)
          onSelectIndex?.(newIndex)
        }
        break

      case 'k':
        e.preventDefault()
        if (tasks.length > 0) {
          const newIndex = Math.max(selectedIndex - 1, 0)
          onSelectIndex?.(newIndex)
        }
        break

      case 'Enter':
        e.preventDefault()
        if (selectedTask) {
          onView?.(selectedTask)
        }
        break

      case 'Escape':
        e.preventDefault()
        onSelectIndex?.(-1)
        break

      // Actions
      case 'n':
        e.preventDefault()
        onNewTask?.()
        break

      case 'd':
        e.preventDefault()
        if (selectedTask && selectedTask.source_type !== 'signal_action') {
          onComplete?.(selectedTask)
        }
        break

      case 'a':
        e.preventDefault()
        if (selectedTask && selectedTask.source_type === 'signal_action') {
          onApprove?.(selectedTask)
        }
        break

      case 'r':
        e.preventDefault()
        if (selectedTask && selectedTask.source_type === 'signal_action') {
          onReject?.(selectedTask)
        }
        break

      case 's':
        e.preventDefault()
        if (selectedTask && selectedTask.estimated_hours) {
          onAutoSchedule?.(selectedTask)
        }
        break

      case '/':
        e.preventDefault()
        onSearch?.()
        break

      // Views
      case 't':
        e.preventDefault()
        onJumpToSection?.('today')
        break

      case 'o':
        e.preventDefault()
        onJumpToSection?.('overdue')
        break

      case '?':
        e.preventDefault()
        onShowHelp?.()
        break

      default:
        break
    }
  }, [
    tasks,
    selectedIndex,
    onSelectIndex,
    onNewTask,
    onComplete,
    onApprove,
    onReject,
    onAutoSchedule,
    onView,
    onSearch,
    onShowHelp,
    onJumpToSection,
  ])

  useEffect(() => {
    if (!isEnabled) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEnabled, handleKeyDown])

  return {
    isEnabled,
    setIsEnabled,
    shortcuts: SHORTCUTS,
  }
}

export default useKeyboardShortcuts
