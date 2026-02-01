/**
 * WebsitePageScripts - Page-scoped scripts (full CRUD).
 * Fetches site scripts and filters by path if available; create/update/delete.
 */
import { useState, useMemo } from 'react'
import { Code, Plus, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  useSiteScripts,
  useCreateSiteScript,
  useUpdateSiteScript,
  useDeleteSiteScript,
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
  { value: 'head', label: 'Head' },
  { value: 'body_start', label: 'Body start' },
  { value: 'body_end', label: 'Body end' },
]

function getPagePath(selectedPage) {
  if (!selectedPage) return ''
  return selectedPage.path ?? (selectedPage.url ? new URL(selectedPage.url, 'https://x').pathname : '') ?? ''
}

export default function WebsitePageScripts({ projectId, selectedPage }) {
  const pagePath = getPagePath(selectedPage)
  const { data: allScripts = [], isLoading, refetch } = useSiteScripts(projectId, { enabled: !!projectId })
  const scriptsList = useMemo(() => {
    if (!pagePath) return []
    return allScripts.filter((s) => {
      const paths = s.paths || s.page_paths || (s.path ? [s.path] : [])
      if (!paths || (Array.isArray(paths) && paths.length === 0)) return true
      const arr = Array.isArray(paths) ? paths : [paths]
      return arr.some((p) => (p || '').replace(/\/$/, '') === pagePath.replace(/\/$/, ''))
    })
  }, [allScripts, pagePath])

  const createMutation = useCreateSiteScript()
  const updateMutation = useUpdateSiteScript()
  const deleteMutation = useDeleteSiteScript()

  const [editingItem, setEditingItem] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const [createForm, setCreateForm] = useState({
    name: '',
    script_type: 'custom',
    position: 'body_end',
    content: '',
    is_active: true,
    path: pagePath,
  })
  const [editForm, setEditForm] = useState({
    name: '',
    script_type: 'custom',
    position: 'body_end',
    content: '',
    is_active: true,
    path: '',
  })

  if (!projectId || !selectedPage) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Select a page to manage its scripts.
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
    if (!createForm.name) return
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          name: createForm.name,
          script_type: createForm.script_type || 'custom',
          position: createForm.position || 'body_end',
          content: createForm.content || '',
          is_active: createForm.is_active !== false,
          path: pagePath,
        },
      })
      toast.success('Script created')
      setIsCreateOpen(false)
      setCreateForm({
        name: '',
        script_type: 'custom',
        position: 'body_end',
        content: '',
        is_active: true,
        path: pagePath,
      })
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
          name: editForm.name,
          script_type: editForm.script_type,
          position: editForm.position,
          content: editForm.content,
          is_active: editForm.is_active,
        },
      })
      toast.success('Script updated')
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
      toast.success('Script deleted')
      if (editingItem?.id === id) setEditingItem(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleActive = async (script, checked) => {
    try {
      await updateMutation.mutateAsync({
        id: script.id,
        projectId,
        data: { ...script, is_active: checked },
      })
      toast.success(checked ? 'Script enabled' : 'Script disabled')
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update')
    }
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setEditForm({
      name: item.name || '',
      script_type: item.script_type || 'custom',
      position: item.position || 'body_end',
      content: item.content || '',
      is_active: item.is_active !== false,
      path: item.path || pagePath,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{scriptsList.length} script(s)</span>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add script
        </Button>
      </div>

      {scriptsList.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No scripts scoped to this page.</p>
          <p className="text-xs text-muted-foreground mt-1">Scripts may apply to all pages or other paths.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add script
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {scriptsList.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Code className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.script_type} · {item.position}</p>
                </div>
                <Switch
                  checked={item.is_active !== false}
                  onCheckedChange={(checked) => handleToggleActive(item, checked)}
                  disabled={updateMutation.isPending}
                />
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add script</DialogTitle>
            <DialogDescription>Script for this page (e.g. tracking).</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. GA4, GTM"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={createForm.script_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, script_type: e.target.value }))}
                placeholder="custom, gtm, ga4..."
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
            <div className="space-y-2">
              <Label>Content (optional)</Label>
              <Textarea
                value={createForm.content}
                onChange={(e) => setCreateForm((f) => ({ ...f, content: e.target.value }))}
                rows={4}
                className="font-mono text-sm"
                placeholder="<script>...</script>"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={createForm.is_active}
                onCheckedChange={(v) => setCreateForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>Active</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.name}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit script</DialogTitle>
            <DialogDescription>Update name, position, and content.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select
                value={editForm.position}
                onValueChange={(v) => setEditForm((f) => ({ ...f, position: v }))}
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
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                rows={6}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(v) => setEditForm((f) => ({ ...f, is_active: v }))}
              />
              <Label>Active</Label>
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
