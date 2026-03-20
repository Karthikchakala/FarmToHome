import './EmptyState.css'

const EmptyState = ({ 
  icon = '📦', 
  title = 'No Data', 
  description = 'No items to display',
  action = null,
  size = 'medium'
}) => {
  return (
    <div className={`empty-state empty-state-${size}`}>
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  )
}

export default EmptyState
