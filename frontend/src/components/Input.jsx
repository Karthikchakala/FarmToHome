import { forwardRef } from 'react'
import './Input.css'

const Input = forwardRef(({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  disabled = false,
  required = false,
  size = 'medium',
  variant = 'outlined',
  fullWidth = false,
  startIcon = null,
  endIcon = null,
  className = '',
  ...props
}, ref) => {
  const inputClasses = [
    'input',
    `input-${size}`,
    `input-${variant}`,
    fullWidth && 'input-full-width',
    error && 'input-error',
    disabled && 'input-disabled',
    startIcon && 'input-with-start-icon',
    endIcon && 'input-with-end-icon',
    className
  ].filter(Boolean).join(' ')

  const containerClasses = [
    'input-container',
    `input-container-${size}`,
    fullWidth && 'input-container-full-width',
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        {startIcon && (
          <span className="input-icon input-start-icon">
            {startIcon}
          </span>
        )}
        
        <input
          ref={ref}
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          {...props}
        />
        
        {endIcon && (
          <span className="input-icon input-end-icon">
            {endIcon}
          </span>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="input-helper">
          {error && (
            <span className="input-error-text">{error}</span>
          )}
          {!error && helperText && (
            <span className="input-helper-text">{helperText}</span>
          )}
        </div>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
