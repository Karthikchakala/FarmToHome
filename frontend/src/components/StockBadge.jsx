import './StockBadge.css'

const StockBadge = ({ stockQuantity, isAvailable, showText = true }) => {
  if (!isAvailable) {
    return (
      <span className="stock-badge stock-unavailable">
        {showText && 'Unavailable'}
      </span>
    )
  }

  if (stockQuantity === 0) {
    return (
      <span className="stock-badge stock-out">
        {showText && 'Out of Stock'}
      </span>
    )
  }

  if (stockQuantity <= 5) {
    return (
      <span className="stock-badge stock-low">
        {showText && `Only ${stockQuantity} left`}
      </span>
    )
  }

  return (
    <span className="stock-badge stock-available">
      {showText && `In Stock (${stockQuantity})`}
    </span>
  )
}

export default StockBadge
