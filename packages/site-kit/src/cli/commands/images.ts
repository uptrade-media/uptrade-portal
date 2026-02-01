/**
 * Images Command - Scan, upload, and migrate images to managed images
 * 
 * Usage:
 *   npx uptrade-setup images scan       # Find images in public folder
 *   npx uptrade-setup images upload     # Upload to Files module
 *   npx uptrade-setup images migrate    # Replace with ManagedImage components
 */

import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs/promises'
import { readFileSync } from 'fs'

// ============================================
// Types
// ============================================

export interface DetectedImage {
  /** Path relative to project root */
  filePath: string
  /** Just the filename */
  filename: string
  /** File size in bytes */
  fileSize: number
  /** MIME type */
  mimeType: string
  /** Files in codebase that reference this image */
  usedIn: ImageUsage[]
  /** Suggested slot ID for ManagedImage */
  suggestedSlotId: string
  /** Category based on folder/usage */
  category: string
  /** Is this a critical LCP image that should stay local for PageSpeed? */
  isCritical: boolean
  /** Reason why image is considered critical */
  criticalReason?: string
}

export interface ImageUsage {
  /** File that uses this image */
  filePath: string
  /** Line number */
  line: number
  /** The JSX/HTML element type (img, Image, background-image) */
  elementType: string
  /** Component name if available */
  componentName?: string
  /** Alt text if present */
  altText?: string
  /** Can be auto-migrated? */
  canAutoMigrate: boolean
}

export interface ImageScanResults {
  images: DetectedImage[]
  totalSize: number
  usageCount: number
}

export interface UploadedImage {
  localPath: string
  fileId: string
  publicUrl: string
  slotId?: string
}

// ============================================
// Image Extensions
// ============================================

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp', '.avif']

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
}

