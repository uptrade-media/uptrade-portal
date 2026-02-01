import type { ReactNode } from 'react'

export interface UptradeSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  /** Optional accessible label (aria-label defaults to "Loading" when omitted) */
  label?: string
  className?: string
}

export function UptradeSpinner(props: UptradeSpinnerProps): ReactNode

declare const UptradeLoading: {
  (): ReactNode
  Spinner: typeof UptradeSpinner
}
export default UptradeLoading
