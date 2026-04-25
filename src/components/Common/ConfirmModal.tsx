import React from 'react'
import type { DialogState } from '../../hooks/useConfirmDialog'
import '../../styles/modal.css'

interface ConfirmModalProps extends DialogState {
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmModal = ({ isOpen, message, title, showCancel, onConfirm, onCancel }: ConfirmModalProps) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={showCancel ? onCancel : undefined}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          {showCancel && (
            <button className="modal-btn modal-btn-cancel" onClick={onCancel}>취소</button>
          )}
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm} autoFocus>확인</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
