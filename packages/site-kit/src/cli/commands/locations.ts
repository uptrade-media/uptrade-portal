/**
 * Locations Command - Create templates from source pages and generate location pages
 * 
 * Usage:
 *   npx uptrade-setup locations template <source-page>  # Extract slots from page
 *   npx uptrade-setup locations upload --template <name> # Upload template to Portal
 *   npx uptrade-setup locations generate --template <name> --locations <cities> # Generate pages
 *   npx uptrade-setup locations list                    # List templates for this project
 */

import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import path from 'path'
import fs from 'fs/promises'
import { existsSync, readFileSync } from 'fs'
import * as parser from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

// ============================================
// Types
// ============================================

export interface ContentSlot {
  id: string
  type: 'text' | 'array' | 'object' | 'image'
  min_words?: number
  max_words?: number
  min_items?: number
  max_items?: number
  item_schema?: Partial<ContentSlot>
  localize?: boolean
  data_source?: 'census' | 'places_api' | 'project_services' | 'manual'
  generation_hint?: string
  example?: string
  required?: boolean
}

export interface GenerationContext {
  tone: 'professional' | 'friendly' | 'urgent' | 'empathetic' | 'informative'
  mention_distance?: boolean
  keyword_density?: 'low' | 'medium' | 'high'
  include_demographics?: boolean
  avoid?: string[]
  required_elements?: string[]
  industry?: string
  business_type?: string
}

export interface LocationTemplate {
  name: string
  type: 'area-index' | 'location-hub' | 'service-location'
  extends?: string
  source_page_path: string
  url_pattern: string
  slots: ContentSlot[]
  generation_context: GenerationContext
  managed_components: string[]
}

// Props to skip during extraction
const SKIP_PROPS = ['href', 'src', 'className', 'style', 'onClick', 'ref', 'key', 'id', 'target', 'rel', 'type', 'name', 'variant', 'size', 'icon']
const SKIP_TYPES = ['boolean', 'number', 'function', 'undefined']

// ============================================
// Configuration
// ============================================

const API_URL = process.env.UPTRADE_API_URL || 'https://api.uptrademedia.com'
const TEMPLATES_DIR = '.uptrade/templates'

// ============================================
// Main Command Handler
// ============================================

interface LocationsOptions {
  name?: string
  template?: string
  type?: string
  locations?: string[]
  locationsFile?: string
  dryRun?: boolean
  enhance?: boolean
}

export async function locationsCommand(subcommand: string, arg: string | undefined, options: LocationsOptions) {
  console.log('')
  console.log(chalk.bold('  📍 Site-Kit Location Page Manager'))
  console.log('')

  // Load project config
  const config = await loadConfig()
  if (!config?.projectId) {
    console.log(chalk.red('  ✗ Not configured. Run `npx uptrade-setup init` first.'))
    return
  }

  switch (subcommand) {
    case 'template':
      if (!arg) {
        console.log(chalk.red('  ✗ Usage: locations template <source-page-path>'))
        console.log(chalk.gray('    Example: locations template ./app/services/plumbing/page.tsx'))
        return
      }
      await templateCommand(arg, options, config)
      break
    
    case 'upload':
      if (!options.template) {
        console.log(chalk.red('  ✗ Usage: locations upload --template <name>'))
        return
      }
      await uploadCommand(options.template, config)
      break
    
    case 'generate':
      if (!options.template) {
        console.log(chalk.red('  ✗ Usage: locations generate --template <name> --locations "City, ST" ...'))
        return
      }
      await generateCommand(options, config)
      break
    
    case 'list':
      await listCommand(config)
      break
    
    default:
      console.log(chalk.yellow('  Available subcommands:'))
      console.log('')
      console.log('    template <page>    Extract slots from source page to create template')
      console.log('    upload             Upload template to Portal')
      console.log('    generate           Generate location pages via Signal')
      console.log('    list               List templates for this project')
      console.log('')
  }
}

// ============================================
// Template Command - Extract slots from source page
// ============================================

