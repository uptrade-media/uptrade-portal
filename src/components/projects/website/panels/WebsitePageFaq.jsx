/**
 * WebsitePageFaq - Page-scoped FAQs (full CRUD).
 * Fetches all FAQs and filters by page path; create/update/delete with page_path.
 */
import { useState, useMemo } from 'react'
import { HelpCircle, Plus, Loader2, MoreVertical, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useSiteFaqs,
  useCreateSiteFaq,
  useUpdateSiteFaq,
  useDeleteSiteFaq,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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

export default function WebsitePageFaq({ projectId, selectedPage }) {
  const pagePath = getPagePath(selectedPage)
  const { data: allFaqs = [], isLoading, refetch } = useSiteFaqs(projectId, {
    enabled: !!projectId,
  })
  const faqs = useMemo(() => {
    if (!pagePath) return []
    return allFaqs.filter(
      (f) => (f.page_path || f.path || '').replace(/\/$/, '') === pagePath.replace(/\/$/, '')
    )
  }, [allFaqs, pagePath])

  const createMutation = useCreateSiteFaq()
  const updateMutation = useUpdateSiteFaq()
  const deleteMutation = useDeleteSiteFaq()

  const [expanded, setExpanded] = useState(new Set())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState(null)
  const [isDeleting, setIsDeleting] = useState(null)
  const [createForm, setCreateForm] = useState({ title: '', page_path: pagePath, items: [{ question: '', answer: '' }] })
  const [editForm, setEditForm] = useState({ title: '', items: [] })

  if (!projectId || !selectedPage) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Select a page to manage its FAQs.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.title) return
    const items = (createForm.items || []).filter((i) => i.question?.trim())
    if (items.length === 0) {
      toast.error('Add at least one question and answer')
      return
    }
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          title: createForm.title,
          page_path: pagePath,
          path: pagePath,
          items: items.map((i) => ({ question: i.question, answer: i.answer || '' })),
        },
      })
      toast.success('FAQ section created')
      setIsCreateOpen(false)
      setCreateForm({ title: '', page_path: pagePath, items: [{ question: '', answer: '' }] })
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingFaq?.id) return
    const items = (editForm.items || []).filter((i) => i.question?.trim())
    if (items.length === 0) {
      toast.error('Add at least one question and answer')
      return
    }
    try {
      await updateMutation.mutateAsync({
        id: editingFaq.id,
        projectId,
        data: {
          title: editForm.title,
          items: items.map((i) => ({ question: i.question, answer: i.answer || '' })),
        },
      })
      toast.success('FAQ updated')
      setEditingFaq(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update')
    }
  }

  const handleDelete = async (faqId) => {
    setIsDeleting(faqId)
    try {
      await deleteMutation.mutateAsync({ id: faqId, projectId })
      toast.success('FAQ deleted')
      if (editingFaq?.id === faqId) setEditingFaq(null)
      refetch()
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete')
    } finally {
      setIsDeleting(null)
    }
  }

  const openEdit = (faq) => {
    setEditingFaq(faq)
    setEditForm({
      title: faq.title || '',
      items: (faq.items || []).map((i) => ({ question: i.question || '', answer: i.answer || '' })),
    })
  }

  const addCreateItem = () => {
    setCreateForm((f) => ({ ...f, items: [...(f.items || []), { question: '', answer: '' }] }))
  }
  const addEditItem = () => {
    setEditForm((f) => ({ ...f, items: [...(f.items || []), { question: '', answer: '' }] }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{faqs.length} FAQ section(s)</span>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add section
        </Button>
      </div>

      {faqs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No FAQ sections for this page.</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create FAQ section
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {faqs.map((faq) => (
            <Collapsible
              key={faq.id}
              open={expanded.has(faq.id)}
              onOpenChange={() => toggleExpanded(faq.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 rounded-lg"
                  >
                    {expanded.has(faq.id) ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span className="font-medium">{faq.title || 'Untitled'}</span>
                    <span className="text-xs text-muted-foreground">
                      {(faq.items || []).length} Q&A
                    </span>
                    <DropdownMenu onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-auto">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(faq)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(faq.id)}
                          disabled={isDeleting === faq.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-0 space-y-2 border-t">
                    {(faq.items || []).map((item, idx) => (
                      <div key={idx} className="pt-2">
                        <p className="font-medium text-sm">{item.question}</p>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create FAQ section</DialogTitle>
            <DialogDescription>Add a FAQ block for this page.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Section title</Label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Common questions"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Questions & answers</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addCreateItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(createForm.items || []).map((item, idx) => (
                <div key={idx} className="grid gap-2 p-2 border rounded-md">
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const items = [...(createForm.items || [])]
                      items[idx] = { ...items[idx], question: e.target.value }
                      setCreateForm((f) => ({ ...f, items }))
                    }}
                    placeholder="Question"
                  />
                  <Textarea
                    value={item.answer}
                    onChange={(e) => {
                      const items = [...(createForm.items || [])]
                      items[idx] = { ...items[idx], answer: e.target.value }
                      setCreateForm((f) => ({ ...f, items }))
                    }}
                    placeholder="Answer"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || !createForm.title}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingFaq} onOpenChange={(open) => !open && setEditingFaq(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit FAQ section</DialogTitle>
            <DialogDescription>Update questions and answers.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Section title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Questions & answers</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addEditItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(editForm.items || []).map((item, idx) => (
                <div key={idx} className="grid gap-2 p-2 border rounded-md">
                  <Input
                    value={item.question}
                    onChange={(e) => {
                      const items = [...editForm.items]
                      items[idx] = { ...items[idx], question: e.target.value }
                      setEditForm((f) => ({ ...f, items }))
                    }}
                    placeholder="Question"
                  />
                  <Textarea
                    value={item.answer}
                    onChange={(e) => {
                      const items = [...editForm.items]
                      items[idx] = { ...items[idx], answer: e.target.value }
                      setEditForm((f) => ({ ...f, items }))
                    }}
                    placeholder="Answer"
                    rows={2}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingFaq(null)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save</Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => editingFaq && handleDelete(editingFaq.id)}
                disabled={isDeleting === editingFaq?.id}
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
