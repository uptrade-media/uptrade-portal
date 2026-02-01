/**
 * Scan Command - Scan codebase for forms, metadata, widgets, schemas, FAQs, analytics, and images
 */

import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { scanCodebase, type ScanResults } from '../scanner'

interface ScanOptions {
  dir?: string
  forms?: boolean
  meta?: boolean
  widgets?: boolean
  schemas?: boolean
  faqs?: boolean
  analytics?: boolean
  images?: boolean
  sitemaps?: boolean
}

export async function scanCommand(options: ScanOptions) {
  console.log('')
  console.log(chalk.bold('  Scanning codebase...'))
  console.log('')

  const targetDir = path.resolve(options.dir || '.')
  const spinner = ora('Looking for forms, metadata, widgets, schemas, FAQs, analytics, and images...').start()
  
  let scanResults: ScanResults
  try {
    scanResults = await scanCodebase(targetDir)
    spinner.stop()
  } catch (error: any) {
    spinner.fail('Scan failed')
    console.log(chalk.red(`  ${error.message}`))
    process.exit(1)
  }

  // Determine what to show - if no specific flag set, show all
  const noSpecificFlags = !options.forms && !options.meta && !options.widgets && 
                          !options.schemas && !options.faqs && !options.analytics && 
                          !options.images && !options.sitemaps
  
  const showForms = noSpecificFlags || options.forms
  const showMeta = noSpecificFlags || options.meta
  const showWidgets = noSpecificFlags || options.widgets
  const showSchemas = noSpecificFlags || options.schemas
  const showFAQs = noSpecificFlags || options.faqs
  const showAnalytics = noSpecificFlags || options.analytics
  const showImages = noSpecificFlags || options.images
  const showSitemaps = noSpecificFlags || options.sitemaps

  console.log(chalk.bold('  Scan Results:'))
  console.log('')

  // Forms
  if (showForms) {
    console.log(chalk.bold.cyan(`  📝 Forms: ${scanResults.forms.length}`))
    if (scanResults.forms.length > 0) {
      scanResults.forms.forEach(form => {
        console.log(chalk.gray(`     └─ ${form.filePath}`))
        console.log(chalk.gray(`        Component: ${form.componentName || 'Anonymous'}`))
        console.log(chalk.gray(`        Fields: ${form.fields.map(f => f.name).join(', ')}`))
        console.log(chalk.gray(`        Library: ${form.formLibrary} | Complexity: ${form.complexity}`))
      })
    } else {
      console.log(chalk.gray('     No forms detected'))
    }
    console.log('')
  }

  // Metadata
  if (showMeta) {
    console.log(chalk.bold.cyan(`  🏷️  Metadata: ${scanResults.metadata.length} pages`))
    if (scanResults.metadata.length > 0) {
      scanResults.metadata.forEach(meta => {
        console.log(chalk.gray(`     └─ ${meta.filePath}`))
        if (meta.title) console.log(chalk.gray(`        Title: "${meta.title}"`))
        if (meta.description) console.log(chalk.gray(`        Description: "${meta.description.substring(0, 50)}..."`))
        console.log(chalk.gray(`        Type: ${meta.type}`))
      })
    } else {
      console.log(chalk.gray('     No metadata detected'))
    }
    console.log('')
  }

  // Widgets
  if (showWidgets) {
    console.log(chalk.bold.cyan(`  💬 Widgets: ${scanResults.widgets.length}`))
    if (scanResults.widgets.length > 0) {
      scanResults.widgets.forEach(widget => {
        console.log(chalk.gray(`     └─ ${widget.filePath}`))
        console.log(chalk.gray(`        Type: ${widget.widgetType}`))
      })
    } else {
      console.log(chalk.gray('     No third-party widgets detected'))
    }
    console.log('')
  }

  // Schemas
  if (showSchemas) {
    console.log(chalk.bold.cyan(`  📊 Schema Markup: ${scanResults.schemas.length}`))
    if (scanResults.schemas.length > 0) {
      scanResults.schemas.forEach(schema => {
        console.log(chalk.gray(`     └─ ${schema.filePath}`))
        console.log(chalk.gray(`        Type: ${schema.type} (${schema.schemaType || 'Unknown'})`))
      })
    } else {
      console.log(chalk.gray('     No schema markup detected'))
    }
    console.log('')
  }

  // FAQs
  if (showFAQs) {
    console.log(chalk.bold.cyan(`  ❓ FAQ Sections: ${scanResults.faqs.length}`))
    if (scanResults.faqs.length > 0) {
      scanResults.faqs.forEach(faq => {
        console.log(chalk.gray(`     └─ ${faq.filePath}`))
        console.log(chalk.gray(`        Type: ${faq.type}${faq.componentName ? ` (${faq.componentName})` : ''}`))
        console.log(chalk.gray(`        Has Schema: ${faq.hasSchema ? 'Yes' : 'No'}`))
        if (faq.itemCount) console.log(chalk.gray(`        Items: ${faq.itemCount}`))
      })
    } else {
      console.log(chalk.gray('     No FAQ sections detected'))
    }
    console.log('')
  }

  // Analytics
  if (showAnalytics) {
    console.log(chalk.bold.cyan(`  📈 Analytics: ${scanResults.analytics.length}`))
    if (scanResults.analytics.length > 0) {
      scanResults.analytics.forEach(analytics => {
        console.log(chalk.gray(`     └─ ${analytics.filePath}`))
        console.log(chalk.gray(`        Type: ${analytics.type}${analytics.trackingId ? ` (${analytics.trackingId})` : ''}`))
      })
    } else {
      console.log(chalk.gray('     No analytics scripts detected'))
    }
    console.log('')
  }

  // Sitemaps
  if (showSitemaps) {
    console.log(chalk.bold.cyan(`  🗺️  Sitemaps: ${scanResults.sitemaps.length}`))
    if (scanResults.sitemaps.length > 0) {
      scanResults.sitemaps.forEach(sitemap => {
        console.log(chalk.gray(`     └─ ${sitemap.filePath}`))
        console.log(chalk.gray(`        Type: ${sitemap.type} (${sitemap.generator || 'unknown'})`))
      })
    } else {
      console.log(chalk.gray('     No sitemap configurations detected'))
    }
    console.log('')
  }

  // Images
  if (showImages) {
    // Group images by file for cleaner output
    const imagesByFile = new Map<string, typeof scanResults.images>()
    for (const img of scanResults.images) {
      if (!imagesByFile.has(img.filePath)) {
        imagesByFile.set(img.filePath, [])
      }
      imagesByFile.get(img.filePath)!.push(img)
    }

    console.log(chalk.bold.cyan(`  🖼️  Images: ${scanResults.images.length} in ${imagesByFile.size} files`))
    if (scanResults.images.length > 0) {
      // Only show first 10 files to avoid flooding
      let count = 0
      for (const [filePath, images] of imagesByFile) {
        if (count >= 10) {
          console.log(chalk.gray(`     ... and ${imagesByFile.size - 10} more files`))
          break
        }
        console.log(chalk.gray(`     └─ ${filePath} (${images.length} images)`))
        for (const img of images.slice(0, 3)) {
          console.log(chalk.gray(`        ${img.type}: ${img.src?.substring(0, 40) || 'dynamic'}${img.src && img.src.length > 40 ? '...' : ''}`))
        }
        if (images.length > 3) {
          console.log(chalk.gray(`        ... and ${images.length - 3} more`))
        }
        count++
      }
    } else {
      console.log(chalk.gray('     No images detected'))
    }
    console.log('')
  }

  // Summary
  const migratable = scanResults.forms.length + scanResults.metadata.length + 
                     scanResults.widgets.length + scanResults.schemas.length + 
                     scanResults.faqs.length + scanResults.sitemaps.length

  if (migratable > 0) {
    console.log(chalk.bold('  Summary:'))
    console.log(chalk.gray(`     ${migratable} migratable components detected`))
    console.log('')
    console.log(chalk.bold('  Next Steps:'))
    console.log(chalk.gray('  Run `uptrade-setup migrate` to migrate detected components to Site-Kit'))
    console.log(chalk.gray('  Run `uptrade-setup images` to upload and manage images'))
    console.log('')
  } else {
    console.log(chalk.green('  ✓ Codebase is clean - no legacy components detected'))
    console.log('')
  }
}
