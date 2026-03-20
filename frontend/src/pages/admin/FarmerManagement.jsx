import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/adminAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './FarmerManagement.css'

const FarmerManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        setLoading(true)
        const response = await adminAPI.getFarmers()
        if (response.data.success) {
          setFarmers(response.data.data || [])
        } else {
          console.error('Failed to fetch farmers:', response.data.message)
          setFarmers([])
        }
      } catch (error) {
        console.error('Error fetching farmers:', error)
        setFarmers([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchFarmers()
    }
  }, [isAuthenticated])

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.farmname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || farmer.verificationstatus === filterStatus
    return matchesSearch && matchesFilter
  })

  const handleApproval = async (farmerId, status) => {
    try {
      let response
      if (status === 'approved') {
        response = await adminAPI.approveFarmer(farmerId)
      } else {
        response = await adminAPI.rejectFarmer(farmerId, 'Rejected by admin')
      }
      
      if (response.data.success) {
        // Refresh the farmers list
        const fetchFarmers = async () => {
          try {
            const response = await adminAPI.getFarmers()
            if (response.data.success) {
              setFarmers(response.data.data || [])
            }
          } catch (error) {
            console.error('Error refreshing farmers:', error)
          }
        }
        fetchFarmers()
      } else {
        console.error('Failed to update farmer status:', response.data.message)
      }
    } catch (error) {
      console.error('Error updating farmer status:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="farmer-management">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="farmer-management">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="farmer-management">
      <div className="page-header">
        <h1>👨‍🌾 Farmer Management</h1>
        <p>Approve farmers and manage their profiles</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Search Farmers:</label>
          <input
            type="text"
            placeholder="Search by name, farm, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Farmers</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="farmers-container">
        {filteredFarmers.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">👨‍🌾</div>
            <h3>No Farmers Found</h3>
            <p>There are no farmers to display. Farmers will appear here once they register on the platform.</p>
          </div>
        ) : (
          <div className="farmers-grid">
            {filteredFarmers.map(farmer => (
              <div key={farmer._id} className="farmer-card">
                <div className="farmer-header">
                  <h3>{farmer.name || 'Unknown Farmer'}</h3>
                  <span className={`status ${farmer.verificationstatus}`}>
                    {farmer.verificationstatus || 'Unknown'}
                  </span>
                </div>
                <div className="farmer-info">
                  <p><strong>Farm Name:</strong> {farmer.farmname || 'Not provided'}</p>
                  <p><strong>Email:</strong> {farmer.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {farmer.phone || 'N/A'}</p>
                  <p><strong>Location:</strong> {farmer.location || 'Not provided'}</p>
                  <p><strong>Farming Type:</strong> {farmer.farmingtype || 'Not specified'}</p>
                  <p><strong>Joined:</strong> {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Rating:</strong> ⭐ {farmer.ratingaverage?.toFixed(1) || '0.0'} ({farmer.totalreviews || 0} reviews)</p>
                </div>
                <div className="farmer-actions">
                  <button className="btn btn-outline">View Profile</button>
                  {farmer.verificationstatus === 'pending' && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleApproval(farmer._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleApproval(farmer._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FarmerManagement
