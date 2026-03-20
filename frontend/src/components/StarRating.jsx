import { useState } from 'react'
import './StarRating.css'

const StarRating = ({ 
  rating = 0, 
  onChange, 
  readonly = false, 
  size = 'medium', 
  showValue = true,
  interactive = true 
}) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [currentRating, setCurrentRating] = useState(rating)

  const handleStarClick = (starRating) => {
    if (!readonly && interactive) {
      const newRating = starRating === currentRating ? 0 : starRating
      setCurrentRating(newRating)
      setHoverRating(0)
      if (onChange) {
        onChange(newRating)
      }
    }
  }

  const handleStarHover = (starRating) => {
    if (!readonly && interactive) {
      setHoverRating(starRating)
    }
  }

  const handleStarLeave = () => {
    if (!readonly && interactive) {
      setHoverRating(0)
    }
  }

  const getStarClass = (starNumber) => {
    const effectiveRating = hoverRating || currentRating
    let className = `star star-${size}`

    if (starNumber <= effectiveRating) {
      className += ' filled'
    } else if (starNumber - 0.5 <= effectiveRating) {
      className += ' half'
    } else {
      className += ' empty'
    }

    if (!readonly && interactive) {
      className += ' interactive'
    }

    return className
  }

  const renderStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={getStarClass(i)}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => handleStarHover(i)}
          onMouseLeave={handleStarLeave}
          role={interactive && !readonly ? 'button' : 'img'}
          aria-label={interactive && !readonly ? `Rate ${i} stars` : `Rating ${currentRating} stars`}
          tabIndex={interactive && !readonly ? 0 : -1}
        >
          ★
        </span>
      )
    }
    return stars
  }

  const getRatingText = () => {
    const effectiveRating = hoverRating || currentRating
    if (effectiveRating === 0) return 'Not rated'
    if (effectiveRating <= 1) return 'Poor'
    if (effectiveRating <= 2) return 'Fair'
    if (effectiveRating <= 3) return 'Good'
    if (effectiveRating <= 4) return 'Very Good'
    return 'Excellent'
  }

  return (
    <div className={`star-rating ${readonly ? 'readonly' : 'interactive'} size-${size}`}>
      <div className="stars-container" onMouseLeave={handleStarLeave}>
        {renderStars()}
      </div>
      
      {showValue && (
        <div className="rating-info">
          <span className="rating-value">
            {hoverRating || currentRating || 0}
          </span>
          <span className="rating-text">
            {getRatingText()}
          </span>
        </div>
      )}
    </div>
  )
}

export default StarRating
