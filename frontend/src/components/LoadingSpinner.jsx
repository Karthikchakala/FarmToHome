import './LoadingSpinner.css'

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = 'Loading...',
  showText = true,
  overlay = false 
}) => {
  const spinnerClass = `spinner spinner-${size} spinner-${color}`
  const containerClass = overlay ? 'spinner-overlay' : 'spinner-container'

  return (
    <div className={containerClass}>
      <div className={spinnerClass}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {showText && text && (
        <p className="spinner-text">{text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
