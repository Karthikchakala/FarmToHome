import './Card.css'

const Card = ({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'medium',
  elevation = 'medium',
  padding = 'medium',
  rounded = true,
  bordered = true,
  hoverable = false,
  clickable = false,
  onClick,
  ...props 
}) => {
  const cardClasses = [
    'card',
    `card-${variant}`,
    `card-${size}`,
    `card-elevation-${elevation}`,
    `card-padding-${padding}`,
    rounded && 'card-rounded',
    bordered && 'card-bordered',
    hoverable && 'card-hoverable',
    clickable && 'card-clickable',
    className
  ].filter(Boolean).join(' ')

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

// Card sub-components
const CardHeader = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
)

const CardBody = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '', ...props }) => (
  <div className={`card-footer ${className}`} {...props}>
    {children}
  </div>
)

const CardImage = ({ src, alt, className = '', ...props }) => (
  <div className={`card-image ${className}`}>
    <img src={src} alt={alt} {...props} />
  </div>
)

const CardTitle = ({ children, className = '', ...props }) => (
  <h3 className={`card-title ${className}`} {...props}>
    {children}
  </h3>
)

const CardSubtitle = ({ children, className = '', ...props }) => (
  <h4 className={`card-subtitle ${className}`} {...props}>
    {children}
  </h4>
)

const CardText = ({ children, className = '', ...props }) => (
  <p className={`card-text ${className}`} {...props}>
    {children}
  </p>
)

const CardActions = ({ children, className = '', ...props }) => (
  <div className={`card-actions ${className}`} {...props}>
    {children}
  </div>
)

export {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  CardImage,
  CardTitle,
  CardSubtitle,
  CardText,
  CardActions
}

export default Card
