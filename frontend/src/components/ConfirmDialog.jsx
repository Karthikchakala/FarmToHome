import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  confirmButtonVariant = 'primary',
  showCancelButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true
}) => {
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (closeOnEscape && event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Store current focus
      previousFocusRef.current = document.activeElement
      
      // Focus the dialog
      if (dialogRef.current) {
        dialogRef.current.focus()
      }
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
      
      // Restore focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [isOpen, closeOnEscape, onClose])

  const handleOutsideClick = (event) => {
    if (closeOnOutsideClick && dialogRef.current && !dialogRef.current.contains(event.target)) {
      onClose()
    }
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="confirm-dialog-overlay" onClick={handleOutsideClick}>
      <div 
        className={`confirm-dialog confirm-dialog-${type}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex="-1"
      >
        <div className="confirm-dialog-header">
          <h3 id="confirm-dialog-title" className="confirm-dialog-title">
            {title}
          </h3>
        </div>
        
        <div className="confirm-dialog-body">
          <p id="confirm-dialog-message" className="confirm-dialog-message">
            {message}
          </p>
        </div>
        
        <div className="confirm-dialog-actions">
          {showCancelButton && (
            <button
              className="confirm-dialog-btn confirm-dialog-btn-cancel"
              onClick={handleCancel}
              type="button"
            >
              {cancelText}
            </button>
          )}
          
          <button
            className={`confirm-dialog-btn confirm-dialog-btn-confirm confirm-dialog-btn-${type}`}
            onClick={handleConfirm}
            type="button"
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
