import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/LoadingSpinner'
import './StockManagement.css'

const StockManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stockItems, setStockItems] = useState([])

  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true)
        // TODO: Replace with actual API call
        // For now, show no data state
        setStockItems([])
      } catch (error) {
        console.error('Error fetching stock:', error)
        setStockItems([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchStock()
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="stock-management">
        <div className="auth-message">
          <h2>Please login to manage your stock</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner size="large" text="Loading stock data..." />
  }

  return (
    <div className="stock-management">
      <div className="page-header">
        <h1>📦 Stock Management</h1>
      </div>
      
      <div className="stock-container">
        <h2>Stock Levels - Coming Soon</h2>
        <p>This page will allow you to manage your inventory levels and set up low stock alerts.</p>
        
        <div className="mock-data">
          {stockItems.map(item => (
            <div key={item._id} className="stock-item">
              <h3>{item.productName}</h3>
              <p>Current Stock: {item.currentStock} {item.unit}</p>
              <p>Status: {item.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StockManagement
