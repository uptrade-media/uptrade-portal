/**
 * SEO Error Boundary
 * 
 * Catches errors in SEO components and provides graceful fallback UI.
 * Prevents entire app from crashing when SEO module has issues.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class SEOErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service (e.g., Sentry)
    console.error('SEO Error Boundary caught error:', error, errorInfo)
    
    // Call optional error callback
    this.props.onError?.(error, errorInfo)
    
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return <SEOErrorFallback error={this.state.error} onReset={this.handleReset} />
    }

    return this.props.children
  }
}

/**
 * Default error fallback component
 */
interface SEOErrorFallbackProps {
  error: Error | null
  onReset?: () => void
}

export function SEOErrorFallback({ error, onReset }: SEOErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              SEO Module Error
            </h2>
            <p className="text-sm text-gray-600">
              Something went wrong loading the SEO module
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm font-mono text-red-900">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {onReset && (
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          )}

          <button
            onClick={() => (window.location.href = '/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p className="font-medium mb-2">What you can do:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Try refreshing the page</li>
            <li>Clear your browser cache</li>
            <li>Check your internet connection</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-48">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Minimal error fallback for smaller UI sections
 */
export function SEOErrorFallbackMinimal({ error, onReset }: SEOErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
      <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
      <p className="text-sm text-red-900 mb-3">Failed to load SEO data</p>
      {onReset && (
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  )
}
