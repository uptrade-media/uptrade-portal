/**
 * LoadingSpinner - Re-exports UptradeSpinner as the single loading indicator.
 * Use for inline/section loading (content areas, panels).
 * For full-page loading use UptradeLoading.
 *
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} label - Optional text below spinner
 * @param {string} className - Optional wrapper class
 */
import { UptradeSpinner } from '@/components/UptradeLoading'

export function LoadingSpinner({ size = 'md', label, className }) {
  return <UptradeSpinner size={size} label={label} className={className} />
}

export { UptradeSpinner }
export default LoadingSpinner
