/**
 * CodeBlock Component
 * 
 * Syntax-highlighted code blocks with copy button.
 * Used in MessageBubble for rendering code from AI responses.
 */

import { useState, useCallback } from 'react'
import { Highlight, themes } from 'prism-react-renderer'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import useThemeStore from '@/lib/theme-store'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = 'text', className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const resolvedTheme = useThemeStore(state => state.resolvedTheme)
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [code])
  
  // Map common language aliases
  const normalizedLang = normalizeLanguage(language)
  
  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      {/* Language label + Copy button */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--surface-tertiary)] border-b border-[var(--glass-border)]/30">
        <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors',
            copied 
              ? 'text-green-500 bg-green-500/10' 
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'
          )}
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <Highlight
        theme={resolvedTheme === 'dark' ? themes.nightOwl : themes.github}
        code={code.trim()}
        language={normalizedLang}
      >
        {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(
              highlightClass,
              'p-3 overflow-x-auto text-sm leading-relaxed'
            )}
            style={{ ...style, margin: 0, background: 'var(--surface-secondary)' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                <span className="inline-block w-8 text-[var(--text-tertiary)] text-right mr-4 select-none text-xs">
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

/**
 * Normalize language aliases to prism-supported languages
 */
function normalizeLanguage(lang: string): string {
  const aliases: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'tsx',
    'jsx': 'jsx',
    'py': 'python',
    'rb': 'ruby',
    'sh': 'bash',
    'shell': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'json': 'json',
    'sql': 'sql',
    'css': 'css',
    'scss': 'scss',
    'html': 'markup',
    'xml': 'markup',
    'text': 'text',
    'plaintext': 'text',
  }
  
  return aliases[lang.toLowerCase()] || lang.toLowerCase()
}
