/**
 * Migrate Command - Migrate detected components to Site-Kit
 * 
 * Includes:
 * - Forms → useForm hook
 * - Metadata → getManagedMetadata
 * - Schemas → ManagedSchema
 * - FAQs → ManagedFAQ
 * - Widgets → Engage integration
 * - Images → ManagedImage (optional, with --images flag)
 */

import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs/promises'
import { scanCodebase } from '../scanner'
import { migrateFiles, migrateFile, type MigrationResult } from '../migrator'
import { scanPublicImages, uploadAndMigrateImages, type ImageScanResults } from './images'

interface MigrateOptions {
  dryRun?: boolean
  file?: string
  images?: boolean
}

export async function migrateCommand(options: MigrateOptions) {
  console.log('')
  console.log(chalk.bold('  Site-Kit Migration'))
  console.log('')

  // Check for API key
  const apiKey = process.env.UPTRADE_API_KEY
  const projectId = process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID

  if (!apiKey || !projectId) {
    console.log(chalk.red('  ✗ Missing environment variables'))
    console.log(chalk.gray('    Run `uptrade-setup init` first to configure your project.'))
    console.log('')
    process.exit(1)
  }

  if (options.dryRun) {
    console.log(chalk.yellow('  Running in dry-run mode - no files will be modified'))
    console.log('')
  }

  // Single file migration
  if (options.file) {
    const filePath = path.resolve(options.file)
    
    try {
      await fs.access(filePath)
    } catch {
      console.log(chalk.red(`  ✗ File not found: ${filePath}`))
      process.exit(1)
    }

    const spinner = ora(`Migrating ${path.basename(filePath)}...`).start()
    
    try {
      const result = await migrateFile(filePath, {
        projectId,
        apiKey,
        dryRun: options.dryRun,
      })

      if (result.success) {
        spinner.succeed(`Migrated: ${result.filePath}`)
        result.changes.forEach(change => {
          console.log(chalk.gray(`  └─ ${change}`))
        })
      } else {
        spinner.fail(`Failed: ${result.filePath}`)
        console.log(chalk.red(`  ${result.error}`))
      }
    } catch (error: any) {
      spinner.fail('Migration failed')
      console.log(chalk.red(`  ${error.message}`))
      process.exit(1)
    }

    console.log('')
    return
  }

  // Full codebase migration
  const scanSpinner = ora('Scanning codebase...').start()
  let scanResults
  
  try {
    scanResults = await scanCodebase(process.cwd())
    scanSpinner.stop()
  } catch (error: any) {
    scanSpinner.fail('Scan failed')
    console.log(chalk.red(`  ${error.message}`))
    process.exit(1)
  }

  const total = scanResults.forms.length + scanResults.widgets.length +
                scanResults.metadata.length + (scanResults.schemas?.length || 0) +
                (scanResults.faqs?.length || 0) + scanResults.sitemaps.length +
                (scanResults.analytics?.length || 0)
  
  if (total === 0) {
    console.log(chalk.green('  ✓ No components to migrate'))
    console.log('')
    return
  }

  console.log(chalk.bold('  Found migratable components:'))
  if (scanResults.forms.length) console.log(`  📝 Forms: ${chalk.cyan(scanResults.forms.length)}`)
  if (scanResults.widgets.length) console.log(`  💬 Widgets: ${chalk.cyan(scanResults.widgets.length)}`)
  if (scanResults.metadata.length) console.log(`  🏷️  Metadata: ${chalk.cyan(scanResults.metadata.length)}`)
  if (scanResults.schemas?.length) console.log(`  📊 Schema Markup: ${chalk.cyan(scanResults.schemas.length)}`)
  if (scanResults.faqs?.length) console.log(`  ❓ FAQ Sections: ${chalk.cyan(scanResults.faqs.length)}`)
  if (scanResults.sitemaps.length) console.log(`  🗺️  Sitemaps: ${chalk.cyan(scanResults.sitemaps.length)}`)
  if (scanResults.analytics?.length) console.log(`  📈 Analytics: ${chalk.cyan(scanResults.analytics.length)}`)
  console.log('')

  if (!options.dryRun) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Migrate ${total} component(s)?`,
      default: true
    }])

    if (!confirm) {
      console.log(chalk.yellow('  Migration cancelled'))
      console.log('')
      return
    }
  }

  const migrateSpinner = ora('Migrating components...').start()
  
  try {
    const results = await migrateFiles(scanResults, {
      projectId,
      apiKey,
      dryRun: options.dryRun,
    })

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    if (options.dryRun) {
      migrateSpinner.info(`Would migrate ${successful.length} file(s)`)
    } else {
      migrateSpinner.succeed(`Migrated ${successful.length} file(s)`)
    }

    // Show successful migrations
    successful.forEach(result => {
      console.log(chalk.green(`  ✓ ${result.filePath}`))
      result.changes.forEach(change => {
        console.log(chalk.gray(`    └─ ${change}`))
      })
    })

    // Show failures
    if (failed.length > 0) {
      console.log('')
      console.log(chalk.red(`  Failed: ${failed.length} file(s)`))
      failed.forEach(result => {
        console.log(chalk.red(`  ✗ ${result.filePath}`))
        console.log(chalk.gray(`    └─ ${result.error}`))
      })
    }

  } catch (error: any) {
    migrateSpinner.fail('Migration failed')
    console.log(chalk.red(`  ${error.message}`))
    process.exit(1)
  }

  console.log('')

  // Image migration (either with --images flag or prompt user)
  await handleImageMigration(options, apiKey, projectId)
}

// ============================================
// Image Migration Handler
// ============================================

async function handleImageMigration(
  options: MigrateOptions,
  apiKey: string,
  projectId: string
) {
  const apiUrl = process.env.NEXT_PUBLIC_UPTRADE_API_URL || 'https://api.uptrademedia.com'
  
  // Scan for images
  const imageScanSpinner = ora('Scanning for images...').start()
  let imageResults: ImageScanResults
  
  try {
    imageResults = await scanPublicImages(process.cwd())
    imageScanSpinner.stop()
  } catch (error: any) {
    imageScanSpinner.stop()
    // No images found or error - just skip
    return
  }

  if (imageResults.images.length === 0) {
    return
  }

  // Show image summary
  console.log(chalk.bold(`  Found ${imageResults.images.length} images (${formatBytes(imageResults.totalSize)}):`))
  const autoMigratable = imageResults.images.filter(i => i.usedIn.some(u => u.canAutoMigrate)).length
  console.log(`  • Used in code: ${chalk.cyan(imageResults.usageCount)} references`)
  console.log(`  • Auto-migratable: ${chalk.green(autoMigratable)} images`)
  console.log('')

  // If --images flag or prompt user
  let shouldMigrateImages = options.images === true
  
  if (!shouldMigrateImages && !options.dryRun) {
    const { migrateImages } = await inquirer.prompt([{
      type: 'confirm',
      name: 'migrateImages',
      message: `Upload and migrate ${imageResults.images.length} images?`,
      default: false
    }])
    shouldMigrateImages = migrateImages
  }

  if (!shouldMigrateImages) {
    console.log(chalk.gray('  Skipping image migration. Run `uptrade-setup images upload` later.'))
    console.log('')
    return
  }

  if (options.dryRun) {
    console.log(chalk.yellow(`  [DRY RUN] Would upload ${imageResults.images.length} images`))
    console.log(chalk.yellow(`  [DRY RUN] Would migrate ${autoMigratable} image references`))
    console.log('')
    return
  }

  // Upload and migrate images
  const uploadSpinner = ora('Uploading images to Portal...').start()
  
  try {
    const uploadResults = await uploadAndMigrateImages(imageResults, {
      apiKey,
      projectId,
      apiUrl,
      dryRun: options.dryRun,
    })

    uploadSpinner.succeed(`Uploaded ${uploadResults.uploaded} images, migrated ${uploadResults.migrated} references`)
    
    if (uploadResults.failed > 0) {
      console.log(chalk.yellow(`  ⚠ ${uploadResults.failed} images failed to upload`))
    }
  } catch (error: any) {
    uploadSpinner.fail('Image upload failed')
    console.log(chalk.red(`  ${error.message}`))
  }

  console.log('')
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
