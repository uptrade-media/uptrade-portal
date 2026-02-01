/**
 * Install Command - Install @uptrade/site-kit in a project
 */

import chalk from 'chalk'
import ora from 'ora'
import { execSync, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

interface InstallOptions {
  dev?: boolean
  dryRun?: boolean
}

export async function installCommand(options: InstallOptions) {
  console.log('')
  console.log(chalk.bold('  Install @uptrade/site-kit'))
  console.log('')

  // Check for package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  if (!existsSync(packageJsonPath)) {
    console.log(chalk.red('  ✗ No package.json found'))
    console.log(chalk.gray('    Make sure you are in a Node.js project'))
    console.log('')
    process.exit(1)
  }

  // Detect package manager
  const pm = detectPackageManager()
  console.log(chalk.gray(`  Using ${pm}`))

  const installCmd = pm === 'pnpm' ? 'pnpm add' :
                     pm === 'yarn' ? 'yarn add' :
                     'npm install'

  const devFlag = options.dev ? (pm === 'npm' ? '--save-dev' : '-D') : ''
  const fullCmd = `${installCmd} @uptrade/site-kit ${devFlag}`.trim()

  console.log('')
  console.log(chalk.gray(`  $ ${fullCmd}`))
  console.log('')

  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would run the above command'))
    console.log('')
    return
  }

  const spinner = ora('Installing...').start()

  try {
    execSync(fullCmd, { 
      stdio: 'pipe',
      cwd: process.cwd(),
    })
    spinner.succeed('Installed @uptrade/site-kit')
    console.log('')
    console.log(chalk.green('  Next steps:'))
    console.log(chalk.gray('    1. Run: npx uptrade-setup init'))
    console.log(chalk.gray('    2. Follow the setup wizard'))
    console.log('')
  } catch (error: any) {
    spinner.fail('Installation failed')
    console.log(chalk.red(`  ${error.message}`))
    console.log('')
  }
}

function detectPackageManager(): 'pnpm' | 'yarn' | 'npm' {
  if (existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (existsSync(path.join(process.cwd(), 'yarn.lock'))) {
    return 'yarn'
  }
  return 'npm'
}
