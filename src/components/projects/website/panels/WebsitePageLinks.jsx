/**
 * WebsitePageLinks - Page-scoped internal links (full CRUD).
 * Fetches site links and filters by source_path; create/update/delete.
 */
import { useState, useMemo } from 'react'
import { Link2, Plus, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useSiteLinks,
  useCreateSiteLink,
  useUpdateSiteLink,
  useDeleteSiteLink,
} from '@/lib/hooks'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const POSITIONS = [
  { value: 'inline', label: 'Inline' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'footer', label: 'Footer' },
  { value: 'related', label: 'Related' },
]

function getPagePath(selectedPage) {
  if (!selectedPage) return ''
  return selectedPage.path ?? (selectedPage.url ? new URL(selectedPage.url, 'https://x').pathname : '') ?? ''
}

export default function WebsitePageLinks({ projectId, selectedPage }) {
  const pagePath = getPagePath(selectedPage)
  const { data: allLinks = [], isLoading, refetch } = useSiteLinks(projectId, { enabled: !!projectId })
  const linksList = useMemo(() => {
    if (!pagePath) return []
    const normalized = pagePath.replace(/\/$/, '') || '/'
    return allLinks.filter((l) => {
      const p = (l.source_path || l.path || '').replace(/\/$/, '') || '/'
      return p === normalized
    })
  }, [allLinks, pagePath])

  const createMutation = useCreateSiteLink()
  const updateMutation = useUpdateSiteLink()
  const deleteMutation = useDeleteSiteLink()

  const [editingItem, setEditingItem] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const [createForm, setCreateForm] = useState({
    source_path: pagePath,
    target_path: '',
    anchor_text: '',
    position: 'inline',
  })
  const [editForm, setEditForm] = useState({ source_path: '', target_path: '', anchor_text: '', position: 'inline' })

  if (!projectId || !selectedPage) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Select a page to manage its links.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.target_path) return
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          source_path: pagePath,
          target_path: createForm.target_path,
          anchor_text: createForm.anchor_text || createForm.target_path,
          position: createForm.position || 'inline',
        },
      })
      toast.success('Link created')
      setIsCreateOpen(false)
      setCreateForm({ source_path: pagePath, target_path: '', anchor_text: '', position: 'inline' })
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingItem?.id) return
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        projectId,
        data: {
          source_path: editForm.source_path,
          target_path: editForm.target_path,
          anchor_text: editForm.anchor_text,
          position: editForm.position,
        },
      })
      toast.success('Link updated')
      setEditingItem(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update')
    }
  }

  const handleDelete = async (id) => {
    setIsDeleting(id)
    try {
      await deleteMutation.mutateAsync({ id, projectId })
      toast.success('Link deleted')
      if (editingItem?.id === id) setEditingItem(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete')
    } finally {
      setIsDeleting(null)
    }
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setEditForm({
      source_path: item.source_path || pagePath,
      target_path: item.target_path || '',
      anchor_text: item.anchor_text || '',
      position: item.position || 'inline',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{linksList.length} link(s)</span>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add link
        </Button>
      </div>

      {linksList.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Link2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No internal links for this page.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add link
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {linksList.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{item.anchor_text || item.target_path}</p>
                <p className="text-xs text-muted-foreground truncate">
                  → {item.target_path}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(item)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeleting === item.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add internal link</DialogTitle>
            <DialogDescription>Link from this page to another.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Target path</Label>
              <Input
                value={createForm.target_path}
                onChange={(e) => setCreateForm((f) => ({ ...f, target_path: e.target.value }))}
                placeholder="/about, /services"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Anchor text</Label>
              <Input
                value={createForm.anchor_text}
                onChange={(e) => setCreateForm((f) => ({ ...f, anchor_text: e.target.value }))}
                placeholder="Link text (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={createForm.position}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, position: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.target_path}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit link</DialogTitle>
            <DialogDescription>Update target and anchor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Target path</Label>
              <Input
                value={editForm.target_path}
                onChange={(e) => setEditForm((f) => ({ ...f, target_path: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Anchor text</Label>
              <Input
                value={editForm.anchor_text}
                onChange={(e) => setEditForm((f) => ({ ...f, anchor_text: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => editingItem && handleDelete(editingItem.id)}
                disabled={isDeleting === editingItem?.id}
              >
                Delete
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