async function templateCommand(sourcePath: string, options: LocationsOptions, config: Config) {
  const spinner = ora('Analyzing source page...').start()

  try {
    // Resolve the path
    const resolvedPath = path.resolve(sourcePath)
    
    if (!existsSync(resolvedPath)) {
      spinner.fail(`File not found: ${sourcePath}`)
      return
    }

    // Read the source file
    const sourceCode = readFileSync(resolvedPath, 'utf-8')
    
    // Parse the AST
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    // Extract slots from JSX components
    const slots: ContentSlot[] = []
    const componentNames: string[] = []

    traverse(ast, {
      JSXElement(path) {
        const openingElement = path.node.openingElement
        if (t.isJSXIdentifier(openingElement.name)) {
          const componentName = openingElement.name.name
          
          // Only process PascalCase components (not HTML elements)
          if (componentName[0] === componentName[0].toUpperCase()) {
            componentNames.push(componentName)
            
            // Extract props that could be content slots
            openingElement.attributes.forEach(attr => {
              if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name)) {
                const propName = attr.name.name
                
                if (SKIP_PROPS.includes(propName)) return
                
                const slot = extractSlotFromAttribute(propName, attr.value, componentName)
                if (slot) {
                  // Avoid duplicates
                  if (!slots.find(s => s.id === slot.id)) {
                    slots.push(slot)
                  }
                }
              }
            })
          }
        }
      },
    })

    spinner.succeed(`Found ${slots.length} content slots in ${componentNames.length} components`)

    // Generate template name from source path
    const templateName = options.name || inferTemplateName(sourcePath)
    
    // Infer page path from file path
    const sourcePagePath = inferSourcePagePath(sourcePath)

    // Build the template
    const template: LocationTemplate = {
      name: templateName,
      type: (options.type as LocationTemplate['type']) || 'service-location',
      source_page_path: sourcePagePath,
      url_pattern: `/areas/{location}/${templateName}`,
      slots,
      generation_context: {
        tone: 'professional',
        mention_distance: true,
        keyword_density: 'medium',
        include_demographics: false,
        avoid: ['Generic language', 'Unsubstantiated claims'],
        required_elements: ['City/location name', 'Service type', 'Call to action'],
      },
      managed_components: ['schema', 'faqs', 'metadata'],
    }

    // Create templates directory
    await fs.mkdir(TEMPLATES_DIR, { recursive: true })

    // Write the template
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.json`)
    await fs.writeFile(templatePath, JSON.stringify(template, null, 2))

    console.log('')
    console.log(chalk.green('  ✓ Template created:'), chalk.cyan(templatePath))
    console.log('')
    console.log(chalk.gray('  Template Summary:'))
    console.log(chalk.gray(`    Name: ${template.name}`))
    console.log(chalk.gray(`    Type: ${template.type}`))
    console.log(chalk.gray(`    Slots: ${template.slots.length}`))
    console.log('')
    console.log(chalk.gray('  Extracted Slots:'))
    slots.forEach(slot => {
      console.log(chalk.gray(`    • ${slot.id} (${slot.type})${slot.example ? `: "${truncate(slot.example, 50)}"` : ''}`))
    })
    console.log('')
    console.log(chalk.yellow('  Next steps:'))
    console.log(chalk.gray(`    1. Review the template: cat ${templatePath}`))
    console.log(chalk.gray(`    2. Adjust slots and generation_context as needed`))
    console.log(chalk.gray(`    3. Upload to Portal: npx uptrade-setup locations upload --template ${templateName}`))
    console.log('')

  } catch (error) {
    spinner.fail(`Failed to analyze page: ${(error as Error).message}`)
  }
}

function extractSlotFromAttribute(propName: string, value: any, componentName: string): ContentSlot | null {
  // Skip non-content props
  if (!value) return null
  
  let example: string | undefined
  let slotType: ContentSlot['type'] = 'text'
  
  // Handle string literals
  if (t.isStringLiteral(value)) {
    const text = value.value
    if (text.length < 15) return null // Skip short strings (likely not content)
    example = text
  }
  // Handle JSX expressions
  else if (t.isJSXExpressionContainer(value)) {
    const expr = value.expression
    
    if (t.isStringLiteral(expr)) {
      const text = expr.value
      if (text.length < 15) return null
      example = text
    }
    else if (t.isTemplateLiteral(expr)) {
      example = expr.quasis.map(q => q.value.raw).join('...')
      if (example.length < 15) return null
    }
    else if (t.isArrayExpression(expr)) {
      slotType = 'array'
      // Try to infer item count
      example = `[${expr.elements.length} items]`
    }
    else if (t.isObjectExpression(expr)) {
      slotType = 'object'
    }
    else {
      // Skip other expressions (variables, etc.)
      return null
    }
  }
  else {
    return null
  }

  // Create unique slot ID
  const slotId = `${componentName.toLowerCase()}_${toSnakeCase(propName)}`
  
  // Estimate word count for text
  const wordCount = example ? example.split(/\s+/).length : undefined

  return {
    id: slotId,
    type: slotType,
    example,
    localize: isLocalizableContent(propName, example),
    max_words: wordCount ? Math.ceil(wordCount * 1.5) : undefined,
    generation_hint: inferGenerationHint(propName),
  }
}

function isLocalizableContent(propName: string, example?: string): boolean {
  const locationProps = ['title', 'heading', 'description', 'intro', 'tagline', 'subtitle', 'content', 'paragraph', 'text']
  const propLower = propName.toLowerCase()
  
  // Check prop name
  if (locationProps.some(p => propLower.includes(p))) return true
  
  // Check if example contains placeholder location text
  if (example && /\b(city|location|area|region|county)\b/i.test(example)) return true
  
  return false
}

function inferGenerationHint(propName: string): string | undefined {
  const propLower = propName.toLowerCase()
  
  if (propLower.includes('title')) return 'Include city name, keep action-oriented'
  if (propLower.includes('subtitle') || propLower.includes('tagline')) return 'Highlight local expertise'
  if (propLower.includes('description') || propLower.includes('intro')) return 'Mention specific neighborhoods, distance from office'
  if (propLower.includes('cta')) return 'Strong call to action'
  
  return undefined
}

function inferTemplateName(sourcePath: string): string {
  // Extract from path like app/services/plumbing/page.tsx → plumbing
  const parts = sourcePath.split(path.sep)
  const pageIndex = parts.findIndex(p => p === 'page.tsx' || p === 'page.jsx')
  
  if (pageIndex > 0) {
    return parts[pageIndex - 1]
  }
  
  // Fallback to last meaningful directory
  const filtered = parts.filter(p => !['app', 'src', 'pages', 'page.tsx', 'page.jsx'].includes(p))
  return filtered[filtered.length - 1] || 'template'
}

function inferSourcePagePath(sourcePath: string): string {
  // Convert file path to URL path
  // app/services/plumbing/page.tsx → /services/plumbing
  const parts = sourcePath.split(path.sep)
  
  // Find app or pages directory
  const appIndex = parts.findIndex(p => p === 'app' || p === 'pages')
  if (appIndex >= 0) {
    const pathParts = parts.slice(appIndex + 1)
    // Remove page.tsx
    const filtered = pathParts.filter(p => !['page.tsx', 'page.jsx', 'index.tsx', 'index.jsx'].includes(p))
    return '/' + filtered.join('/')
  }
  
  return '/' + path.basename(sourcePath, path.extname(sourcePath))
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

// ============================================
// Upload Command - Push template to Portal
// ============================================

async function uploadCommand(templateName: string, config: Config) {
  const spinner = ora('Uploading template to Portal...').start()

  try {
    // Read template file
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.json`)
    
    if (!existsSync(templatePath)) {
      spinner.fail(`Template not found: ${templatePath}`)
      console.log(chalk.gray(`  Run: npx uptrade-setup locations template <page> --name ${templateName}`))
      return
    }

    const template = JSON.parse(readFileSync(templatePath, 'utf-8')) as LocationTemplate

    // Upload to Portal API
    const response = await fetch(`${API_URL}/seo/location-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        project_id: config.projectId,
        ...template,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      if (response.status === 409) {
        // Already exists - update instead
        spinner.text = 'Template exists, updating...'
        
        // Get existing template
        const existing = await fetch(
          `${API_URL}/seo/location-templates/by-name/${templateName}?project_id=${config.projectId}`,
          { headers: { 'Authorization': `Bearer ${config.apiKey}` } }
        )
        const existingData = await existing.json()
        
        // Update it
        const updateResponse = await fetch(`${API_URL}/seo/location-templates/${existingData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(template),
        })
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to update: ${await updateResponse.text()}`)
        }
        
        spinner.succeed('Template updated in Portal')
      } else {
        throw new Error(error)
      }
    } else {
      spinner.succeed('Template uploaded to Portal')
    }

    console.log('')
    console.log(chalk.green('  ✓ Template is now available in Portal'))
    console.log(chalk.gray('    Signal AI will use this template when generating location pages'))
    console.log('')
    console.log(chalk.yellow('  Next step:'))
    console.log(chalk.gray(`    npx uptrade-setup locations generate --template ${templateName} --locations "Seattle, WA" "Tacoma, WA"`))
    console.log('')

  } catch (error) {
    spinner.fail(`Failed to upload template: ${(error as Error).message}`)
  }
}

// ============================================
// Generate Command - Generate location pages via Signal
// ============================================

async function generateCommand(options: LocationsOptions, config: Config) {
  const { template, locations, locationsFile, type } = options
  
  // Collect locations
  let locationList: string[] = locations || []
  
  if (locationsFile) {
    try {
      const fileContent = readFileSync(locationsFile, 'utf-8')
      const parsed = JSON.parse(fileContent)
      locationList = Array.isArray(parsed) ? parsed : parsed.locations || []
    } catch (e) {
      console.log(chalk.red(`  ✗ Failed to read locations file: ${locationsFile}`))
      return
    }
  }

  if (locationList.length === 0 && type !== 'index') {
    console.log(chalk.red('  ✗ No locations specified'))
    console.log(chalk.gray('    Use --locations "City, ST" or --locations-file locations.json'))
    return
  }

  const spinner = ora(`Generating ${type || 'service-location'} pages...`).start()

  try {
    // Call Signal API to generate pages
    const response = await fetch(`${API_URL}/seo/location-pages/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        project_id: config.projectId,
        template_name: template,
        locations: locationList,
        page_type: type || 'service-location',
      }),
    })

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const result = await response.json()
    
    spinner.succeed(`Generated ${result.pages_created || locationList.length} location pages`)

    console.log('')
    console.log(chalk.green('  ✓ Location pages generated'))
    console.log(chalk.gray('    Content stored in Portal as managed content'))
    console.log('')
    
    if (result.pages_created) {
      console.log(chalk.gray('  Generated Pages:'))
      result.pages?.forEach((page: any) => {
        console.log(chalk.gray(`    • ${page.path}`))
      })
      console.log('')
    }

    console.log(chalk.yellow('  Next step:'))
    console.log(chalk.gray('    Review and edit content in Portal → SEO → Location Pages'))
    console.log('')

  } catch (error) {
    spinner.fail(`Failed to generate pages: ${(error as Error).message}`)
  }
}