/** Derive URL page path from source file path (Next.js App Router, Pages, or fallback). */
function filePathToPagePath(filePath: string): string {
  let p = filePath
  // Next.js App Router: app/page.jsx → /, app/about/page.jsx → /about
  if (p.startsWith('app/') || p.startsWith('src/app/')) {
    p = p.replace(/^app\//, '').replace(/^src\/app\//, '')
    p = p.replace(/\/page\.(tsx?|jsx?)$/, '').replace(/\/layout\.(tsx?|jsx?)$/, '')
    p = p.replace(/\[([^\]]+)\]/g, ':$1')
    return p === '' ? '/' : '/' + p.replace(/\\/g, '/')
  }
  // Next.js Pages: pages/index.jsx → /, pages/about.jsx → /about
  if (p.startsWith('pages/') || p.startsWith('src/pages/')) {
    p = p.replace(/^pages\//, '').replace(/^src\/pages\//, '')
    const base = path.basename(p, path.extname(p))
    return base === 'index' ? '/' : '/' + base
  }
  // Fallback: strip extension, leading slash
  p = p.replace(/\.[^.]+$/, '').replace(/^\.\//, '').replace(/\\/g, '/')
  return p === '' || p === 'index' ? '/' : '/' + p
}

// ============================================
// Main Command Handler
// ============================================

interface ImagesOptions {
  dir?: string
  dryRun?: boolean
  folder?: string
  category?: string
  skipCritical?: boolean
}

export async function imagesCommand(subcommand: string, options: ImagesOptions) {
  console.log('')
  console.log(chalk.bold('  Site-Kit Image Manager'))
  console.log('')

  switch (subcommand) {
    case 'scan':
      await scanImages(options)
      break
    case 'upload':
      await uploadImages(options)
      break
    case 'migrate':
      await migrateImages(options)
      break
    case 'replace-urls':
      await replaceWithCdnUrls(options)
      break
    case 'refresh':
      await refreshManifest(options)
      break
    case 'all':
      await uploadAndMigrate(options)
      break
    default:
      console.log(chalk.red(`  Unknown subcommand: ${subcommand}`))
      console.log('')
      console.log(chalk.bold('  Commands:'))
      console.log(chalk.gray('    scan         - Find images in public folder and analyze usage'))
      console.log(chalk.gray('    upload       - Upload images to Portal Files'))
      console.log(chalk.gray('    migrate      - Create slots and replace <img>/<Image> with ManagedImage'))
      console.log(chalk.gray('    replace-urls - Replace local paths with CDN URLs (for data files)'))
      console.log(chalk.gray('    refresh      - Refresh manifest with CDN URLs from Portal'))
      console.log(chalk.gray('    all          - Upload + migrate in one step'))
      process.exit(1)
  }
}

// ============================================
// Scan Images
// ============================================

async function scanImages(options: ImagesOptions) {
  const targetDir = path.resolve(options.dir || '.')
  const publicDir = path.join(targetDir, 'public')
  
  // Check if public folder exists
  try {
    await fs.access(publicDir)
  } catch {
    console.log(chalk.yellow('  ⚠ No public folder found'))
    console.log(chalk.gray('    This command scans for images in your public folder.'))
    console.log('')
    return
  }

  const spinner = ora('Scanning for images...').start()
  
  const results = await scanPublicImages(targetDir)
  spinner.stop()

  if (results.images.length === 0) {
    console.log(chalk.green('  ✓ No images found in public folder'))
    console.log('')
    return
  }

  // Group by category
  const byCategory = new Map<string, DetectedImage[]>()
  for (const img of results.images) {
    const cat = img.category
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push(img)
  }

  console.log(chalk.bold(`  Found ${results.images.length} images (${formatBytes(results.totalSize)}):`))
  console.log('')

  for (const [category, images] of byCategory) {
    console.log(chalk.cyan(`  📁 ${category}/`))
    for (const img of images) {
      const usageInfo = img.usedIn.length > 0 
        ? chalk.gray(` (used in ${img.usedIn.length} file${img.usedIn.length > 1 ? 's' : ''})`)
        : chalk.yellow(' (unused)')
      
      // Show critical badge
      const criticalBadge = img.isCritical 
        ? chalk.magenta(' [LCP]') 
        : ''
      
      console.log(`     └─ ${img.filename}${usageInfo}${criticalBadge}`)
      
      // Show critical reason
      if (img.isCritical && img.criticalReason) {
        console.log(chalk.magenta(`        ⚡ Keep local: ${img.criticalReason}`))
      }
      
      // Show usage details
      for (const usage of img.usedIn.slice(0, 2)) {
        const status = usage.canAutoMigrate 
          ? chalk.green('✓') 
          : chalk.yellow('⚠')
        console.log(chalk.gray(`        ${status} ${usage.filePath}:${usage.line} (${usage.elementType})`))
      }
      if (img.usedIn.length > 2) {
        console.log(chalk.gray(`        ... and ${img.usedIn.length - 2} more`))
      }
    }
    console.log('')
  }

  // Count critical images
  const criticalCount = results.images.filter(i => i.isCritical).length
  const uploadableCount = results.images.length - criticalCount

  console.log(chalk.bold('  Summary:'))
  console.log(`  • Total images: ${chalk.cyan(results.images.length)}`)
  console.log(`  • Total size: ${chalk.cyan(formatBytes(results.totalSize))}`)
  console.log(`  • Used in code: ${chalk.cyan(results.usageCount)} references`)
  console.log(`  • Critical (LCP): ${chalk.magenta(criticalCount)} images ${chalk.gray('(keep local for PageSpeed)')}`)
  console.log(`  • Safe to upload: ${chalk.green(uploadableCount)} images`)
  const autoMigratable = results.images.filter(i => i.usedIn.some(u => u.canAutoMigrate)).length
  console.log(`  • Auto-migratable: ${chalk.green(autoMigratable)} images`)
  console.log('')

  console.log(chalk.bold('  Next Steps:'))
  console.log(chalk.gray('  1. Run `uptrade-setup images upload --skip-critical` to upload non-LCP images'))
  console.log(chalk.gray('  2. Run `uptrade-setup images migrate` to replace with ManagedImage'))
  console.log('')
}

// ============================================
// Upload Images
// ============================================

async function uploadImages(options: ImagesOptions) {
  const apiKey = process.env.UPTRADE_API_KEY
  const apiUrl = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'

  if (!apiKey) {
    console.log(chalk.red('  ✗ Missing UPTRADE_API_KEY environment variable'))
    console.log(chalk.gray('    Set UPTRADE_API_KEY in your .env.local file.'))
    console.log(chalk.gray('    Get your API key from Portal → Project Settings → API Keys'))
    console.log('')
    process.exit(1)
  }

  const targetDir = path.resolve(options.dir || '.')
  const spinner = ora('Scanning for images...').start()
  const results = await scanPublicImages(targetDir)
  spinner.stop()

  if (results.images.length === 0) {
    console.log(chalk.green('  ✓ No images to upload'))
    return
  }

  // Filter out critical images if --skip-critical is set
  let imagesToUpload = results.images
  const criticalImages = results.images.filter(i => i.isCritical)
  const nonCriticalImages = results.images.filter(i => !i.isCritical)

  if (options.skipCritical && criticalImages.length > 0) {
    console.log(chalk.magenta(`  ⚡ Keeping ${criticalImages.length} critical images local for PageSpeed:`))
    for (const img of criticalImages) {
      console.log(chalk.gray(`     └─ ${img.filename} - ${img.criticalReason}`))
    }
    console.log('')
    imagesToUpload = nonCriticalImages
  }

  if (imagesToUpload.length === 0) {
    console.log(chalk.green('  ✓ No images to upload (all marked critical)'))
    console.log(chalk.gray('    Use --no-skip-critical to upload all images.'))
    return
  }

  console.log(chalk.bold(`  Found ${imagesToUpload.length} images to upload`))
  if (options.skipCritical && criticalImages.length > 0) {
    console.log(chalk.gray(`  (${criticalImages.length} critical images will remain local)`))
  }
  console.log('')

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would upload:'))
    for (const img of imagesToUpload) {
      console.log(chalk.gray(`    → ${img.filePath} → Website/${img.category}/${img.filename}`))
    }
    console.log('')
    return
  }

  // Confirm upload
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Upload ${imagesToUpload.length} images to Portal Files?`,
    default: true,
  }])

  if (!confirm) {
    console.log(chalk.gray('  Cancelled'))
    return
  }

  const uploaded: UploadedImage[] = []
  const failed: Array<{ path: string; error: string }> = []

  for (const img of imagesToUpload) {
    const uploadSpinner = ora(`Uploading ${img.filename}...`).start()
    
    try {
      const result = await uploadImageToPortal(
        path.join(targetDir, img.filePath),
        img,
        { apiUrl, apiKey, category: options.category }
      )
      uploaded.push(result)
      uploadSpinner.succeed(`Uploaded: ${img.filename}`)
    } catch (error: any) {
      failed.push({ path: img.filePath, error: error.message })
      uploadSpinner.fail(`Failed: ${img.filename} - ${error.message}`)
    }
  }

  console.log('')
  console.log(chalk.bold('  Upload Complete:'))
  console.log(`  • Uploaded: ${chalk.green(uploaded.length)}`)
  if (failed.length > 0) {
    console.log(`  • Failed: ${chalk.red(failed.length)}`)
  }
  console.log('')

  // Save manifest for migration step
  if (uploaded.length > 0) {
    const manifestPath = path.join(targetDir, '.uptrade-images.json')
    await fs.writeFile(manifestPath, JSON.stringify({
      uploaded,
      timestamp: new Date().toISOString(),
    }, null, 2))
    console.log(chalk.gray(`  Saved manifest to ${manifestPath}`))
    console.log('')
    console.log(chalk.bold('  Next Step:'))
    console.log(chalk.gray('  Run `uptrade-setup images migrate` to replace with ManagedImage'))
  }
  console.log('')
}

// ============================================
// Migrate Images
// ============================================

async function migrateImages(options: ImagesOptions) {
  const targetDir = path.resolve(options.dir || '.')
  const manifestPath = path.join(targetDir, '.uptrade-images.json')

  // Load API config
  const apiUrl = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_PORTAL_API_URL || 'https://api.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY || ''
  
  if (!apiKey) {
    console.log(chalk.red('  ✗ Missing UPTRADE_API_KEY in .env.local'))
    return
  }

  // Check for manifest
  let manifest: { uploaded: UploadedImage[] }
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    manifest = JSON.parse(content)
  } catch {
    console.log(chalk.yellow('  ⚠ No upload manifest found'))
    console.log(chalk.gray('    Run `uptrade-setup images upload` first.'))
    console.log('')
    return
  }

  if (!manifest.uploaded || manifest.uploaded.length === 0) {
    console.log(chalk.green('  ✓ No images to migrate'))
    return
  }

  // Scan for usages
  const spinner = ora('Scanning codebase for image usages...').start()
  const results = await scanPublicImages(targetDir)
  spinner.stop()

  // Match uploaded images with usages
  const migrations: Array<{
    usage: ImageUsage
    image: DetectedImage
    uploaded: UploadedImage
  }> = []

  for (const img of results.images) {
    const uploadedImg = manifest.uploaded.find(u => 
      u.localPath === img.filePath || u.localPath.endsWith(img.filename)
    )
    if (!uploadedImg) continue

    for (const usage of img.usedIn) {
      if (usage.canAutoMigrate) {
        migrations.push({ usage, image: img, uploaded: uploadedImg })
      }
    }
  }

  if (migrations.length === 0) {
    console.log(chalk.yellow('  ⚠ No auto-migratable usages found'))
    console.log(chalk.gray('    You may need to manually update some image references.'))
    console.log('')
    return
  }

  console.log(chalk.bold(`  Found ${migrations.length} image references to migrate`))
  console.log('')

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would update:'))
    for (const m of migrations) {
      console.log(chalk.gray(`    ${m.usage.filePath}:${m.usage.line}`))
      console.log(chalk.gray(`      ${m.usage.elementType} → <ManagedImage slotId="${m.image.suggestedSlotId}" />`))
    }
    console.log('')
    return
  }

  // Step 1: Create slot assignments in Portal (one per slot + page path so managed images show which page)
  console.log(chalk.bold('  Step 1: Creating slot assignments in Portal...'))
  const uniqueSlotPages = new Map<string, { fileId: string }>() // key: `${slotId}\0${page_path}`
  for (const m of migrations) {
    if (m.uploaded.slotId && m.uploaded.fileId) {
      const pagePath = filePathToPagePath(m.usage.filePath)
      const key = `${m.uploaded.slotId}\0${pagePath}`
      if (!uniqueSlotPages.has(key)) {
        uniqueSlotPages.set(key, { fileId: m.uploaded.fileId })
      }
    }
  }

  let slotsCreated = 0
  let slotsFailed = 0
  for (const [key, { fileId }] of uniqueSlotPages) {
    const [slotId, pagePath] = key.split('\0')
    try {
      const response = await fetch(`${apiUrl}/public/images/slot/${encodeURIComponent(slotId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey.trim(),
        },
        body: JSON.stringify({
          file_id: fileId,
          page_path: pagePath || undefined,
        }),
      })
      if (!response.ok) {
        const text = await response.text()
        console.log(chalk.yellow(`    ⚠ Slot ${slotId} @ ${pagePath}: ${response.status} - ${text}`))
        slotsFailed++
      } else {
        slotsCreated++
      }
    } catch (error: any) {
      console.log(chalk.yellow(`    ⚠ Slot ${slotId} @ ${pagePath}: ${error.message}`))
      slotsFailed++
    }
  }
  console.log(`    Created ${chalk.green(slotsCreated)} slot assignments${slotsFailed > 0 ? `, ${chalk.yellow(slotsFailed)} failed` : ''}`)
  console.log('')

  // Step 2: Update code references
  console.log(chalk.bold('  Step 2: Updating code references...'))
  
  // Group by file
  const byFile = new Map<string, typeof migrations>()
  for (const m of migrations) {
    if (!byFile.has(m.usage.filePath)) byFile.set(m.usage.filePath, [])
    byFile.get(m.usage.filePath)!.push(m)
  }

  let successCount = 0
  let failCount = 0

  for (const [filePath, fileMigrations] of byFile) {
    const fileSpinner = ora(`Migrating ${path.basename(filePath)}...`).start()
    
    try {
      await migrateFileImages(path.join(targetDir, filePath), fileMigrations)
      successCount += fileMigrations.length
      fileSpinner.succeed(`Migrated: ${filePath} (${fileMigrations.length} images)`)
    } catch (error: any) {
      failCount += fileMigrations.length
      fileSpinner.fail(`Failed: ${filePath} - ${error.message}`)
    }
  }

  console.log('')
  console.log(chalk.bold('  Migration Complete:'))
  console.log(`  • Slots created: ${chalk.green(slotsCreated)}`)
  console.log(`  • Code updated: ${chalk.green(successCount)} references`)
  if (failCount > 0) {
    console.log(`  • Code failures: ${chalk.red(failCount)} references`)
  }
  console.log('')
  console.log(chalk.bold('  Next Steps:'))
  console.log(chalk.gray('  1. Review the changes and test your site'))
  console.log(chalk.gray('  2. Delete original images from public folder'))
  console.log('')
}

