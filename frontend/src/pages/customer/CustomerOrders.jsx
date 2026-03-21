import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { orderAPI } from '../../services/api'
import SEO from '../../components/SEO'
import LoadingSpinner from '../../components/LoadingSpinner'
import Button from '../../components/Button'
import './CustomerOrders.css'

const CustomerOrders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const navigate = useNavigate()

  useEffect(() => {
    loadOrders()
  }, [pagination.page])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await orderAPI.getOrders({
        page: pagination.page,
        limit: pagination.limit
      })
      
      if (response.data.success) {
        setOrders(response.data.data.orders || [])
        setPagination(response.data.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        })
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    }
    return <span className={`status-badge ${statusColors[status] || 'status-pending'}`}>{status}</span>
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="customer-orders">
        <div className="container">
          <div className="orders-header">
            <h1>My Orders</h1>
          </div>
          <LoadingSpinner size="large" text="Loading orders..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="customer-orders">
        <div className="container">
          <div className="orders-header">
            <h1>My Orders</h1>
          </div>
          <div className="error-message">
            <p>{error}</p>
            <Button onClick={loadOrders} variant="primary">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO
        title="My Orders - Farm to Table"
        description="View and track all your orders. Manage your farm-fresh purchases."
      />

      <div className="customer-orders">
        <div className="container">
          <div className="orders-header">
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
          </div>

          {orders.length === 0 ? (
            <div className="empty-orders">
              <div className="empty-icon">📦</div>
              <h2>No orders yet</h2>
              <p>You haven't placed any orders. Start shopping to see your orders here.</p>
              <Button onClick={() => navigate('/customer/products')} variant="primary" size="large">
                Browse Products
              </Button>
            </div>
          ) : (
            <>
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <span className="order-number">{order.orderNumber}</span>
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="order-items">
                      {(order.items || []).slice(0, 3).map((item, index) => (
                        <div key={index} className="order-item">
                          <span className="item-name">{item.name || 'Product'}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <span className="item-price">₹{(item.total || 0).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <div className="more-items">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>

                    <div className="order-footer">
                      <div className="order-total">
                        <span>Total:</span>
                        <span className="total-amount">₹{(order.finalAmount || order.totalAmount || 0).toFixed(2)}</span>
                      </div>
                      <div className="order-actions">
                        <Button
                          onClick={() => navigate(`/orders/${order._id}`)}
                          variant="outline"
                          size="small"
                        >
                          View Details
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => navigate(`/orders/${order._id}/cancel`)}
                            variant="secondary"
                            size="small"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <Button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    variant="outline"
                    size="small"
                  >
                    ← Previous
                  </Button>
                  <span className="page-info">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    variant="outline"
                    size="small"
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default CustomerOrders
