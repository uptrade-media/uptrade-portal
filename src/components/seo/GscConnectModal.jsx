/**
 * GscConnectModal - Connect Google Search Console via OAuth in a popup
 *
 * Opens OAuth in a popup (no full-page redirect). Listens for postMessage from
 * the callback so the connection is completed and the UI updates without leaving the page.
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { Link2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { oauthApi } from '@/lib/portal-api'

const POPUP_WIDTH = 520
const POPUP_HEIGHT = 600

export default function GscConnectModal({ open, onOpenChange, projectId, onSuccess }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'opening' | 'waiting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null)
  const popupRef = useRef(null)
  const messageHandlerRef = useRef(null)
  const intervalRef = useRef(null)

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (messageHandlerRef.current && typeof window !== 'undefined') {
      window.removeEventListener('message', messageHandlerRef.current)
      messageHandlerRef.current = null
    }
    if (popupRef.current && !popupRef.current.closed) {
      try { popupRef.current.close() } catch (_) {}
      popupRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) {
      cleanup()
      setStatus('idle')
      setErrorMessage(null)
    }
  }, [open, cleanup])

  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  const handleOpenPopup = useCallback(async () => {
    if (!projectId) return
    setStatus('opening')
    setErrorMessage(null)
    try {
      const returnUrl = window.location.origin + window.location.pathname
      const res = await oauthApi.initiate('google', projectId, 'seo', returnUrl, { popupMode: true })
      const url = res?.url
      if (!url || typeof url !== 'string' || !url.startsWith('https://accounts.google.com')) {
        setErrorMessage(
          'Could not get Google sign-in URL. The Portal API may be unreachable or OAuth is not configured. Check VITE_PORTAL_API_URL and that the API is running.'
        )
        setStatus('error')
        toast.error('Failed to start GSC connection')
        return
      }
      const left = Math.round((window.screen.width - POPUP_WIDTH) / 2)
      const top = Math.round((window.screen.height - POPUP_HEIGHT) / 2)
      const popup = window.open(
        url,
        'gsc-oauth',
        `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
      )
      popupRef.current = popup
      if (!popup) {
        setErrorMessage('Popup was blocked. Please allow popups for this site and try again.')
        setStatus('error')
        return
      }
      setStatus('waiting')

      const handleMessage = (event) => {
        if (event.source !== popup) return
        const data = event.data
        if (!data || typeof data !== 'object') return
        if (data.type === 'oauth-success') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          window.removeEventListener('message', messageHandlerRef.current)
          messageHandlerRef.current = null
          try { popup.close() } catch (_) {}
          popupRef.current = null
          setStatus('success')
          toast.success('Google Search Console connected')
          onSuccess?.({
            connectionId: data.connectionId,
            selectProperty: data.selectProperty === true,
          })
          onOpenChange?.(false)
        } else if (data.type === 'oauth-error') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          window.removeEventListener('message', messageHandlerRef.current)
          messageHandlerRef.current = null
          setErrorMessage(data.error || 'Connection failed')
          setStatus('error')
          toast.error(data.error || 'Failed to connect GSC')
        }
      }

      messageHandlerRef.current = handleMessage
      window.addEventListener('message', handleMessage)

      intervalRef.current = setInterval(() => {
        if (popup.closed) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          cleanup()
          setStatus((s) => {
            if (s === 'waiting') onOpenChange?.(false)
            return 'idle'
          })
        }
      }, 500)
    } catch (err) {
      console.error('Connect GSC failed:', err)
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to start connection')
      setStatus('error')
      toast.error('Failed to connect GSC')
    }
  }, [projectId, onSuccess, onOpenChange, cleanup])

  const handleClose = useCallback(() => {
    cleanup()
    setStatus('idle')
    setErrorMessage(null)
    onOpenChange?.(false)
  }, [cleanup, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => status === 'waiting' && e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-amber-500" />
            Connect Google Search Console
          </DialogTitle>
          <DialogDescription>
            {status === 'idle' && 'We\'ll open a popup to connect your Google account. No full-page redirect.'}
            {status === 'opening' && 'Opening Google sign-in...'}
            {status === 'waiting' && 'Complete the sign-in in the popup window. You can leave this dialog open.'}
            {status === 'success' && 'Connected! Refreshing your data.'}
            {status === 'error' && (errorMessage || 'Something went wrong.')}
          </DialogDescription>
        </DialogHeader>
        {status === 'error' && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-2 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          {status === 'error' && (
            <Button variant="outline" onClick={handleOpenPopup}>Try again</Button>
          )}
          {status !== 'waiting' && status !== 'opening' && (
            <Button variant="ghost" onClick={handleClose}>
              {status === 'success' ? 'Close' : 'Cancel'}
            </Button>
          )}
          {status === 'idle' && (
            <Button onClick={handleOpenPopup}>Continue with Google</Button>
          )}
          {(status === 'opening' || status === 'waiting') && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{status === 'opening' ? 'Opening...' : 'Waiting for approval...'}</span>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