// ============================================
// Combined Upload + Migrate (all command)
// ============================================

async function uploadAndMigrate(options: ImagesOptions) {
  const targetDir = path.resolve(options.dir || '.')
  
  // Load API config
  const apiUrl = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_PORTAL_API_URL || 'https://api.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY || ''
  
  if (!apiKey) {
    console.log(chalk.red('  ✗ Missing UPTRADE_API_KEY in .env.local'))
    console.log(chalk.gray('    Add your API key to .env.local:'))
    console.log(chalk.gray('    UPTRADE_API_KEY=your-api-key-here'))
    return
  }

  // Step 1: Scan
  console.log(chalk.bold('  Step 1: Scanning images...'))
  const results = await scanPublicImages(targetDir)
  
  if (results.images.length === 0) {
    console.log(chalk.green('  ✓ No images found in public folder'))
    return
  }
  
  // Filter based on skip-critical
  let imagesToProcess = results.images
  const criticalImages = results.images.filter(i => i.isCritical)
  const nonCriticalImages = results.images.filter(i => !i.isCritical)
  
  if (options.skipCritical !== false && criticalImages.length > 0) {
    console.log(chalk.magenta(`  ⚡ Keeping ${criticalImages.length} critical images local for PageSpeed:`))
    for (const img of criticalImages) {
      console.log(chalk.gray(`     └─ ${img.filename} - ${img.criticalReason}`))
    }
    console.log('')
    imagesToProcess = nonCriticalImages
  }
  
  // Find images with auto-migratable usages
  const migratable = imagesToProcess.filter(img => 
    img.usedIn.some(u => u.canAutoMigrate)
  )
  
  if (migratable.length === 0) {
    console.log(chalk.yellow('  ⚠ No images with auto-migratable code references found'))
    console.log(chalk.gray('    Images may be used in data files or props instead of <img>/<Image>'))
    console.log(chalk.gray('    Use `images upload` to upload them anyway.'))
    return
  }
  
  console.log(`  Found ${chalk.green(migratable.length)} images with migratable references`)
  console.log('')

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would:'))
    for (const img of migratable) {
      console.log(chalk.gray(`    • Upload ${img.filename}`))
      console.log(chalk.gray(`      → Create slot: ${img.suggestedSlotId}`))
      for (const usage of img.usedIn.filter(u => u.canAutoMigrate)) {
        console.log(chalk.gray(`      → Update ${usage.filePath}:${usage.line}`))
      }
    }
    console.log('')
    return
  }

  // Confirm
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Upload ${migratable.length} images and update code references?`,
    default: true,
  }])

  if (!confirm) {
    console.log(chalk.gray('  Cancelled'))
    return
  }

  // Step 2: Upload
  console.log('')
  console.log(chalk.bold('  Step 2: Uploading to Portal Files...'))
  
  const uploaded: UploadedImage[] = []
  const failed: Array<{ path: string; error: string }> = []

  for (const img of migratable) {
    const uploadSpinner = ora(`Uploading ${img.filename}...`).start()
    
    try {
      const result = await uploadImageToPortal(
        path.join(targetDir, img.filePath),
        img,
        { apiUrl, apiKey, category: options.category }
      )
      uploaded.push(result)
      uploadSpinner.succeed(`Uploaded: ${img.filename}`)
    } catch (error: any) {
      failed.push({ path: img.filePath, error: error.message })
      uploadSpinner.fail(`Failed: ${img.filename} - ${error.message}`)
    }
  }
  
  console.log(`  Uploaded: ${chalk.green(uploaded.length)}${failed.length > 0 ? `, Failed: ${chalk.red(failed.length)}` : ''}`)
  console.log('')

  if (uploaded.length === 0) {
    console.log(chalk.red('  ✗ No images uploaded, cannot continue'))
    return
  }

  // Step 3: Create slots (one per slot + page path so managed images show which page)
  console.log(chalk.bold('  Step 3: Creating image slots in Portal...'))
  
  let slotsCreated = 0
  for (const img of uploaded) {
    if (!img.slotId || !img.fileId) continue
    const migratableImg = migratable.find(
      m => img.localPath === m.filePath || img.localPath.endsWith(m.filename)
    )
    const pagePaths = migratableImg
      ? [...new Set(migratableImg.usedIn.filter(u => u.canAutoMigrate).map(u => filePathToPagePath(u.filePath)))]
      : ['/']
    if (pagePaths.length === 0) pagePaths.push('/')
    for (const pagePath of pagePaths) {
      try {
        const response = await fetch(`${apiUrl}/public/images/slot/${encodeURIComponent(img.slotId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey.trim(),
          },
          body: JSON.stringify({
            file_id: img.fileId,
            page_path: pagePath === '/' ? '/' : pagePath,
          }),
        })
        if (response.ok) {
          slotsCreated++
        } else {
          console.log(chalk.yellow(`    ⚠ Slot ${img.slotId} @ ${pagePath}: ${response.status}`))
        }
      } catch (error: any) {
        console.log(chalk.yellow(`    ⚠ Slot ${img.slotId} @ ${pagePath}: ${error.message}`))
      }
    }
  }
  
  console.log(`  Created: ${chalk.green(slotsCreated)} slot assignments`)
  console.log('')

  // Step 4: Update code
  console.log(chalk.bold('  Step 4: Updating code references...'))
  
  // Match uploaded images with their usages
  const migrations: Array<{
    usage: ImageUsage
    image: DetectedImage
    uploaded: UploadedImage
  }> = []

  for (const img of migratable) {
    const uploadedImg = uploaded.find(u => 
      u.localPath === img.filePath || u.localPath.endsWith(img.filename)
    )
    if (!uploadedImg) continue

    for (const usage of img.usedIn) {
      if (usage.canAutoMigrate) {
        migrations.push({ usage, image: img, uploaded: uploadedImg })
      }
    }
  }

  // Group by file
  const byFile = new Map<string, typeof migrations>()
  for (const m of migrations) {
    if (!byFile.has(m.usage.filePath)) byFile.set(m.usage.filePath, [])
    byFile.get(m.usage.filePath)!.push(m)
  }

  let successCount = 0
  let failCount = 0

  for (const [filePath, fileMigrations] of byFile) {
    const fileSpinner = ora(`Migrating ${path.basename(filePath)}...`).start()
    
    try {
      await migrateFileImages(path.join(targetDir, filePath), fileMigrations)
      successCount += fileMigrations.length
      fileSpinner.succeed(`Migrated: ${filePath} (${fileMigrations.length} images)`)
    } catch (error: any) {
      failCount += fileMigrations.length
      fileSpinner.fail(`Failed: ${filePath} - ${error.message}`)
    }
  }

  // Save manifest
  const manifestPath = path.join(targetDir, '.uptrade-images.json')
  await fs.writeFile(manifestPath, JSON.stringify({
    uploaded,
    criticalKeptLocal: criticalImages.map(i => i.filename),
    timestamp: new Date().toISOString(),
  }, null, 2))

  console.log('')
  console.log(chalk.bold.green('  ✓ Complete!'))
  console.log('')
  console.log(chalk.bold('  Summary:'))
  console.log(`    • Images uploaded: ${chalk.green(uploaded.length)}`)
  console.log(`    • Slots created: ${chalk.green(slotsCreated)}`)
  console.log(`    • Code references updated: ${chalk.green(successCount)}`)
  if (criticalImages.length > 0) {
    console.log(`    • Critical images kept local: ${chalk.magenta(criticalImages.length)}`)
  }
  if (failCount > 0) {
    console.log(`    • Code failures: ${chalk.red(failCount)}`)
  }
  console.log('')
  console.log(chalk.bold('  Next Steps:'))
  console.log(chalk.gray('  1. Review the changes in your code'))
  console.log(chalk.gray('  2. Test your site locally'))
  console.log(chalk.gray('  3. Delete uploaded images from public folder (optional)'))
  console.log('')
}

