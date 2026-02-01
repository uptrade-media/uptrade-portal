// src/components/sync/KeyboardShortcutsDialog.jsx
// Help dialog showing all available keyboard shortcuts

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Keyboard } from 'lucide-react'
import { SHORTCUTS } from './useKeyboardShortcuts'

function ShortcutKey({ char }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold bg-muted border rounded shadow-sm min-w-[24px] text-center">
      {char}
    </kbd>
  )
}

export default function KeyboardShortcutsDialog({ open, onOpenChange }) {
  // Group shortcuts by category
  const grouped = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {Object.entries(grouped).map(([category, shortcuts]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {shortcuts.map((shortcut) => (
                  <div 
                    key={shortcut.key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <ShortcutKey char={shortcut.key} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <ShortcutKey char="?" /> anytime to show this help
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
