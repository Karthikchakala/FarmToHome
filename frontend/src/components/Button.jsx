import './Button.css'

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  loading = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  outlined = false,
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  const buttonClasses = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    rounded && 'btn-rounded',
    outlined && 'btn-outlined',
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ')

  const renderIcon = () => {
    if (!icon) return null
    
    return (
      <span className={`btn-icon btn-icon-${iconPosition}`}>
        {icon}
      </span>
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className="btn-spinner">
            <div className="spinner"></div>
          </span>
          <span className="btn-text">{children}</span>
        </>
      )
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <span className="btn-text">{children}</span>
        {iconPosition === 'right' && renderIcon()}
      </>
    )
  }

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  )
}

export default Button
