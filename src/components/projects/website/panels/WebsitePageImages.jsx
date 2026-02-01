/**
 * WebsitePageImages - Page-scoped managed images (full CRUD).
 * Uses useSiteImages(projectId, { page_path }) and mutations with page_path in payload.
 */
import { useState } from 'react'
import { Image, Upload, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useSiteImages,
  useCreateSiteImage,
  useUpdateSiteImage,
  useDeleteSiteImage,
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

const CATEGORIES = [
  { value: 'hero', label: 'Hero' },
  { value: 'brand', label: 'Brand' },
  { value: 'team', label: 'Team' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'other', label: 'Other' },
]

function getPagePath(selectedPage) {
  if (!selectedPage) return ''
  return selectedPage.path ?? (selectedPage.url ? new URL(selectedPage.url, 'https://x').pathname : '') ?? ''
}

export default function WebsitePageImages({ projectId, project, selectedPage }) {
  const pagePath = getPagePath(selectedPage)
  const { data: images = [], isLoading, refetch } = useSiteImages(projectId, {
    page_path: pagePath,
    enabled: !!projectId && !!pagePath,
  })
  const createMutation = useCreateSiteImage()
  const updateMutation = useUpdateSiteImage()
  const deleteMutation = useDeleteSiteImage()

  const [editingImage, setEditingImage] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)
  const [createForm, setCreateForm] = useState({
    slot_id: '',
    page_path: pagePath,
    alt_text: '',
    ai_category: 'other',
  })
  const [editForm, setEditForm] = useState({ slot_id: '', page_path: '', alt_text: '', ai_category: 'other' })

  if (!projectId || !selectedPage) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Select a page to manage its images.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.slot_id) return
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          ...createForm,
          page_path: pagePath || createForm.page_path,
        },
      })
      toast.success('Image slot created')
      setIsCreateOpen(false)
      setCreateForm({ slot_id: '', page_path: pagePath, alt_text: '', ai_category: 'other' })
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingImage?.id) return
    try {
      await updateMutation.mutateAsync({
        id: editingImage.id,
        projectId,
        data: editForm,
      })
      toast.success('Image updated')
      setEditingImage(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update')
    }
  }

  const handleDelete = async (imageId) => {
    setIsDeleting(imageId)
    try {
      await deleteMutation.mutateAsync({ id: imageId, projectId })
      toast.success('Image slot removed')
      if (editingImage?.id === imageId) setEditingImage(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete')
    } finally {
      setIsDeleting(null)
    }
  }

  const openEdit = (img) => {
    setEditingImage(img)
    setEditForm({
      slot_id: img.slot_id || '',
      page_path: img.page_path || pagePath,
      alt_text: img.alt_text || '',
      ai_category: img.ai_category || 'other',
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{images.length} image slots</Badge>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Add slot
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No image slots for this page.</p>
          <p className="text-xs text-muted-foreground mt-1">Add a slot to manage an image here.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Add slot
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square rounded-lg border bg-muted overflow-hidden"
            >
              {img.url ? (
                <img src={img.url} alt={img.alt_text || img.slot_id} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-xs text-white font-mono truncate">{img.slot_id}</p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(img)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(img.id)}
                      disabled={isDeleting === img.id}
                    >
                      {isDeleting === img.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add image slot</DialogTitle>
            <DialogDescription>Create a managed image slot for this page.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Slot ID</Label>
              <Input
                value={createForm.slot_id}
                onChange={(e) => setCreateForm((f) => ({ ...f, slot_id: e.target.value }))}
                placeholder="hero-main, logo-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={createForm.ai_category}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, ai_category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Textarea
                value={createForm.alt_text}
                onChange={(e) => setCreateForm((f) => ({ ...f, alt_text: e.target.value }))}
                placeholder="Descriptive alt text"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.slot_id}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit image slot</DialogTitle>
            <DialogDescription>Update slot ID, path, and alt text.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Slot ID</Label>
              <Input
                value={editForm.slot_id}
                onChange={(e) => setEditForm((f) => ({ ...f, slot_id: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Page path</Label>
              <Input
                value={editForm.page_path}
                onChange={(e) => setEditForm((f) => ({ ...f, page_path: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editForm.ai_category}
                onValueChange={(v) => setEditForm((f) => ({ ...f, ai_category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Alt text</Label>
              <Textarea
                value={editForm.alt_text}
                onChange={(e) => setEditForm((f) => ({ ...f, alt_text: e.target.value }))}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingImage(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => editingImage && handleDelete(editingImage.id)}
                disabled={isDeleting === editingImage?.id}
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