// ============================================
// List Command - Show templates for project
// ============================================

async function listCommand(config: Config) {
  const spinner = ora('Fetching templates...').start()

  try {
    // Get templates from Portal
    const response = await fetch(
      `${API_URL}/seo/location-templates?project_id=${config.projectId}`,
      { headers: { 'Authorization': `Bearer ${config.apiKey}` } }
    )

    if (!response.ok) {
      throw new Error(await response.text())
    }

    const templates = await response.json()
    
    spinner.succeed(`Found ${templates.length} templates`)

    console.log('')
    
    if (templates.length === 0) {
      console.log(chalk.gray('  No templates found for this project'))
      console.log('')
      console.log(chalk.yellow('  Create one with:'))
      console.log(chalk.gray('    npx uptrade-setup locations template ./app/services/plumbing/page.tsx'))
    } else {
      console.log(chalk.gray('  Templates:'))
      templates.forEach((t: LocationTemplate) => {
        console.log('')
        console.log(chalk.cyan(`    ${t.name}`))
        console.log(chalk.gray(`      Type: ${t.type}`))
        console.log(chalk.gray(`      Slots: ${t.slots.length}`))
        console.log(chalk.gray(`      URL Pattern: ${t.url_pattern}`))
      })
    }
    
    console.log('')

    // Also check local templates
    if (existsSync(TEMPLATES_DIR)) {
      const files = await fs.readdir(TEMPLATES_DIR)
      const localTemplates = files.filter(f => f.endsWith('.json'))
      
      if (localTemplates.length > 0) {
        console.log(chalk.gray('  Local (not uploaded):'))
        localTemplates.forEach(f => {
          console.log(chalk.gray(`    • ${f.replace('.json', '')}`))
        })
        console.log('')
      }
    }

  } catch (error) {
    spinner.fail(`Failed to fetch templates: ${(error as Error).message}`)
  }
}

// ============================================
// Config Loading
// ============================================

interface Config {
  projectId: string
  apiKey: string
}

async function loadConfig(): Promise<Config | null> {
  // Check for .uptrade/config.json
  const configPath = path.join('.uptrade', 'config.json')
  
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'))
      return {
        projectId: config.projectId || config.project_id,
        apiKey: config.apiKey || config.api_key,
      }
    } catch {
      return null
    }
  }

  // Check environment variables
  const projectId = process.env.NEXT_PUBLIC_UPTRADE_PROJECT_ID || process.env.UPTRADE_PROJECT_ID
  const apiKey = process.env.UPTRADE_API_KEY

  if (projectId && apiKey) {
    return { projectId, apiKey }
  }

  return null
}
