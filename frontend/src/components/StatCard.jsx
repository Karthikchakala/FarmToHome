import './StatCard.css'

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'primary', 
  trend, 
  trendValue, 
  loading = false,
  onClick 
}) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      // Format large numbers
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M'
      } else if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K'
      } else if (val >= 100) {
        return val.toLocaleString()
      }
      return val.toString()
    }
    return val
  }

  const getTrendIcon = () => {
    if (trend === 'up') return '📈'
    if (trend === 'down') return '📉'
    if (trend === 'neutral') return '➡️'
    return ''
  }

  const getTrendColor = () => {
    if (trend === 'up') return '#28a745'
    if (trend === 'down') return '#dc3545'
    if (trend === 'neutral') return '#6c757d'
    return '#6c757d'
  }

  const getCardColor = () => {
    const colors = {
      primary: '#2c7a2c',
      success: '#28a745',
      warning: '#ffc107',
      danger: '#dc3545',
      info: '#17a2b8',
      secondary: '#6c757d'
    }
    return colors[color] || colors.primary
  }

  if (loading) {
    return (
      <div className="stat-card loading">
        <div className="stat-icon">
          <div className="loading-spinner"></div>
        </div>
        <div className="stat-content">
          <div className="stat-title loading-placeholder"></div>
          <div className="stat-value loading-placeholder"></div>
          <div className="stat-subtitle loading-placeholder"></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`stat-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      style={{ '--card-color': getCardColor() }}
    >
      <div className="stat-icon">
        <span className="icon">{icon}</span>
      </div>
      
      <div className="stat-content">
        <div className="stat-header">
          <h3 className="stat-title">{title}</h3>
          {trend && (
            <div className="stat-trend" style={{ color: getTrendColor() }}>
              <span className="trend-icon">{getTrendIcon()}</span>
              <span className="trend-value">{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className="stat-value">
          {formatValue(value)}
        </div>
        
        {subtitle && (
          <div className="stat-subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCard
