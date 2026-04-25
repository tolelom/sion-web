import { useState, useCallback, useRef } from 'react'

export interface DialogState {
  isOpen: boolean
  message: string
  title?: string
  showCancel: boolean
}

export function useConfirmDialog() {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    message: '',
    showCancel: true,
  })
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const openDialog = useCallback((message: string, title?: string, showCancel = true): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve
      setState({ isOpen: true, message, title, showCancel })
    })
  }, [])

  const confirm = useCallback(
    (message: string, title?: string) => openDialog(message, title, true),
    [openDialog]
  )

  const alert = useCallback(
    (message: string, title?: string) => openDialog(message, title, false),
    [openDialog]
  )

  const handleConfirm = useCallback(() => {
    resolveRef.current?.(true)
    resolveRef.current = null
    setState(s => ({ ...s, isOpen: false }))
  }, [])

  const handleCancel = useCallback(() => {
    resolveRef.current?.(false)
    resolveRef.current = null
    setState(s => ({ ...s, isOpen: false }))
  }, [])

  return { dialogState: state, confirm, alert, handleConfirm, handleCancel }
}
