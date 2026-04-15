import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import dealerAPI from '../../services/dealerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await dealerAPI.getDealerProfile();
      if (response.data.success) {
        setProfile(response.data.data);
        setFormData(response.data.data);
      }
    } catch (err) {
      setError('Failed to load profile');
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setFormData(profile);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(profile);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await dealerAPI.updateDealerProfile(formData);
      if (response.data.success) {
        toast.success('Profile updated successfully');
        setProfile(response.data.data);
        setEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Profile Settings</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Profile Settings</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchProfile} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dealer-layout">
      <DealerNavbar />
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Profile Settings</h1>
          <p>Manage your dealer profile and business information</p>
        </div>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile?.users?.profileimageurl ? (
                <img src={profile.users.profileimageurl} alt="Profile" />
              ) : (
                <span className="avatar-placeholder">{profile?.users?.name?.charAt(0)}</span>
              )}
            </div>
            <div className="profile-info">
              <h2>{profile?.users?.name}</h2>
              <p>{profile?.users?.email}</p>
              <p>{profile?.users?.phone}</p>
            </div>
            {!editing && (
              <button onClick={handleEdit} className="edit-button">
                Edit Profile
              </button>
            )}
          </div>

          <form className="profile-form">
            <div className="form-section">
              <h3>Business Information</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Business Name</label>
                  <input
                    type="text"
                    name="businessname"
                    value={formData.businessname || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Business Type</label>
                  <select
                    name="businesstype"
                    value={formData.businesstype || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="wholesale">Wholesale</option>
                    <option value="retail">Retail</option>
                    <option value="distributor">Distributor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>License Number</label>
                  <input
                    type="text"
                    name="licensenumber"
                    value={formData.licensenumber || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Business Phone</label>
                  <input
                    type="tel"
                    name="businessphone"
                    value={formData.businessphone || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Business Email</label>
                  <input
                    type="email"
                    name="businessemail"
                    value={formData.businessemail || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Business Address</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Address</label>
                  <input
                    type="text"
                    name="businessaddress"
                    value={formData.businessaddress || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="businesscity"
                    value={formData.businesscity || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="businessstate"
                    value={formData.businessstate || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Postal Code</label>
                  <input
                    type="text"
                    name="businesspostalcode"
                    value={formData.businesspostalcode || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Business Preferences</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Minimum Order Quantity</label>
                  <input
                    type="number"
                    name="minimumorderquantity"
                    value={formData.minimumorderquantity || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Service Delivery Radius (km)</label>
                  <input
                    type="number"
                    name="servicedeliveryradius"
                    value={formData.servicedeliveryradius || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <select
                    name="paymentterms"
                    value={formData.paymentterms || ''}
                    onChange={handleChange}
                    disabled={!editing}
                  >
                    <option value="COD">Cash on Delivery</option>
                    <option value="NET30">Net 30 Days</option>
                    <option value="NET15">Net 15 Days</option>
                    <option value="NET7">Net 7 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Description</h3>
              <div className="form-group full-width">
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  rows="4"
                  placeholder="Describe your business..."
                />
              </div>
            </div>

            {editing && (
              <div className="form-actions">
                <button type="button" onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} className="save-button">
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Profile;