// ============================================
// Replace Local Paths with CDN URLs
// ============================================

async function replaceWithCdnUrls(options: ImagesOptions) {
  const targetDir = path.resolve(options.dir || '.')
  const manifestPath = path.join(targetDir, '.uptrade-images.json')

  // Check for manifest
  let manifest: { uploaded: UploadedImage[] }
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    manifest = JSON.parse(content)
  } catch {
    console.log(chalk.yellow('  ⚠ No upload manifest found'))
    console.log(chalk.gray('    Run `uptrade-setup images upload` first.'))
    console.log('')
    return
  }

  if (!manifest.uploaded || manifest.uploaded.length === 0) {
    console.log(chalk.green('  ✓ No uploaded images in manifest'))
    return
  }

  // Filter to images that have publicUrl
  const imagesWithUrls = manifest.uploaded.filter(u => u.publicUrl)
  
  if (imagesWithUrls.length === 0) {
    console.log(chalk.yellow('  ⚠ No images with CDN URLs in manifest'))
    console.log(chalk.gray('    Re-run upload to get CDN URLs.'))
    return
  }

  console.log(chalk.bold(`  Found ${imagesWithUrls.length} images with CDN URLs`))
  console.log('')

  // Find all files to search
  const dataFiles = await findDataFiles(targetDir)
  
  interface Replacement {
    file: string
    localPath: string
    cdnUrl: string
    line: number
  }
  
  const replacements: Replacement[] = []
  const seenFileLines = new Set<string>()

  for (const file of dataFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        for (const img of imagesWithUrls) {
          // Check for both /path and relative path references (order matters - most specific first)
          const patterns = [
            `/${img.localPath.replace(/^public\//, '')}`,  // /logos/avvo.webp (most common)
            img.localPath,  // public/logos/avvo.webp
            img.localPath.replace(/^public\//, ''),  // logos/avvo.webp
          ]
          
          // Find the first pattern that matches
          for (const pattern of patterns) {
            // Use a regex with word boundaries to avoid partial matches
            // e.g., '/logos/avvo.webp' should match '/logos/avvo.webp' but 'logos/avvo.webp' shouldn't
            const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            const regex = new RegExp(`["']${escapedPattern}["']|["']${escapedPattern}[^"']*["']`)
            
            // Simple check: does this exact pattern appear as a string value?
            if (lines[i].includes(`"${pattern}"`) || lines[i].includes(`'${pattern}'`)) {
              const key = `${file}:${i}:${pattern}`
              if (!seenFileLines.has(key)) {
                seenFileLines.add(key)
                replacements.push({
                  file: path.relative(targetDir, file),
                  localPath: pattern,
                  cdnUrl: img.publicUrl,
                  line: i + 1,
                })
              }
              break  // Only match first pattern per image per line
            }
          }
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  if (replacements.length === 0) {
    console.log(chalk.green('  ✓ No local path references found in data files'))
    console.log(chalk.gray('    All image references may already be migrated or use <img>/<Image> elements.'))
    return
  }

  console.log(chalk.bold(`  Found ${replacements.length} path references to replace`))
  console.log('')

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would replace:'))
    for (const r of replacements) {
      console.log(chalk.gray(`    ${r.file}:${r.line}`))
      console.log(chalk.gray(`      "${r.localPath}" → "${r.cdnUrl}"`))
    }
    console.log('')
    return
  }

  // Confirm
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Replace ${replacements.length} local paths with CDN URLs?`,
    default: true,
  }])

  if (!confirm) {
    console.log(chalk.gray('  Cancelled'))
    return
  }

  // Group by file
  const byFile = new Map<string, Replacement[]>()
  for (const r of replacements) {
    if (!byFile.has(r.file)) byFile.set(r.file, [])
    byFile.get(r.file)!.push(r)
  }

  let successCount = 0
  let failCount = 0

  for (const [filePath, fileReplacements] of byFile) {
    const fileSpinner = ora(`Updating ${path.basename(filePath)}...`).start()
    
    try {
      const fullPath = path.join(targetDir, filePath)
      let content = await fs.readFile(fullPath, 'utf-8')
      
      for (const r of fileReplacements) {
        // Escape for regex
        const escaped = r.localPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        content = content.replace(new RegExp(escaped, 'g'), r.cdnUrl)
        successCount++
      }
      
      await fs.writeFile(fullPath, content, 'utf-8')
      fileSpinner.succeed(`Updated: ${filePath} (${fileReplacements.length} paths)`)
    } catch (error: any) {
      failCount += fileReplacements.length
      fileSpinner.fail(`Failed: ${filePath} - ${error.message}`)
    }
  }

  console.log('')
  console.log(chalk.bold('  Replacement Complete:'))
  console.log(`  • Paths updated: ${chalk.green(successCount)}`)
  if (failCount > 0) {
    console.log(`  • Failed: ${chalk.red(failCount)}`)
  }
  console.log('')
  console.log(chalk.bold('  Next Steps:'))
  console.log(chalk.gray('  1. Review the changes in your data files'))
  console.log(chalk.gray('  2. Test that images load from CDN'))
  console.log(chalk.gray('  3. Delete original images from public folder (optional)'))
  console.log('')
}

// ============================================
// Refresh Manifest from Portal
// ============================================

async function refreshManifest(options: ImagesOptions) {
  const targetDir = path.resolve(options.dir || '.')
  const manifestPath = path.join(targetDir, '.uptrade-images.json')
  
  // Load API config
  const apiUrl = process.env.UPTRADE_API_URL || process.env.NEXT_PUBLIC_PORTAL_API_URL || 'https://api.uptrademedia.com'
  const apiKey = process.env.UPTRADE_API_KEY || ''
  
  if (!apiKey) {
    console.log(chalk.red('  ✗ Missing UPTRADE_API_KEY in .env.local'))
    return
  }

  // Check for existing manifest
  let manifest: { uploaded: UploadedImage[] }
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    manifest = JSON.parse(content)
  } catch {
    console.log(chalk.yellow('  ⚠ No upload manifest found'))
    console.log(chalk.gray('    Run `uptrade-setup images upload` first.'))
    return
  }

  if (!manifest.uploaded || manifest.uploaded.length === 0) {
    console.log(chalk.green('  ✓ No uploaded images in manifest'))
    return
  }

  console.log(chalk.bold(`  Refreshing ${manifest.uploaded.length} images...`))
  console.log('')

  // Fetch files from Portal
  const spinner = ora('Fetching files from Portal...').start()
  
  try {
    const response = await fetch(`${apiUrl}/public/images/files`, {
      headers: {
        'X-API-Key': apiKey.trim(),
      },
    })

    if (!response.ok) {
      const text = await response.text()
      spinner.fail(`Failed to fetch files: ${response.status} - ${text}`)
      return
    }

    const data = await response.json() as { files: Array<{ id: string; filename: string; public_url: string }> }
    spinner.succeed(`Found ${data.files?.length || 0} files in Portal`)

    // Match by fileId and update publicUrl
    let updatedCount = 0
    for (const uploaded of manifest.uploaded) {
      const portalFile = data.files?.find(f => f.id === uploaded.fileId)
      if (portalFile && portalFile.public_url) {
        uploaded.publicUrl = portalFile.public_url
        updatedCount++
      }
    }

    // Save updated manifest
    await fs.writeFile(manifestPath, JSON.stringify({
      ...manifest,
      refreshed: new Date().toISOString(),
    }, null, 2))

    console.log('')
    console.log(chalk.bold('  Manifest Refreshed:'))
    console.log(`  • Updated ${chalk.green(updatedCount)} CDN URLs`)
    console.log(`  • Saved to ${chalk.gray(manifestPath)}`)
    console.log('')
    console.log(chalk.bold('  Next Step:'))
    console.log(chalk.gray('  Run `uptrade-setup images replace-urls` to update code'))
    console.log('')

  } catch (error: any) {
    spinner.fail(`Error: ${error.message}`)
  }
}

async function findDataFiles(rootDir: string): Promise<string[]> {
  const files: string[] = []
  
  // Files to exclude from scanning (like our manifest)
  const excludeFiles = ['.uptrade-images.json']
  
  async function scan(dir: string) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        // Skip directories we don't want
        if (entry.isDirectory()) {
          if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
            continue
          }
          await scan(fullPath)
        } else if (entry.isFile()) {
          // Skip excluded files
          if (excludeFiles.includes(entry.name)) {
            continue
          }
          // Data files that might have image paths
          const ext = path.extname(entry.name).toLowerCase()
          if (['.js', '.ts', '.json', '.jsx', '.tsx', '.mjs', '.cjs'].includes(ext)) {
            files.push(fullPath)
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }
  
  await scan(rootDir)
  return files
}

// ============================================
// Helper Functions
// ============================================

/**
 * Scan public folder for images and find their usages in codebase
 * Exported for use by migrate command
 */
export async function scanPublicImages(rootDir: string): Promise<ImageScanResults> {
  const publicDir = path.join(rootDir, 'public')
  const images: DetectedImage[] = []
  let totalSize = 0
  let usageCount = 0

  // Find all images in public folder
  const imageFiles = await findImagesRecursive(publicDir)
  
  // Find all source files to scan for usages
  const sourceFiles = await findSourceFiles(rootDir)
  
  for (const imagePath of imageFiles) {
    const relPath = path.relative(rootDir, imagePath)
    const filename = path.basename(imagePath)
    const ext = path.extname(filename).toLowerCase()
    const stat = await fs.stat(imagePath)
    
    // Determine category from folder structure
    const category = getCategoryFromPath(relPath)
    
    // Generate suggested slot ID
    const suggestedSlotId = generateSlotId(relPath)
    
    // Find usages in codebase
    const usedIn = await findImageUsages(imagePath, sourceFiles, rootDir)
    usageCount += usedIn.length

    // Detect if this is a critical LCP image
    const { isCritical, criticalReason } = detectCriticalImage(filename, relPath, usedIn, stat.size)

    images.push({
      filePath: relPath,
      filename,
      fileSize: stat.size,
      mimeType: MIME_TYPES[ext] || 'application/octet-stream',
      usedIn,
      suggestedSlotId,
      category,
      isCritical,
      criticalReason,
    })
    
    totalSize += stat.size
  }

  return { images, totalSize, usageCount }
}

async function findImagesRecursive(dir: string, files: string[] = []): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await findImagesRecursive(fullPath, files)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (IMAGE_EXTENSIONS.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return files
}

async function findSourceFiles(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', 'build', 'public'].includes(entry.name)) {
        continue
      }
      await findSourceFiles(fullPath, files)
    } else if (entry.isFile()) {
      if (/\.(tsx?|jsx?|css|scss|sass)$/.test(entry.name) && !entry.name.includes('.d.ts')) {
        files.push(fullPath)
      }
    }
  }

  return files
}

async function findImageUsages(imagePath: string, sourceFiles: string[], rootDir: string): Promise<ImageUsage[]> {
  const usages: ImageUsage[] = []
  const filename = path.basename(imagePath)
  const relPath = path.relative(path.join(rootDir, 'public'), imagePath)
  
  // Patterns to search for
  const patterns = [
    `/${relPath}`,           // /images/hero.jpg
    `"/${relPath}"`,         // "images/hero.jpg"
    `'/${relPath}'`,         // '/images/hero.jpg'
    filename,                 // hero.jpg
  ]

  for (const sourceFile of sourceFiles) {
    try {
      const content = await fs.readFile(sourceFile, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        // Check if any pattern matches
        const matches = patterns.some(p => line.includes(p))
        if (!matches) continue

        // Determine element type and if it's auto-migratable
        const elementType = detectElementType(line)
        const canAutoMigrate = ['img', 'Image'].includes(elementType)

        usages.push({
          filePath: path.relative(rootDir, sourceFile),
          line: i + 1,
          elementType,
          altText: extractAltText(line),
          canAutoMigrate,
        })
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return usages
}

function detectElementType(line: string): string {
  if (/<img\s/i.test(line)) return 'img'
  if (/<Image\s/i.test(line)) return 'Image'
  if (/background(-image)?:/i.test(line)) return 'background-image'
  if (/url\(/i.test(line)) return 'css-url'
  return 'other'
}

function extractAltText(line: string): string | undefined {
  const match = line.match(/alt=["']([^"']+)["']/i)
  return match ? match[1] : undefined
}

function getCategoryFromPath(relPath: string): string {
  // public/images/... -> images
  // public/logos/... -> logos  
  // public/hero.jpg -> root
  const parts = relPath.replace(/^public[\\/]/, '').split(/[\\/]/)
  if (parts.length > 1) {
    return parts[0]
  }
  return 'root'
}

function generateSlotId(relPath: string): string {
  // public/images/hero-gavel.jpg -> images-hero-gavel
  // public/logo.svg -> logo
  const withoutPublic = relPath.replace(/^public[\\/]/, '')
  const withoutExt = withoutPublic.replace(/\.[^.]+$/, '')
  return withoutExt
    .replace(/[\\/]/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}

// ============================================
// Critical Image Detection (LCP/PageSpeed)
// ============================================

/** 
 * Patterns that indicate a critical LCP image by filename alone
 * Be conservative - only match obvious hero/header images
 */
const CRITICAL_FILENAME_PATTERNS = [
  /^hero[.-]/i,           // hero.jpg, hero-image.jpg
  /hero[-_]?image/i,      // hero-image.jpg, heroImage.jpg
  /home[-_]?page[-_]?hero/i, // home-page-hero.jpg
  /^banner[.-]/i,         // banner.jpg
  /masthead/i,            // masthead.jpg
  /splash/i,              // splash.jpg
]

/**
 * Patterns for THE site logo (not badges/awards with "logo" in name)
 * Must be used in layout/header to be considered critical
 */
const SITE_LOGO_PATTERNS = [
  /^logo\.(svg|png|jpg|webp)$/i,  // logo.svg, logo.png (exact match)
  /^site[-_]?logo/i,              // site-logo.png
  /^main[-_]?logo/i,              // main-logo.svg
  /^brand[-_]?logo/i,             // brand-logo.png
]

/** Files that indicate above-the-fold usage */
const CRITICAL_USAGE_FILES = [
  'layout.jsx',
  'layout.tsx',
  'layout.js',
  'layout.ts',
  'page.jsx',  // Only if at root
  'page.tsx',
  'Header.jsx',
  'Header.tsx',
  'Navbar.jsx',
  'Navbar.tsx',
  'Hero.jsx',
  'Hero.tsx',
  'HeroSection.jsx',
  'HeroSection.tsx',
]

/** Max file size to consider for critical (small icons should stay local) */
const CRITICAL_MAX_SIZE = 100 * 1024 // 100KB

/**
 * Detect if an image is critical for LCP/PageSpeed
 * Critical images should stay local to avoid CDN latency on first paint
 */
function detectCriticalImage(
  filename: string,
  relPath: string,
  usages: ImageUsage[],
  fileSize: number
): { isCritical: boolean; criticalReason?: string } {
  // Check obvious hero/banner filename patterns (always critical)
  for (const pattern of CRITICAL_FILENAME_PATTERNS) {
    if (pattern.test(filename)) {
      return { 
        isCritical: true, 
        criticalReason: `Hero/banner image` 
      }
    }
  }

  // Check if used in layout (always visible on every page)
  const usedInLayout = usages.some(u => 
    u.filePath.includes('layout.') || 
    u.filePath.includes('/layout/')
  )
  
  // Check if used in header/nav/hero components
  const usedInCriticalComponent = usages.some(u => {
    const fileName = path.basename(u.filePath).toLowerCase()
    return fileName.includes('header') ||
           fileName.includes('navbar') ||
           fileName.includes('nav.') ||
           fileName.includes('hero') ||
           fileName.includes('footer')
  })

  // Site logo patterns - only critical if used in layout/header/footer
  const isSiteLogo = SITE_LOGO_PATTERNS.some(p => p.test(filename))
  if (isSiteLogo && (usedInLayout || usedInCriticalComponent)) {
    return { 
      isCritical: true, 
      criticalReason: 'Site logo used in layout/header/footer' 
    }
  }

  // Any image used in layout is critical
  if (usedInLayout) {
    return { 
      isCritical: true, 
      criticalReason: 'Used in layout (always visible)' 
    }
  }

  // Images in header/hero components are critical
  if (usedInCriticalComponent) {
    return { 
      isCritical: true, 
      criticalReason: 'Used in header/hero/footer component' 
    }
  }

  // Check if it's a root-level image (likely important)
  if (relPath.match(/^public[\\/][^/\\]+\.(jpg|jpeg|png|webp|svg)$/i)) {
    // Small root images (logos, icons) - keep local
    if (fileSize < 50 * 1024) {
      return { 
        isCritical: true, 
        criticalReason: 'Root-level small image (likely logo/icon)' 
      }
    }
  }

  // Not critical - safe to move to CDN
  return { isCritical: false }
}

async function uploadImageToPortal(
  localPath: string,
  image: DetectedImage,
  config: { apiUrl: string; apiKey: string; category?: string }
): Promise<UploadedImage> {
  // Read file and create Blob
  const fileBuffer = readFileSync(localPath)
  const blob = new Blob([fileBuffer], { type: image.mimeType })
  
  // Note: projectId is derived from the API key on the backend
  const form = new FormData()
  form.append('file', blob, image.filename)
  form.append('folderPath', `Website/${image.category}`)
  form.append('category', config.category || 'website')
  form.append('isPublic', 'true')

  const response = await fetch(`${config.apiUrl}/files/upload/public`, {
    method: 'POST',
    headers: {
      'X-API-Key': config.apiKey.trim(),
    },
    body: form,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Upload failed: ${response.status} - ${text}`)
  }

  const result = await response.json() as { file: { id: string; public_url: string }; image?: any }

  // Create slot(s) in site_managed_images so they appear in Portal with page path
  const slotId = image.suggestedSlotId
  const altText = image.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  const pagePaths =
    image.usedIn.length > 0
      ? [...new Set(image.usedIn.filter(u => u.canAutoMigrate).map(u => filePathToPagePath(u.filePath)))]
      : [null as string | null]
  if (pagePaths.length === 0) pagePaths.push(null)
  for (const pagePath of pagePaths) {
    try {
      const slotResponse = await fetch(
        `${config.apiUrl}/public/images/slot/${encodeURIComponent(slotId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': config.apiKey.trim(),
          },
          body: JSON.stringify({
            file_id: result.file.id,
            alt_text: altText,
            page_path: pagePath ?? undefined,
          }),
        }
      )
      if (!slotResponse.ok) {
        console.warn(`  ⚠ Slot creation failed for ${slotId}${pagePath != null ? ` @ ${pagePath}` : ''}`)
      }
    } catch {
      console.warn(`  ⚠ Slot creation failed for ${slotId}${pagePath != null ? ` @ ${pagePath}` : ''}`)
    }
  }

  return {
    localPath: image.filePath,
    fileId: result.file.id,
    publicUrl: result.file.public_url,
    slotId,
  }
}

async function migrateFileImages(
  filePath: string,
  migrations: Array<{ usage: ImageUsage; image: DetectedImage; uploaded: UploadedImage }>
): Promise<void> {
  let content = await fs.readFile(filePath, 'utf-8')
  const lines = content.split('\n')
  
  // Sort migrations by line number descending so we don't mess up line numbers
  const sortedMigrations = [...migrations].sort((a, b) => b.usage.line - a.usage.line)

  for (const m of sortedMigrations) {
    const lineIndex = m.usage.line - 1
    const line = lines[lineIndex]
    
    // Replace img/Image tag with ManagedImage
    const newLine = line
      .replace(
        /<(img|Image)\s+([^>]*?)src=["'][^"']+["']([^>]*?)\/?>/gi,
        `<ManagedImage slotId="${m.image.suggestedSlotId}" $2$3 />`
      )
    
    lines[lineIndex] = newLine
  }

  // Check if ManagedImage import exists
  const hasImport = content.includes('ManagedImage') && content.includes('@uptrade/site-kit')
  
  if (!hasImport && migrations.length > 0) {
    // Add import at the top
    const importLine = "import { ManagedImage } from '@uptrade/site-kit/images'"
    
    // Find the best place to add the import (after other imports)
    let insertIndex = 0
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1
      }
    }
    
    lines.splice(insertIndex, 0, importLine)
  }

  content = lines.join('\n')
  await fs.writeFile(filePath, content, 'utf-8')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ============================================
// Unified Upload + Migrate (for migrate command)
// ============================================

export interface UploadMigrateOptions {
  apiKey: string
  apiUrl: string
  dryRun?: boolean
  category?: string
}

export interface UploadMigrateResult {
  uploaded: number
  migrated: number
  failed: number
  errors: string[]
}

/**
 * Upload images to Portal and migrate references in code
 * This is the unified function used by the migrate command
 */
export async function uploadAndMigrateImages(
  scanResults: ImageScanResults,
  options: UploadMigrateOptions
): Promise<UploadMigrateResult> {
  const result: UploadMigrateResult = {
    uploaded: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  }

  if (options.dryRun) {
    result.uploaded = scanResults.images.length
    result.migrated = scanResults.images.filter(i => i.usedIn.some(u => u.canAutoMigrate)).length
    return result
  }

  const rootDir = process.cwd()
  const uploaded: UploadedImage[] = []

  // Step 1: Upload all images
  for (const img of scanResults.images) {
    try {
      const uploadResult = await uploadImageToPortal(
        path.join(rootDir, img.filePath),
        img,
        {
          apiUrl: options.apiUrl,
          apiKey: options.apiKey,
          category: options.category,
        }
      )
      uploaded.push(uploadResult)
      result.uploaded++
    } catch (error: any) {
      result.failed++
      result.errors.push(`${img.filePath}: ${error.message}`)
    }
  }

  // Step 2: Migrate references in code
  // Group by file for efficient processing
  const byFile = new Map<string, Array<{
    usage: ImageUsage
    image: DetectedImage
    uploaded: UploadedImage
  }>>()

  for (const img of scanResults.images) {
    const uploadedImg = uploaded.find(u => u.localPath === img.filePath)
    if (!uploadedImg) continue

    for (const usage of img.usedIn) {
      if (usage.canAutoMigrate) {
        if (!byFile.has(usage.filePath)) byFile.set(usage.filePath, [])
        byFile.get(usage.filePath)!.push({ usage, image: img, uploaded: uploadedImg })
      }
    }
  }

  // Migrate each file
  for (const [filePath, migrations] of byFile) {
    try {
      await migrateFileImages(path.join(rootDir, filePath), migrations)
      result.migrated += migrations.length
    } catch (error: any) {
      result.errors.push(`Migration failed for ${filePath}: ${error.message}`)
    }
  }

  return result
}
