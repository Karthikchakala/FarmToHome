import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { subscriptionAPI } from '../../services/subscriptionAPI'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../contexts/AuthContext'
import SEO from '../../components/SEO'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Card from '../../components/Card'
import LoadingSpinner from '../../components/LoadingSpinner'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import SubscriptionCard from '../../components/SubscriptionCard'
import './Subscriptions.css'

const Subscriptions = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [pagination, setPagination] = useState(null)
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  })

  const { success, error: showError } = useToast()

  // Wait for AuthContext to load, then check authentication
  useEffect(() => {
    if (!authLoading) {
      console.log('Subscriptions - Auth check:', { isAuthenticated, user, authLoading })
      setCheckingAuth(false)
      if (!isAuthenticated) {
        console.log('Subscriptions - Redirecting to login')
        navigate('/login')
        return
      }
    }
  }, [isAuthenticated, navigate, user, authLoading])

  useEffect(() => {
    if (isAuthenticated && !checkingAuth && !authLoading) {
      console.log('Subscriptions - Loading subscriptions')
      loadSubscriptions()
    }
  }, [filters, isAuthenticated, checkingAuth, authLoading])

  // Show loading while AuthContext is loading or checking auth
  if (authLoading || checkingAuth) {
    return <LoadingSpinner size="large" text="Checking authentication..." />
  }

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch real data from backend
      const response = await subscriptionAPI.getUserSubscriptions(filters)
      
      if (response.data.success) {
        setSubscriptions(response.data.data.subscriptions || [])
        setPagination(response.data.data.pagination || null)
      } else {
        setError(response.data.error || 'Failed to load subscriptions')
        setSubscriptions([])
        setPagination(null)
      }
    } catch (err) {
      console.error('Error loading subscriptions:', err)
      setError('Failed to connect to server. Please try again later.')
      setSubscriptions([])
      setPagination(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? value : 1
    }))
  }

  const handleSubscriptionUpdate = (updatedSubscription) => {
    setSubscriptions(prev => 
      prev.map(sub => 
        sub._id === updatedSubscription._id ? updatedSubscription : sub
      )
    )
  }

  const getStatusOptions = () => [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PAUSED', label: 'Paused' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ]

  const getStats = () => {
    const total = subscriptions.length
    const active = subscriptions.filter(sub => sub.status === 'ACTIVE').length
    const paused = subscriptions.filter(sub => sub.status === 'PAUSED').length
    const cancelled = subscriptions.filter(sub => sub.status === 'CANCELLED').length
    
    return { total, active, paused, cancelled }
  }

  const stats = getStats()

  if (loading) {
    return (
      <>
        <SEO 
          title="My Subscriptions"
          description="Manage your product subscriptions. View active, paused, and cancelled subscriptions."
          keywords="subscriptions, recurring orders, product delivery, farm subscription"
        />
        
        <div className="subscriptions">
          <div className="subscriptions-header">
            <h1>My Subscriptions</h1>
            <p>Manage your recurring product orders</p>
          </div>
          
          <LoadingSpinner size="large" text="Loading subscriptions..." />
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SEO 
          title="My Subscriptions"
          description="Manage your product subscriptions. View active, paused, and cancelled subscriptions."
          keywords="subscriptions, recurring orders, product delivery, farm subscription"
        />
        
        <div className="subscriptions">
          <div className="subscriptions-header">
            <h1>My Subscriptions</h1>
            <p>Manage your recurring product orders</p>
          </div>
          
          <EmptyState
            title="Error Loading Subscriptions"
            description={error}
            actionText="Try Again"
            onAction={loadSubscriptions}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <SEO 
        title="My Subscriptions"
        description="Manage your product subscriptions. View active, paused, and cancelled subscriptions."
        keywords="subscriptions, recurring orders, product delivery, farm subscription"
      />
      
      <div className="subscriptions">
        <div className="subscriptions-header">
          <h1>My Subscriptions</h1>
          <p>Manage your recurring product orders</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Subscriptions</div>
            </div>
            <div className="stat-icon">📦</div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-icon status-active">✅</div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.paused}</div>
              <div className="stat-label">Paused</div>
            </div>
            <div className="stat-icon status-paused">⏸️</div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{stats.cancelled}</div>
              <div className="stat-label">Cancelled</div>
            </div>
            <div className="stat-icon status-cancelled">❌</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="filters-card" variant="outlined">
          <div className="filters-header">
            <h2>Filters</h2>
            <Button
              variant="ghost"
              size="small"
              onClick={() => setFilters({ status: '', page: 1, limit: 10 })}
            >
              Clear Filters
            </Button>
          </div>
          
          <div className="filters-content">
            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                {getStatusOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Subscriptions List */}
        {subscriptions.length === 0 ? (
          <EmptyState
            title="No Subscriptions Found"
            description="You don't have any subscriptions yet. Browse products and set up recurring deliveries."
            actionText="Browse Products"
            actionLink="/products"
          />
        ) : (
          <>
            <div className="subscriptions-list">
              {subscriptions.map(subscription => (
                <SubscriptionCard
                  key={subscription._id}
                  subscription={subscription}
                  onUpdate={handleSubscriptionUpdate}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="pagination-container">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={(page) => handleFilterChange('page', page)}
                  showFirstLast
                  showNextPrev
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default Subscriptions
