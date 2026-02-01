/**
 * WebsitePageSchema - Page-scoped JSON-LD schema (full CRUD).
 * Fetches site schema and filters by path; create/update/delete.
 */
import { useState, useMemo } from 'react'
import { Braces, Plus, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useSiteSchema,
  useCreateSiteSchema,
  useUpdateSiteSchemaItem,
  useDeleteSiteSchema,
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
import { Skeleton } from '@/components/ui/skeleton'

function getPagePath(selectedPage) {
  if (!selectedPage) return ''
  return selectedPage.path ?? (selectedPage.url ? new URL(selectedPage.url, 'https://x').pathname : '') ?? ''
}

export default function WebsitePageSchema({ projectId, selectedPage }) {
  const pagePath = getPagePath(selectedPage)
  const { data: allSchema = [], isLoading, refetch } = useSiteSchema(projectId, { enabled: !!projectId })
  const schemaList = useMemo(() => {
    if (!pagePath) return []
    const normalized = pagePath.replace(/\/$/, '') || '/'
    return allSchema.filter((s) => {
      const p = (s.path || s.page_path || '').replace(/\/$/, '') || '/'
      return p === normalized
    })
  }, [allSchema, pagePath])

  const createMutation = useCreateSiteSchema()
  const updateMutation = useUpdateSiteSchemaItem()
  const deleteMutation = useDeleteSiteSchema()

  const [editingItem, setEditingItem] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const [createForm, setCreateForm] = useState({
    path: pagePath,
    schema_type: 'WebPage',
    description: '',
    json_ld: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "",\n  "description": ""\n}',
  })
  const [editForm, setEditForm] = useState({ path: '', schema_type: '', description: '', json_ld: '' })

  if (!projectId || !selectedPage) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Select a page to manage its schema.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    let parsed
    try {
      parsed = JSON.parse(createForm.json_ld || '{}')
    } catch {
      toast.error('Invalid JSON')
      return
    }
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          path: pagePath,
          schema_type: createForm.schema_type || 'Custom',
          description: createForm.description || undefined,
          json_ld: parsed,
        },
      })
      toast.success('Schema created')
      setIsCreateOpen(false)
      setCreateForm({
        path: pagePath,
        schema_type: 'WebPage',
        description: '',
        json_ld: '{\n  "@context": "https://schema.org",\n  "@type": "WebPage",\n  "name": "",\n  "description": ""\n}',
      })
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingItem?.id) return
    let parsed
    try {
      parsed = JSON.parse(editForm.json_ld || '{}')
    } catch {
      toast.error('Invalid JSON')
      return
    }
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        projectId,
        data: {
          path: editForm.path,
          schema_type: editForm.schema_type,
          description: editForm.description || undefined,
          json_ld: parsed,
        },
      })
      toast.success('Schema updated')
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
      toast.success('Schema deleted')
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
      path: item.path || pagePath,
      schema_type: item.schema_type || 'Custom',
      description: item.description || '',
      json_ld: typeof item.json_ld === 'object' ? JSON.stringify(item.json_ld, null, 2) : (item.json_ld || '{}'),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{schemaList.length} schema block(s)</span>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add schema
        </Button>
      </div>

      {schemaList.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Braces className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No schema for this page.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add JSON-LD schema
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {schemaList.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Braces className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-sm truncate">{item.schema_type || 'Custom'}</span>
                {item.path && (
                  <span className="text-xs text-muted-foreground truncate">{item.path}</span>
                )}
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
            <DialogTitle>Add JSON-LD schema</DialogTitle>
            <DialogDescription>Structured data for this page.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Input
                value={createForm.schema_type}
                onChange={(e) => setCreateForm((f) => ({ ...f, schema_type: e.target.value }))}
                placeholder="WebPage, Article, FAQPage..."
              />
            </div>
            <div className="space-y-2">
              <Label>JSON-LD</Label>
              <Textarea
                value={createForm.json_ld}
                onChange={(e) => setCreateForm((f) => ({ ...f, json_ld: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
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
            <DialogTitle>Edit schema</DialogTitle>
            <DialogDescription>Update JSON-LD.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Path</Label>
              <Input
                value={editForm.path}
                onChange={(e) => setEditForm((f) => ({ ...f, path: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>JSON-LD</Label>
              <Textarea
                value={editForm.json_ld}
                onChange={(e) => setEditForm((f) => ({ ...f, json_ld: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
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
