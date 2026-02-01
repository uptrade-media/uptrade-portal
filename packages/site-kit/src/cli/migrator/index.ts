/**
 * Code Migrator - Transforms existing forms to Site-Kit managed forms
 * 
 * IMPORTANT: This migrator modifies files in-place using safe string operations.
 * It preserves existing code and only adds/modifies the minimum necessary.
 * 
 * Key safety features:
 * - Always reads full file content before modifying
 * - Preserves 'use client' directives at top of file
 * - Adds imports after directives but before other imports
 * - Never overwrites entire file contents (except for form migration which is opt-in)
 */

import fs from 'fs/promises'
import path from 'path'
import { parse } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { ScanResults, DetectedForm, DetectedField } from '../scanner'

// ============================================
// Safe Import Insertion Helper
// ============================================

/**
 * Safely adds an import statement to a file, respecting 'use client'/'use server' directives
 * and avoiding duplicate imports.
 */
function addImportSafely(content: string, importStatement: string): string {
  // Check if import already exists
  const importModule = importStatement.match(/from\s+['"]([^'"]+)['"]/)?.[1]
  if (importModule && content.includes(importModule)) {
    // Import from this module exists, might need to add to existing import
    return content
  }
  
  // Check for 'use client' or 'use server' directive at the start
  const directiveMatch = content.match(/^(['"]use (client|server)['"][\s;]*\n?)/)
  
  if (directiveMatch) {
    // Insert import AFTER the directive
    const directive = directiveMatch[0]
    const restOfFile = content.slice(directive.length)
    
    // Find first import or start of code
    const firstImportMatch = restOfFile.match(/^(import\s+)/)
    if (firstImportMatch) {
      // Insert before first import but after directive
      return directive + importStatement + '\n' + restOfFile
    } else {
      // No imports yet, add after directive with a newline
      return directive + importStatement + '\n' + restOfFile
    }
  } else {
    // No directive, add import at the top
    // But check if there's already an import block at the top
    const firstImportMatch = content.match(/^(import\s+)/)
    if (firstImportMatch) {
      return importStatement + '\n' + content
    } else {
      return importStatement + '\n\n' + content
    }
  }
}

/**
 * Check if a file is a client component (has 'use client' directive at the top)
 */
function isClientComponent(content: string): boolean {
  // Check first few lines for 'use client' directive
  const firstLines = content.split('\n').slice(0, 5).join('\n')
  return /['"]use client['"]/.test(firstLines)
}

/**
 * Adds a named export to an existing import statement from the same module
 */
function addToExistingImport(content: string, namedExport: string, modulePath: string): string {
  // Pattern to find import from the module
  const importPattern = new RegExp(
    `(import\\s*\\{[^}]*)\\}\\s*from\\s*['"]${modulePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
    'g'
  )
  
  if (importPattern.test(content)) {
    // Reset regex
    importPattern.lastIndex = 0
    return content.replace(importPattern, (match, imports) => {
      // Check if already imported
      if (imports.includes(namedExport)) {
        return match
      }
      // Add to imports
      return `${imports.trim()}, ${namedExport} } from '${modulePath}'`
    })
  }
  
  return content
}

/**
 * Insert ManagedSchema component into the JSX return statement of a page component.
 * Looks for the return statement and inserts ManagedSchema right after the opening tag/fragment.
 */
function insertManagedSchemaIntoJSX(content: string, pagePath: string, isTypeScript: boolean): string {
  // Skip if ManagedSchema is already in the JSX (not just imported)
  if (content.includes('<ManagedSchema')) {
    return content
  }

  const projectIdSuffix = isTypeScript ? '!' : ''
  const schemaComponent = `<ManagedSchema
        projectId={process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${projectIdSuffix}}
        path="${pagePath}"
      />`

  // Pattern to find: return ( followed by < or <>
  // This handles: return (<div>...) or return (<>...) or return (\n    <div>...)
  const returnPatterns = [
    // return (<> ... - fragment
    /return\s*\(\s*<>/,
    // return ( <Fragment> ...
    /return\s*\(\s*<Fragment>/,
    // return (<div ... or return (<main ... etc
    /return\s*\(\s*<([a-zA-Z][a-zA-Z0-9]*)[^>]*>/,
  ]

  for (const pattern of returnPatterns) {
    const match = content.match(pattern)
    if (match && match.index !== undefined) {
      const insertPos = match.index + match[0].length
      // Insert ManagedSchema right after the opening tag
      content = content.slice(0, insertPos) + '\n      ' + schemaComponent + content.slice(insertPos)
      return content
    }
  }

  // Fallback: try to find any return statement with JSX
  const simpleReturnMatch = content.match(/return\s*\(/)
  if (simpleReturnMatch && simpleReturnMatch.index !== undefined) {
    // Find the first < after the return (
    const afterReturn = content.slice(simpleReturnMatch.index + simpleReturnMatch[0].length)
    const firstTagMatch = afterReturn.match(/^\s*<([a-zA-Z>][^>]*)>?/)
    if (firstTagMatch) {
      const insertPos = simpleReturnMatch.index + simpleReturnMatch[0].length + firstTagMatch[0].length
      content = content.slice(0, insertPos) + '\n      ' + schemaComponent + content.slice(insertPos)
      return content
    }
  }

  return content
}

// ============================================
// Types
// ============================================

export interface MigrationResult {
  filePath: string
  success: boolean
  changes: string[]
  error?: string
  formId?: string
}

export interface MigrationOptions {
  projectId: string
  apiKey: string
  dryRun?: boolean
}

// ============================================
// Main Migrator
// ============================================

export async function migrateFiles(
  scanResults: ScanResults,
  options: MigrationOptions
): Promise<MigrationResult[]> {
  const results: MigrationResult[] = []

  // Migrate forms
  for (const form of scanResults.forms) {
    if (form.suggestedAction === 'manual') {
      results.push({
        filePath: form.filePath,
        success: false,
        changes: [],
        error: 'Form too complex for auto-migration',
      })
      continue
    }

    try {
      const result = await migrateForm(form, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: form.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  // Migrate widgets (simpler - just remove and add provider flag)
  for (const widget of scanResults.widgets) {
    try {
      const result = await migrateWidget(widget.filePath, widget, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: widget.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  // Migrate metadata
  for (const meta of scanResults.metadata || []) {
    try {
      const result = await migrateMetadata(meta.filePath, meta, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: meta.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  // Migrate schemas
  for (const schema of scanResults.schemas || []) {
    try {
      const result = await migrateSchema(schema.filePath, schema, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: schema.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  // Migrate FAQs
  for (const faq of scanResults.faqs || []) {
    try {
      const result = await migrateFAQ(faq.filePath, faq, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: faq.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  // Migrate sitemaps
  for (const sitemap of scanResults.sitemaps || []) {
    // Skip site-kit generated sitemaps
    if (sitemap.generator === 'site-kit') continue

    try {
      const result = await migrateSitemap(sitemap.filePath, sitemap, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: sitemap.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  // Report analytics (informational only)
  for (const analytics of scanResults.analytics || []) {
    try {
      const result = await migrateAnalytics(analytics.filePath, analytics, options)
      results.push(result)
    } catch (error: any) {
      results.push({
        filePath: analytics.filePath,
        success: false,
        changes: [],
        error: error.message,
      })
    }
  }

  return results
}

// ============================================
// Form Migration
// ============================================

/**
 * Migrate a form to Site-Kit managed form
 * 
 * SAFETY: Form migration is DESTRUCTIVE by design - it replaces the entire form component.
 * This is intentional because forms need to be completely restructured to use the useForm hook.
 * 
 * However, we now:
 * 1. Create a backup of the original file (.backup)
 * 2. Only proceed if user explicitly confirms
 * 3. Log all changes for easy rollback
 */
async function migrateForm(
  form: DetectedForm,
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []
  const fullPath = path.resolve(process.cwd(), form.filePath)

  // Step 1: Create the form in Uptrade
  const formSlug = generateSlug(form.componentName)
  
  // In dry run, don't create the form in API
  let formId: string | undefined
  if (!options.dryRun) {
    try {
      formId = await createFormInUptrade(form, formSlug, options)
      changes.push(`Created managed form: ${formSlug}`)
    } catch (error: any) {
      // Form might already exist
      changes.push(`Form may already exist: ${formSlug}`)
    }
  } else {
    changes.push(`[DRY RUN] Would create managed form: ${formSlug}`)
  }

  if (options.dryRun) {
    changes.push('[DRY RUN] Would create backup of original file')
    changes.push('[DRY RUN] Would replace form with Site-Kit managed form')
    return { filePath: form.filePath, success: true, changes, formId }
  }

  // Step 2: Read the original file and create backup
  const content = await fs.readFile(fullPath, 'utf-8')
  const backupPath = fullPath + '.backup'
  await fs.writeFile(backupPath, content, 'utf-8')
  changes.push(`Created backup: ${form.filePath}.backup`)
  
  // Step 3: Determine if file is TypeScript
  const isTypeScript = form.filePath.endsWith('.tsx') || form.filePath.endsWith('.ts')
  
  // Step 4: Generate new code (preserves TypeScript vs JavaScript)
  const newCode = generateMigratedFormCode(form, formSlug, isTypeScript)

  // Step 5: Write the file
  await fs.writeFile(fullPath, newCode, 'utf-8')
  changes.push('Replaced component with Site-Kit managed form')
  changes.push('Original saved to .backup file - delete when satisfied')

  return {
    filePath: form.filePath,
    success: true,
    changes,
    formId,
  }
}

function generateMigratedFormCode(form: DetectedForm, formSlug: string, isTypeScript: boolean = true): string {
  // Generate a clean, migrated component
  const componentName = form.componentName || 'MigratedForm'
  const classNameType = isTypeScript ? '{ className?: string }' : '{ className }'
  const ext = isTypeScript ? '.tsx' : '.jsx'

  return `/**
 * ${componentName}
 * 
 * Migrated to @uptrademedia/site-kit
 * Managed form: ${formSlug}
 * 
 * Original file backed up to: ${form.filePath}.backup
 */

'use client'

import { useForm } from '@uptrademedia/site-kit/forms'

export function ${componentName}(${classNameType}) {
  const { 
    form,
    fields, 
    values, 
    errors, 
    setFieldValue, 
    submit, 
    isSubmitting,
    isComplete 
  } = useForm('${formSlug}')

  if (isComplete) {
    return (
      <div className={className}>
        <p className="text-green-600">{form?.successMessage || 'Thanks for your submission!'}</p>
      </div>
    )
  }

  return (
    <form 
      onSubmit={(e) => { e.preventDefault(); submit() }} 
      className={className}
    >
      {fields.map(field => (
        <div key={field.slug} className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {field.label}
            {field.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.fieldType === 'textarea' ? (
            <textarea
              name={field.slug}
              placeholder={field.placeholder}
              value={String(values[field.slug] || '')}
              onChange={(e) => setFieldValue(field.slug, e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          ) : field.fieldType === 'select' && field.options ? (
            <select
              name={field.slug}
              value={String(values[field.slug] || '')}
              onChange={(e) => setFieldValue(field.slug, e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select...</option>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.fieldType}
              name={field.slug}
              placeholder={field.placeholder}
              value={String(values[field.slug] || '')}
              onChange={(e) => setFieldValue(field.slug, e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          
          {errors[field.slug] && (
            <p className="mt-1 text-sm text-red-500">{errors[field.slug]}</p>
          )}
          
          {field.helpText && (
            <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
          )}
        </div>
      ))}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : (form?.submitButtonText || 'Submit')}
      </button>
    </form>
  )
}

export default ${componentName}
`
}

async function createFormInUptrade(
  form: DetectedForm,
  slug: string,
  options: MigrationOptions
): Promise<string> {
  // Call Portal API to create the form
  const response = await fetch('https://api.uptrademedia.com/forms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      projectId: options.projectId,
      slug,
      name: formatName(form.componentName),
      formType: detectFormType(form),
      successMessage: 'Thanks for your submission!',
      submitButtonText: 'Submit',
      fields: form.fields.map((f, i) => ({
        slug: f.name,
        label: formatLabel(f.name),
        fieldType: mapFieldType(f.type),
        placeholder: f.placeholder,
        isRequired: f.required,
        sortOrder: i,
        width: 'full',
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create form')
  }

  const data = await response.json()
  return data.id
}

// ============================================
// Widget Migration
// ============================================

async function migrateWidget(
  filePath: string,
  widget: any,
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []

  if (options.dryRun) {
    changes.push(`[DRY RUN] Would remove ${widget.widgetType} script`)
    changes.push('[DRY RUN] Would enable Engage in SiteKitProvider')
    return { filePath, success: true, changes }
  }

  const fullPath = path.resolve(process.cwd(), filePath)
  let content = await fs.readFile(fullPath, 'utf-8')

  // Remove the widget script based on type
  switch (widget.widgetType) {
    case 'intercom':
      content = content.replace(/<Script[^>]*intercom[^>]*\/?>(?:<\/Script>)?/gi, '{/* Intercom replaced with Uptrade Engage */}')
      content = content.replace(/window\.Intercom\s*=\s*[^;]+;/g, '')
      break
    case 'crisp':
      content = content.replace(/<Script[^>]*crisp[^>]*\/?>(?:<\/Script>)?/gi, '{/* Crisp replaced with Uptrade Engage */}')
      break
    case 'drift':
      content = content.replace(/<Script[^>]*drift[^>]*\/?>(?:<\/Script>)?/gi, '{/* Drift replaced with Uptrade Engage */}')
      break
  }

  await fs.writeFile(fullPath, content, 'utf-8')
  changes.push(`Removed ${widget.widgetType} script`)
  changes.push('Enable Engage in SiteKitProvider to add chat widget')

  return { filePath, success: true, changes }
}

// ============================================
// Metadata Migration
// ============================================

/**
 * Match a balanced brace expression starting from a position
 * Returns the full matched content including braces, or null if no match
 */
function matchBalancedBraces(content: string, startIndex: number): string | null {
  if (content[startIndex] !== '{') return null
  
  let depth = 0
  let i = startIndex
  
  while (i < content.length) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) {
        return content.slice(startIndex, i + 1)
      }
    }
    i++
  }
  
  return null // Unbalanced braces
}

/**
 * Migrate Next.js metadata to getManagedMetadata
 * 
 * SAFETY: This function:
 * - Reads full file content
 * - Skips client components (they can't have metadata exports)
 * - Only modifies the metadata export, preserving everything else
 * - Uses balanced brace matching to avoid cutting off content
 */
export async function migrateMetadata(
  filePath: string,
  metadata: { title?: string; description?: string; type: string },
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []
  const fullPath = path.resolve(process.cwd(), filePath)

  // Determine page path from file path
  let pagePath = filePath
    .replace(/^app\//, '/')
    .replace(/^src\/app\//, '/')
    .replace(/\/page\.(tsx?|jsx?)$/, '')
    .replace(/\/layout\.(tsx?|jsx?)$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')

  if (pagePath === '') pagePath = '/'

  let content = await fs.readFile(fullPath, 'utf-8')

  // Determine file extension for new files
  const isTypeScript = filePath.endsWith('.tsx') || filePath.endsWith('.ts')
  const ext = isTypeScript ? '.tsx' : '.jsx'

  // Handle client components - create a layout file instead
  if (isClientComponent(content)) {
    const dir = path.dirname(fullPath)
    const layoutPath = path.join(dir, `layout${ext}`)
    
    // Check if layout already exists
    try {
      await fs.access(layoutPath)
      // Layout exists, check if it already has getManagedMetadata
      const layoutContent = await fs.readFile(layoutPath, 'utf-8')
      if (layoutContent.includes('getManagedMetadata')) {
        changes.push('Layout already has managed metadata')
        return { filePath, success: true, changes }
      }
      changes.push('Layout exists but does not have managed metadata - add generateMetadata manually')
      return { filePath, success: true, changes }
    } catch {
      // Layout doesn't exist, we'll create it
    }

    if (options.dryRun) {
      changes.push(`[DRY RUN] Client component detected - would create layout${ext} with managed metadata`)
      changes.push(`[DRY RUN] Page path: ${pagePath}`)
      return { filePath, success: true, changes }
    }

    // Create page record in Portal API
    try {
      await createPageMetadata(pagePath, metadata, options)
      changes.push(`Created managed metadata for page: ${pagePath}`)
    } catch (error: any) {
      changes.push(`Page metadata may already exist: ${pagePath}`)
    }

    // Generate the layout name from the directory
    // Handle dynamic route segments like [slug] -> Slug, [...slug] -> Slug
    const dirName = path.basename(dir)
      .replace(/^\[\.\.\.([^\]]+)\]$/, '$1') // [...slug] -> slug
      .replace(/^\[([^\]]+)\]$/, '$1')        // [slug] -> slug
    const layoutName = dirName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('') + 'Layout'

    // Create layout file with managed metadata AND schema
    const layoutCode = `import { getManagedMetadata, ManagedSchema } from '@uptrademedia/site-kit/seo'

export async function generateMetadata() {
  return getManagedMetadata({
    projectId: process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${isTypeScript ? '!' : ''},
    path: '${pagePath}',
    fallback: {
      title: '${(metadata.title || 'Page Title').replace(/'/g, "\\'")}',
      description: '${(metadata.description || 'Page description').replace(/'/g, "\\'")}',
    },
  })
}

export default function ${layoutName}({ children }${isTypeScript ? ': { children: React.ReactNode }' : ''}) {
  return (
    <>
      <ManagedSchema
        projectId={process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${isTypeScript ? '!' : ''}}
        path="${pagePath}"
      />
      {children}
    </>
  )
}
`

    await fs.writeFile(layoutPath, layoutCode, 'utf-8')
    changes.push(`Created layout${ext} with managed metadata and schema (client component page)`)
    return { filePath, success: true, changes }
  }

  if (options.dryRun) {
    changes.push(`[DRY RUN] Would create managed metadata for page: ${pagePath}`)
    changes.push('[DRY RUN] Would add generateMetadata function (preserving rest of file)')
    return { filePath, success: true, changes }
  }

  // Create page record in Portal API
  try {
    await createPageMetadata(pagePath, metadata, options)
    changes.push(`Created managed metadata for page: ${pagePath}`)
  } catch (error: any) {
    // Page might already exist, that's ok
    changes.push(`Page metadata may already exist: ${pagePath}`)
  }

  // Handle pages with no metadata - add generateMetadata to the file
  if (metadata.type === 'no-metadata') {
    // Add import with ManagedSchema
    if (!content.includes("'@uptrademedia/site-kit/seo") && !content.includes('"@uptrademedia/site-kit/seo')) {
      content = addImportSafely(content, `import { getManagedMetadata, ManagedSchema } from '@uptrademedia/site-kit/seo'`)
    } else if (!content.includes('ManagedSchema')) {
      content = addToExistingImport(content, 'ManagedSchema', '@uptrademedia/site-kit/seo')
    }

    // Build the generateMetadata function
    const generateMetadataCode = `
export async function generateMetadata() {
  return getManagedMetadata({
    projectId: process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${isTypeScript ? '!' : ''},
    path: '${pagePath}',
    fallback: {
      title: '${(metadata.title || 'Page Title').replace(/'/g, "\\'")}',
      description: '${(metadata.description || 'Page description').replace(/'/g, "\\'")}',
    },
  })
}
`

    // Find a good place to add it - after imports, before the first export/function
    const importEndMatch = content.match(/^(import\s+.*?['"][^'"]+['"];?\s*\n)+/m)
    if (importEndMatch) {
      const insertPos = importEndMatch.index! + importEndMatch[0].length
      content = content.slice(0, insertPos) + generateMetadataCode + content.slice(insertPos)
    } else {
      // No imports, add at the beginning (after 'use client' if present)
      const useClientMatch = content.match(/^['"]use client['"];?\s*\n/)
      if (useClientMatch) {
        const insertPos = useClientMatch[0].length
        content = content.slice(0, insertPos) + generateMetadataCode + content.slice(insertPos)
      } else {
        content = generateMetadataCode + content
      }
    }

    // Insert ManagedSchema into the component's JSX
    content = insertManagedSchemaIntoJSX(content, pagePath, isTypeScript)
    changes.push('Added ManagedSchema component')

    await fs.writeFile(fullPath, content, 'utf-8')
    changes.push('Added generateMetadata function')
    return { filePath, success: true, changes }
  }

  // Replace static metadata export with getManagedMetadata
  if (metadata.type === 'next-metadata') {
    // Handle: export const metadata = { ... }
    // Use a safer approach: find the export start, then match balanced braces
    const metadataExportMatch = content.match(/export const metadata(?::\s*Metadata)?\s*=\s*/)
    
    if (metadataExportMatch && metadataExportMatch.index !== undefined) {
      const braceStart = metadataExportMatch.index + metadataExportMatch[0].length
      const braceContent = matchBalancedBraces(content, braceStart)
      
      if (braceContent) {
        const fullMatch = metadataExportMatch[0] + braceContent
        
        // Add import safely with ManagedSchema
        if (!content.includes("'@uptrademedia/site-kit/seo") && !content.includes('"@uptrademedia/site-kit/seo')) {
          content = addImportSafely(content, `import { getManagedMetadata, ManagedSchema } from '@uptrademedia/site-kit/seo'`)
        } else if (!content.includes('ManagedSchema')) {
          content = addToExistingImport(content, 'ManagedSchema', '@uptrademedia/site-kit/seo')
        }

        // Build the replacement generateMetadata function
        const generateMetadataCode = `export async function generateMetadata() {
  return getManagedMetadata({
    projectId: process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${isTypeScript ? '!' : ''},
    path: '${pagePath}',
    fallback: {
      title: '${(metadata.title || 'Page Title').replace(/'/g, "\\'")}',
      description: '${(metadata.description || 'Page description').replace(/'/g, "\\'")}',
    },
  })
}`

        // Replace only the metadata export
        content = content.replace(fullMatch, generateMetadataCode)
        changes.push('Replaced static metadata with getManagedMetadata')
        
        // Insert ManagedSchema into the component's JSX
        content = insertManagedSchemaIntoJSX(content, pagePath, isTypeScript)
        changes.push('Added ManagedSchema component')
      }
    }

    // Handle existing generateMetadata - just add a comment, don't modify
    if (content.includes('generateMetadata') && !content.includes('getManagedMetadata')) {
      changes.push('generateMetadata function detected - add getManagedMetadata manually for full control')
    }
  }

  await fs.writeFile(fullPath, content, 'utf-8')
  return { filePath, success: true, changes }
}

async function createPageMetadata(
  pagePath: string,
  metadata: { title?: string; description?: string },
  options: MigrationOptions
): Promise<void> {
  const response = await fetch('https://api.uptrademedia.com/seo/pages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify({
      project_id: options.projectId,
      path: pagePath,
      managed_title: metadata.title,
      managed_meta_description: metadata.description,
    }),
  })

  if (!response.ok && response.status !== 409) {
    throw new Error(`Failed to create page: ${response.statusText}`)
  }
}

// ============================================
// Schema Migration  
// ============================================

/**
 * Extract JSON-LD schema content from a script tag
 */
function extractSchemaJSON(content: string): { schemaType: string; schemaJson: object } | null {
  // Pattern to match script tag with JSON-LD content
  const scriptPatterns = [
    /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    /<Script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/Script>/i,
  ]
  
  for (const pattern of scriptPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      try {
        // Try to parse the JSON content
        let jsonStr = match[1].trim()
        
        // Handle JSX expression containers: {`...`} or {"..."}
        if (jsonStr.startsWith('{') && (jsonStr.includes('`') || jsonStr.includes('"'))) {
          // Extract content between template literals or JSON.stringify
          const templateMatch = jsonStr.match(/\{[`"]([\s\S]*?)[`"]\}/)
          if (templateMatch) {
            jsonStr = templateMatch[1]
          }
        }
        
        // Handle dangerouslySetInnerHTML pattern
        const innerHTMLMatch = jsonStr.match(/dangerouslySetInnerHTML=\{\{\s*__html:\s*['"`]([\s\S]*?)['"`]\s*\}\}/)
        if (innerHTMLMatch) {
          jsonStr = innerHTMLMatch[1]
        }
        
        // Try to parse as JSON
        const parsed = JSON.parse(jsonStr)
        return {
          schemaType: parsed['@type'] || 'Unknown',
          schemaJson: parsed,
        }
      } catch {
        // JSON parsing failed, schema might be dynamic
        return null
      }
    }
  }
  
  // Also try to find schema objects in code
  const schemaObjectMatch = content.match(/const\s+\w*[sS]chema\w*\s*=\s*(\{[\s\S]*?@context[\s\S]*?\})\s*;?/)
  if (schemaObjectMatch) {
    try {
      // This is tricky - the object might use JS syntax not JSON
      // For now, just extract the @type if we can
      const typeMatch = schemaObjectMatch[1].match(/@type["']?\s*:\s*["']([^"']+)["']/)
      if (typeMatch) {
        return {
          schemaType: typeMatch[1],
          schemaJson: { '@type': typeMatch[1], '_note': 'Schema extracted from JS object - review in Portal' },
        }
      }
    } catch {
      return null
    }
  }
  
  return null
}

/**
 * Create schema record in Portal API
 */
async function createSchemaRecord(
  pagePath: string,
  schemaType: string,
  schemaJson: object,
  options: MigrationOptions
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  
  const response = await fetch(`${apiUrl}/api/public/seo/register-schema`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': options.apiKey,
    },
    body: JSON.stringify({
      page_path: pagePath,
      schema_type: schemaType,
      schema_json: schemaJson,
      is_implemented: true,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create schema: ${response.status} ${errorText}`)
  }
}

/**
 * Migrate JSON-LD schema to ManagedSchema component
 * 
 * This function:
 * 1. Extracts existing JSON-LD schema content
 * 2. Creates a managed schema record in the Portal database
 * 3. Replaces the script tag with ManagedSchema component
 * 
 * SAFETY: Skips client components since ManagedSchema requires server rendering
 */
export async function migrateSchema(
  filePath: string,
  schema: { schemaType?: string; startLine: number; endLine: number },
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []
  const fullPath = path.resolve(process.cwd(), filePath)

  // Determine page path from file path
  let pagePath = filePath
    .replace(/^app\//, '/')
    .replace(/^src\/app\//, '/')
    .replace(/\/page\.(tsx?|jsx?)$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')

  if (pagePath === '') pagePath = '/'

  let content = await fs.readFile(fullPath, 'utf-8')

  // Skip client components - ManagedSchema requires server rendering
  if (isClientComponent(content)) {
    changes.push('Skipped: Client component cannot use ManagedSchema (requires server rendering)')
    changes.push('Consider moving schema to a parent server component or layout.tsx')
    return { filePath, success: true, changes }
  }

  // Extract existing schema content
  const extractedSchema = extractSchemaJSON(content)

  if (options.dryRun) {
    changes.push(`[DRY RUN] Would replace JSON-LD script with ManagedSchema component`)
    changes.push(`[DRY RUN] Schema type: ${extractedSchema?.schemaType || schema.schemaType || 'Unknown'}`)
    if (extractedSchema) {
      changes.push(`[DRY RUN] Would upload extracted schema to Portal`)
    }
    return { filePath, success: true, changes }
  }

  // Create schema record in Portal API with extracted content
  if (extractedSchema) {
    try {
      await createSchemaRecord(pagePath, extractedSchema.schemaType, extractedSchema.schemaJson, options)
      changes.push(`Created managed schema (${extractedSchema.schemaType}) for: ${pagePath}`)
    } catch (error: any) {
      changes.push(`Schema record may already exist for: ${pagePath}`)
    }
  }

  // Check if ManagedSchema is already in the JSX (may have been added by metadata migration)
  const alreadyHasManagedSchema = content.includes('<ManagedSchema')

  // Determine if file is TypeScript
  const isTypeScript = filePath.endsWith('.tsx') || filePath.endsWith('.ts')
  const projectIdSuffix = isTypeScript ? '!' : ''

  // Find JSON-LD scripts
  const jsonLdPattern = /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
  const scriptPattern = /<Script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/Script>/gi

  const hasJsonLd = jsonLdPattern.test(content) || scriptPattern.test(content)
  
  if (hasJsonLd) {
    // Reset regex after test
    jsonLdPattern.lastIndex = 0
    scriptPattern.lastIndex = 0
    
    if (alreadyHasManagedSchema) {
      // ManagedSchema already exists (from metadata migration) - just remove the script tags
      content = content.replace(jsonLdPattern, '{/* JSON-LD migrated to ManagedSchema */}')
      content = content.replace(scriptPattern, '{/* JSON-LD migrated to ManagedSchema */}')
      changes.push('Removed JSON-LD script (ManagedSchema already present)')
    } else {
      // Add import for ManagedSchema safely
      if (!content.includes('ManagedSchema')) {
        if (content.includes("'@uptrademedia/site-kit/seo") || content.includes('"@uptrademedia/site-kit/seo')) {
          content = addToExistingImport(content, 'ManagedSchema', '@uptrademedia/site-kit/seo')
        } else {
          content = addImportSafely(content, `import { ManagedSchema } from '@uptrademedia/site-kit/seo'`)
        }
        changes.push('Added ManagedSchema import')
      }
      
      // Replace existing schema script with ManagedSchema component
      content = content.replace(jsonLdPattern, `<ManagedSchema 
        projectId={process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${projectIdSuffix}}
        path="${pagePath}"
      />`)
      content = content.replace(scriptPattern, `<ManagedSchema 
        projectId={process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${projectIdSuffix}}
        path="${pagePath}"
      />`)
      changes.push('Replaced JSON-LD script with ManagedSchema component')
    }
  }

  await fs.writeFile(fullPath, content, 'utf-8')
  return { filePath, success: true, changes }
}

// ============================================
// FAQ Migration
// ============================================

/**
 * Extract FAQ items from various FAQ patterns in the code
 */
function extractFAQItems(content: string, faqType: string): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = []
  
  // Pattern for details/summary elements
  if (faqType === 'details-summary') {
    const detailsPattern = /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi
    let match
    while ((match = detailsPattern.exec(content)) !== null) {
      const question = match[1].replace(/<[^>]+>/g, '').trim()
      const answer = match[2].replace(/<[^>]+>/g, '').trim()
      if (question && answer) {
        items.push({ question, answer })
      }
    }
  }
  
  // Pattern for accordion components with question/answer props
  const accordionItemPattern = /<(?:Accordion\.Item|AccordionItem|FAQItem)[^>]*(?:question|title)=["'`]([^"'`]+)["'`][^>]*>[\s\S]*?(?:answer|content)=["'`]([^"'`]+)["'`]/gi
  let match
  while ((match = accordionItemPattern.exec(content)) !== null) {
    items.push({ question: match[1], answer: match[2] })
  }
  
  // Pattern for FAQ arrays/objects in code: { question: "...", answer: "..." }
  const faqArrayPattern = /\{\s*question:\s*["'`]([^"'`]+)["'`]\s*,\s*answer:\s*["'`]([^"'`]+)["'`]\s*\}/gi
  while ((match = faqArrayPattern.exec(content)) !== null) {
    items.push({ question: match[1], answer: match[2] })
  }
  
  // Alternative pattern: { q: "...", a: "..." }
  const shortFaqPattern = /\{\s*q:\s*["'`]([^"'`]+)["'`]\s*,\s*a:\s*["'`]([^"'`]+)["'`]\s*\}/gi
  while ((match = shortFaqPattern.exec(content)) !== null) {
    items.push({ question: match[1], answer: match[2] })
  }
  
  return items
}

/**
 * Create FAQ record in Portal API
 */
async function createFAQRecord(
  pagePath: string,
  items: Array<{ question: string; answer: string }>,
  options: MigrationOptions
): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  
  const response = await fetch(`${apiUrl}/api/public/seo/register-faq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': options.apiKey,
    },
    body: JSON.stringify({
      path: pagePath,
      title: 'Frequently Asked Questions',
      items: items.map((item, index) => ({
        id: `faq-${index + 1}`,
        question: item.question,
        answer: item.answer,
        order: index,
        is_visible: true,
      })),
      include_schema: true,
      is_published: items.length > 0,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to create FAQ: ${response.status} ${errorText}`)
  }
}

/**
 * Migrate FAQ section to ManagedFAQ component
 * 
 * This function:
 * 1. Extracts FAQ content (questions/answers) from existing components
 * 2. Creates a managed FAQ record in the Portal database
 * 3. Inserts the ManagedFAQ component into the page
 * 
 * SAFETY: Skips client components since ManagedFAQ requires server rendering
 */
export async function migrateFAQ(
  filePath: string,
  faq: { type: string; componentName?: string; hasSchema: boolean; startLine: number; endLine: number },
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []
  const fullPath = path.resolve(process.cwd(), filePath)

  // Determine page path from file path
  let pagePath = filePath
    .replace(/^app\//, '/')
    .replace(/^src\/app\//, '/')
    .replace(/\/page\.(tsx?|jsx?)$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')

  if (pagePath === '') pagePath = '/'

  let content = await fs.readFile(fullPath, 'utf-8')

  // Skip client components - ManagedFAQ requires server rendering
  if (isClientComponent(content)) {
    changes.push('Skipped: Client component cannot use ManagedFAQ (requires server rendering)')
    changes.push('Consider using ManagedFAQ in a parent server component or layout.tsx')
    return { filePath, success: true, changes }
  }

  // Extract FAQ items from the existing code
  const extractedItems = extractFAQItems(content, faq.type)
  
  if (options.dryRun) {
    changes.push(`[DRY RUN] Would extract ${extractedItems.length} FAQ items`)
    changes.push(`[DRY RUN] Would create managed FAQ record for path: ${pagePath}`)
    changes.push(`[DRY RUN] Would insert ManagedFAQ component`)
    changes.push(`[DRY RUN] FAQ type: ${faq.type}${faq.componentName ? ` (${faq.componentName})` : ''}`)
    return { filePath, success: true, changes }
  }

  // Create FAQ record in Portal API
  if (extractedItems.length > 0) {
    try {
      await createFAQRecord(pagePath, extractedItems, options)
      changes.push(`Created managed FAQ with ${extractedItems.length} items for: ${pagePath}`)
    } catch (error: any) {
      changes.push(`FAQ record may already exist for: ${pagePath}`)
    }
  } else {
    // Create empty FAQ record for manual population
    try {
      await createFAQRecord(pagePath, [], options)
      changes.push(`Created empty managed FAQ for: ${pagePath} (add items in Portal)`)
    } catch {
      changes.push(`FAQ record may already exist for: ${pagePath}`)
    }
  }

  // Add import for ManagedFAQ safely
  if (!content.includes('ManagedFAQ')) {
    if (content.includes("'@uptrademedia/site-kit/seo") || content.includes('"@uptrademedia/site-kit/seo')) {
      content = addToExistingImport(content, 'ManagedFAQ', '@uptrademedia/site-kit/seo')
    } else {
      content = addImportSafely(content, `import { ManagedFAQ } from '@uptrademedia/site-kit/seo'`)
    }
    changes.push('Added ManagedFAQ import')
  }

  // Determine if file is TypeScript for proper syntax
  const isTypeScript = filePath.endsWith('.tsx') || filePath.endsWith('.ts')
  const projectIdSuffix = isTypeScript ? '!' : ''

  const managedFAQComponent = `<ManagedFAQ
      projectId={process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID${projectIdSuffix}}
      path="${pagePath}"
    />`

  // Try to insert ManagedFAQ component near the existing FAQ
  // Look for the FAQ component/section and insert before it
  if (faq.componentName) {
    // Look for the component tag and insert before it
    const componentPattern = new RegExp(`(<${faq.componentName}[^>]*>)`, 'i')
    if (componentPattern.test(content)) {
      content = content.replace(componentPattern, `{/* Managed FAQ - content controlled via Portal */}\n    ${managedFAQComponent}\n    {/* Original FAQ component (can be removed once migrated) */}\n    $1`)
      changes.push('Inserted ManagedFAQ component before existing FAQ')
    }
  } else if (faq.type === 'details-summary') {
    // For details/summary, look for the first <details> tag
    const detailsMatch = content.match(/<details[^>]*>/)
    if (detailsMatch && detailsMatch.index !== undefined) {
      content = content.slice(0, detailsMatch.index) + 
        `{/* Managed FAQ - content controlled via Portal */}\n    ${managedFAQComponent}\n    {/* Original FAQ (can be removed once migrated) */}\n    ` + 
        content.slice(detailsMatch.index)
      changes.push('Inserted ManagedFAQ component before details/summary FAQ')
    }
  }

  // If we couldn't insert near the FAQ, add a comment with instructions
  if (!changes.some(c => c.includes('Inserted ManagedFAQ'))) {
    changes.push(`Add ManagedFAQ to your page JSX: ${managedFAQComponent}`)
  }

  await fs.writeFile(fullPath, content, 'utf-8')
  return { filePath, success: true, changes }
}

// ============================================
// Sitemap Migration
// ============================================

/**
 * Migrate sitemap configuration to Site-Kit managed sitemap
 */
export async function migrateSitemap(
  filePath: string,
  sitemap: { type: string; generator?: string },
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []
  const fullPath = path.resolve(process.cwd(), filePath)

  if (options.dryRun) {
    changes.push(`[DRY RUN] Would migrate ${sitemap.type} to Site-Kit sitemap`)
    if (sitemap.type === 'next-sitemap-config') {
      changes.push('[DRY RUN] Would update next-sitemap.config.js to use Site-Kit URLs')
    }
    return { filePath, success: true, changes }
  }

  // For next-sitemap configs, we can update the siteUrl and add additionalSitemaps
  if (sitemap.type === 'next-sitemap-config') {
    let content = await fs.readFile(fullPath, 'utf-8')

    // Add comment about Site-Kit integration
    if (!content.includes('Site-Kit')) {
      content = `/**
 * Site-Kit Integration
 * 
 * Pages are automatically synced to Portal SEO module.
 * Manage URLs, priorities, and change frequencies in the Portal.
 */
` + content
    }

    await fs.writeFile(fullPath, content, 'utf-8')
    changes.push('Added Site-Kit integration comment to sitemap config')
    changes.push('Configure sitemap settings in Portal SEO module for centralized management')
  }

  // For custom app/sitemap.ts files
  if (sitemap.type === 'custom-sitemap' && filePath.includes('sitemap')) {
    changes.push('Custom sitemap detected - consider using Site-Kit\'s createSitemap helper')
    changes.push('Import: import { createSitemap } from \'@uptrademedia/site-kit/seo\'')
  }

  return { filePath, success: true, changes }
}

// ============================================
// Analytics Migration
// ============================================

/**
 * Migrate analytics scripts (mostly informational - we don't remove existing analytics)
 */
export async function migrateAnalytics(
  filePath: string,
  analytics: { type: string; trackingId?: string },
  options: MigrationOptions
): Promise<MigrationResult> {
  const changes: string[] = []

  // Analytics migration is mainly informational
  // We don't want to break existing tracking, but we note that SiteKitProvider can handle analytics
  if (options.dryRun) {
    changes.push(`[DRY RUN] Detected ${analytics.type}${analytics.trackingId ? ` (${analytics.trackingId})` : ''}`)
    changes.push('[DRY RUN] Would recommend moving to SiteKitProvider analytics')
    return { filePath, success: true, changes }
  }

  changes.push(`Detected ${analytics.type}${analytics.trackingId ? ` (${analytics.trackingId})` : ''}`)
  changes.push('SiteKitProvider supports analytics integration')
  changes.push('Configure analytics in project settings to consolidate tracking')
  
  // Don't actually modify the file - just report what was found
  return { filePath, success: true, changes }
}

// ============================================
// Single File Migration
// ============================================

/**
 * Migrate a single file to Site-Kit
 */
export async function migrateFile(
  filePath: string,
  options: MigrationOptions
): Promise<MigrationResult> {
  const fullPath = path.resolve(filePath)
  const relPath = path.relative(process.cwd(), fullPath)

  // Read and parse the file
  const content = await fs.readFile(fullPath, 'utf-8')
  
  // Simple detection: check if it looks like a form
  const hasFormTag = content.includes('<form') || content.includes('onSubmit')
  const hasWidget = /intercom|crisp|drift|hubspot|zendesk/i.test(content)

  if (!hasFormTag && !hasWidget) {
    return {
      filePath: relPath,
      success: false,
      changes: [],
      error: 'No migratable components found in file',
    }
  }

  // For widgets, do a simple replacement
  if (hasWidget) {
    const widgetType = content.toLowerCase().includes('intercom') ? 'intercom' as const :
                       content.toLowerCase().includes('crisp') ? 'crisp' as const :
                       content.toLowerCase().includes('drift') ? 'drift' as const :
                       content.toLowerCase().includes('hubspot') ? 'hubspot' as const :
                       content.toLowerCase().includes('zendesk') ? 'zendesk' as const :
                       'other' as const

    return migrateWidget(relPath, {
      filePath: relPath,
      widgetType,
      startLine: 0,
      endLine: 0,
    }, options)
  }

  // For forms, we need to scan first
  const { parse } = await import('@babel/parser')
  const ast = parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  // Find form component name
  let componentName = 'Form'
  const traverse = (await import('@babel/traverse')).default
  traverse(ast, {
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration
      if (decl && decl.type === 'FunctionDeclaration' && decl.id) {
        componentName = decl.id.name
        path.stop()
      }
    },
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration
      if (decl && decl.type === 'FunctionDeclaration' && decl.id) {
        componentName = decl.id.name
        path.stop()
      }
    },
  })

  const form: DetectedForm = {
    filePath: relPath,
    componentName,
    fields: [],
    hasValidation: false,
    formLibrary: 'native',
    submitsTo: null,
    complexity: 'simple',
    suggestedAction: 'auto-migrate',
    startLine: 0,
    endLine: 0,
  }

  return migrateForm(form, options)
}

// ============================================
// Helpers
// ============================================

function generateSlug(name: string): string {
  return name
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/form$/i, '')
    .replace(/-+/g, '-')
    .replace(/-$/, '') || 'form'
}

function formatName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function formatLabel(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

function mapFieldType(type: string): string {
  const mapping: Record<string, string> = {
    'text': 'text',
    'email': 'email',
    'tel': 'phone',
    'phone': 'phone',
    'number': 'number',
    'textarea': 'textarea',
    'select': 'select',
    'checkbox': 'checkbox',
    'radio': 'radio',
    'date': 'date',
    'file': 'file',
    'url': 'url',
    'password': 'text', // Don't use password for managed forms
  }
  return mapping[type] || 'text'
}

function detectFormType(form: DetectedForm): string {
  const name = form.componentName.toLowerCase()
  const fields = form.fields.map(f => f.name.toLowerCase()).join(' ')

  if (name.includes('contact') || fields.includes('message')) return 'contact'
  if (name.includes('newsletter') || name.includes('subscribe')) return 'newsletter'
  if (name.includes('quote') || name.includes('estimate')) return 'prospect'
  if (name.includes('support') || name.includes('help')) return 'support'
  if (name.includes('feedback')) return 'feedback'

  return 'contact'
}
