// src/pages/forms/FormDetail.jsx
// Form detail view with embedded form builder preview and settings

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Pencil,
  Eye,
  Code,
  Settings,
  BarChart3,
  Inbox,
  ExternalLink,
  Copy,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow, isValid } from 'date-fns'

export default function FormDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    loadForm()
  }, [id])
  
  async function loadForm() {
    if (!id) return
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('managed_forms')
        .select(`
          *,
          fields:managed_form_fields(*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      setForm(data)
    } catch (err) {
      console.error('Failed to load form:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  async function copyEmbedCode() {
    if (!form) return
    
    const embedCode = `<script src="https://forms.uptrademedia.com/embed.js" data-form="${form.slug}"></script>`
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  
  if (!form) {
    return (
      <div className="p-6 text-center">
        <p className="text-[var(--text-secondary)]">Form not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/forms')}>
          Back to Forms
        </Button>
      </div>
    )
  }
  
  const createdAt = form.created_at ? new Date(form.created_at) : null
  const updatedAt = form.updated_at ? new Date(form.updated_at) : null
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/forms')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">{form.name}</h1>
            <p className="text-sm text-[var(--text-tertiary)]">/{form.slug}</p>
          </div>
          {form.is_active ? (
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Active</Badge>
          ) : (
            <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400">Inactive</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={copyEmbedCode}>
            {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Code className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Embed Code'}
          </Button>
          <Button 
            onClick={() => navigate(`/forms/${id}/edit`)}
            style={{ backgroundColor: 'var(--brand-primary)' }}
            className="text-white"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit Form
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="preview" className="space-y-6">
        <TabsList className="bg-[var(--glass-bg)] border border-[var(--glass-border)]">
          <TabsTrigger value="preview">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <Inbox className="h-4 w-4 mr-2" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview">
          <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>
                This is how your form appears to visitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 bg-white dark:bg-gray-900 rounded-lg border border-[var(--glass-border)]">
                {/* Form preview would render here */}
                <p className="text-center text-[var(--text-tertiary)]">
                  Form preview coming soon...
                </p>
                <p className="text-center text-sm text-[var(--text-tertiary)] mt-2">
                  {form.fields?.length || 0} fields configured
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="submissions">
          <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                View and manage form submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-[var(--text-tertiary)]">
                Submissions view coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
            <CardHeader>
              <CardTitle>Form Analytics</CardTitle>
              <CardDescription>
                Track form performance and conversions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-[var(--text-tertiary)]">
                Analytics view coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <div className="grid gap-6">
            {/* Embed Configuration */}
            <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <CardHeader>
                <CardTitle>Embed Configuration</CardTitle>
                <CardDescription>
                  Configure how the form appears when embedded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-[var(--glass-bg-hover)] rounded-lg text-sm text-[var(--text-secondary)] overflow-x-auto">
                  {JSON.stringify(form.embed_config || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
            
            {/* Form Info */}
            <Card className="bg-[var(--glass-bg)] border-[var(--glass-border)]">
              <CardHeader>
                <CardTitle>Form Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Created</p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {createdAt && isValid(createdAt) ? format(createdAt, 'PPP') : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Last Updated</p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {updatedAt && isValid(updatedAt) 
                        ? formatDistanceToNow(updatedAt, { addSuffix: true })
                        : 'Never'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Form ID</p>
                    <p className="text-sm text-[var(--text-primary)] font-mono">{form.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Version</p>
                    <p className="text-sm text-[var(--text-primary)]">{form.version || 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
