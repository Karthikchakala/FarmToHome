import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/adminAPI'
import LoadingSpinner from '../../components/LoadingSpinner'
import './UserManagement.css'

const UserManagement = () => {
  const { user, isAuthenticated } = useAuth()
  const [users, setUsers] = useState([])
  const [farmers, setFarmers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedFarmerProducts, setSelectedFarmerProducts] = useState([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch both users and farmers
        const [usersResponse, farmersResponse] = await Promise.all([
          adminAPI.getUsers(),
          adminAPI.getFarmers()
        ])
        
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data || [])
        } else {
          console.error('Failed to fetch users:', usersResponse.data.message)
          setUsers([])
        }
        
        if (farmersResponse.data.success) {
          setFarmers(farmersResponse.data.data || [])
        } else {
          console.error('Failed to fetch farmers:', farmersResponse.data.message)
          setFarmers([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setUsers([])
        setFarmers([])
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const handleApproveFarmer = async (farmerId) => {
    try {
      const response = await adminAPI.approveFarmer(farmerId)
      if (response.data.success) {
        // Refresh farmers list
        const farmersResponse = await adminAPI.getFarmers()
        if (farmersResponse.data.success) {
          setFarmers(farmersResponse.data.data || [])
        }
        alert('Farmer approved successfully!')
      } else {
        alert('Failed to approve farmer: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error approving farmer:', error)
      alert('Error approving farmer. Please try again.')
    }
  }

  const handleRejectFarmer = async (farmerId) => {
    const reason = prompt('Please enter reason for rejection:')
    if (!reason) return

    try {
      const response = await adminAPI.rejectFarmer(farmerId, { reason })
      if (response.data.success) {
        // Refresh farmers list
        const farmersResponse = await adminAPI.getFarmers()
        if (farmersResponse.data.success) {
          setFarmers(farmersResponse.data.data || [])
        }
        alert('Farmer rejected successfully!')
      } else {
        alert('Failed to reject farmer: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error rejecting farmer:', error)
      alert('Error rejecting farmer. Please try again.')
    }
  }

  const handleViewUserDetails = async (user) => {
    try {
      setSelectedUser(user)
      
      // If user is a farmer, fetch their products
      if (user.role === 'farmer') {
        setModalLoading(true)
        try {
          // Get farmer's products - you'll need to add this API endpoint
          const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/farmers/${user._id}/products`)
          const data = await response.json()
          
          if (data.success) {
            setSelectedFarmerProducts(data.data || [])
          } else {
            setSelectedFarmerProducts([])
          }
        } catch (error) {
          console.error('Error fetching farmer products:', error)
          setSelectedFarmerProducts([])
        } finally {
          setModalLoading(false)
        }
      } else {
        setSelectedFarmerProducts([])
      }
      
      setShowUserModal(true)
    } catch (error) {
      console.error('Error viewing user details:', error)
      alert('Error loading user details')
    }
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    try {
      const response = await adminAPI.updateUser(selectedUser._id, {
        name: selectedUser.name,
        email: selectedUser.email,
        phone: selectedUser.phone,
        isVerified: selectedUser.isVerified,
        isBanned: selectedUser.isBanned
      })
      
      if (response.data.success) {
        // Refresh users list
        const usersResponse = await adminAPI.getUsers()
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data || [])
        }
        
        setShowEditModal(false)
        setSelectedUser(null)
        alert('User updated successfully!')
      } else {
        alert('Failed to update user: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user. Please try again.')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await adminAPI.deleteUser(userId)
      if (response.data.success) {
        // Refresh users list
        const usersResponse = await adminAPI.getUsers()
        if (usersResponse.data.success) {
          setUsers(usersResponse.data.data || [])
        }
        
        setShowEditModal(false)
        setSelectedUser(null)
        alert('User deleted successfully!')
      } else {
        alert('Failed to delete user: ' + response.data.message)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user. Please try again.')
    }
  }

  const closeModal = () => {
    setShowUserModal(false)
    setShowEditModal(false)
    setSelectedUser(null)
    setSelectedFarmerProducts([])
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesFilter
  })

  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = farmer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         farmer.farmname?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || farmer.verificationstatus === filterStatus
    return matchesSearch && matchesFilter
  })

  if (!isAuthenticated) {
    return (
      <div className="user-management">
        <div className="auth-message">
          <h2>Please login to access admin panel</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="user-management">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>👥 User & Farmer Management</h1>
        <p>Manage all users and approve farmer registrations</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👤 All Users ({users.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'farmers' ? 'active' : ''}`}
          onClick={() => setActiveTab('farmers')}
        >
          🌾 Farmers ({farmers.filter(f => f.verificationstatus === 'pending').length} pending)
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder={activeTab === 'users' ? "Search by name or email..." : "Search by name, email, or farm..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        {activeTab === 'users' ? (
          <div className="filter-group">
            <label>Filter by Role:</label>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              <option value="farmer">Farmers</option>
              <option value="consumer">Consumers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        ) : (
          <div className="filter-group">
            <label>Filter by Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Content based on active tab */}
      <div className="users-container">
        {activeTab === 'users' ? (
          // Users Tab
          filteredUsers.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">👥</div>
              <h3>No Users Found</h3>
              <p>There are no users to display. Users will appear here once they register on the platform.</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map(user => (
                <div key={user._id} className="user-card">
                  <div className="user-header">
                    <h3>{user.name || 'Unknown User'}</h3>
                    <span className={`role-badge ${user.role}`}>
                      {user.role || 'Unknown'}
                    </span>
                  </div>
                  <div className="user-info">
                    <p><strong>Email:</strong> {user.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {user.phone || 'N/A'}</p>
                    <p><strong>Joined:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Status:</strong> <span className={`status ${user.isVerified ? 'verified' : 'pending'}`}>
                      {user.isVerified ? 'Verified' : 'Pending'}
                    </span></p>
                  </div>
                  <div className="user-actions">
                    <button className="btn btn-outline" onClick={() => handleViewUserDetails(user)}>
                      View Details
                    </button>
                    {user.role !== 'admin' && (
                      <button className="btn btn-secondary" onClick={() => handleEditUser(user)}>
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Farmers Tab
          filteredFarmers.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">🌾</div>
              <h3>No Farmers Found</h3>
              <p>There are no farmers to display. Farmers will appear here once they register on the platform.</p>
            </div>
          ) : (
            <div className="farmers-grid">
              {filteredFarmers.map(farmer => (
                <div key={farmer._id} className="farmer-card">
                  <div className="farmer-header">
                    <div className="farmer-info">
                      <h3>{farmer.name || 'Unknown User'}</h3>
                      <p className="farm-name">🌾 {farmer.farmname || 'Unnamed Farm'}</p>
                    </div>
                    <span className={`status-badge ${farmer.verificationstatus}`}>
                      {farmer.verificationstatus === 'pending' && '⏳ Pending'}
                      {farmer.verificationstatus === 'approved' && '✅ Approved'}
                      {farmer.verificationstatus === 'rejected' && '❌ Rejected'}
                    </span>
                  </div>
                  <div className="farmer-details">
                    <p><strong>Email:</strong> {farmer.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {farmer.phone || 'N/A'}</p>
                    <p><strong>Farming Type:</strong> {farmer.farmingtype || 'N/A'}</p>
                    <p><strong>Joined:</strong> {farmer.createdAt ? new Date(farmer.createdAt).toLocaleDateString() : 'N/A'}</p>
                    {farmer.description && (
                      <p><strong>Description:</strong> {farmer.description}</p>
                    )}
                  </div>
                  {farmer.verificationstatus === 'pending' && (
                    <div className="farmer-actions">
                      <button 
                        className="btn btn-success"
                        onClick={() => handleApproveFarmer(farmer._id)}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleRejectFarmer(farmer._id)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}
                  {farmer.verificationstatus === 'approved' && (
                    <div className="farmer-actions">
                      <span className="approved-message">✅ Farmer is approved and can add products</span>
                    </div>
                  )}
                  {farmer.verificationstatus === 'rejected' && (
                    <div className="farmer-actions">
                      <span className="rejected-message">❌ Farmer registration was rejected</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="user-detail-section">
                <h3>👤 Personal Information</h3>
                <p><strong>Name:</strong> {selectedUser.name || 'N/A'}</p>
                <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
                <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                <p><strong>Role:</strong> <span className={`role-badge ${selectedUser.role}`}>{selectedUser.role}</span></p>
                <p><strong>Verified:</strong> {selectedUser.isVerified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Banned:</strong> {selectedUser.isBanned ? '❌ Yes' : '✅ No'}</p>
                <p><strong>Joined:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>

              {selectedUser.role === 'farmer' && (
                <div className="farmer-detail-section">
                  <h3>🌾 Farmer Information</h3>
                  {modalLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <div className="farmer-products">
                        <h4>📦 Products ({selectedFarmerProducts.length})</h4>
                        {selectedFarmerProducts.length === 0 ? (
                          <p>No products found</p>
                        ) : (
                          <div className="products-list">
                            {selectedFarmerProducts.map(product => (
                              <div key={product._id} className="product-item">
                                <div className="product-info">
                                  <h5>{product.name}</h5>
                                  <p>{product.description}</p>
                                  <p><strong>Category:</strong> {product.category}</p>
                                  <p><strong>Price:</strong> ₹{product.priceperunit}/{product.unit}</p>
                                  <p><strong>Stock:</strong> {product.stockquantity} {product.unit}</p>
                                  <p><strong>Status:</strong> <span className={`status ${product.isavailable ? 'available' : 'unavailable'}`}>
                                    {product.isavailable ? 'Available' : 'Unavailable'}
                                  </span></p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedUser.role === 'consumer' && (
                <div className="consumer-detail-section">
                  <h3>🛒 Consumer Information</h3>
                  <p>This is a consumer account with standard shopping privileges.</p>
                  <p>Order history and preferences can be viewed in the Orders section.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={selectedUser.name || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Phone:</label>
                <input
                  type="tel"
                  value={selectedUser.phone || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                  className="form-input"
                />
              </div>
              
              {selectedUser.role === 'farmer' && (
                <>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedUser.isVerified || false}
                        onChange={(e) => setSelectedUser({...selectedUser, isVerified: e.target.checked})}
                      />
                      {' '}Verified
                    </label>
                  </div>
                  <div className="approval-actions">
                    <button 
                      className="btn btn-success" 
                      onClick={() => handleApproveFarmer(selectedUser._id)}
                    >
                      ✅ Approve Farmer
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleRejectFarmer(selectedUser._id)}
                    >
                      ❌ Reject Farmer
                    </button>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={selectedUser.isBanned || false}
                    onChange={(e) => setSelectedUser({...selectedUser, isBanned: e.target.checked})}
                  />
                  {' '}Banned
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateUser}>Save Changes</button>
              {selectedUser.role !== 'admin' && (
                <button className="btn btn-danger" onClick={() => handleDeleteUser(selectedUser._id)}>
                  🗑️ Delete User
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
