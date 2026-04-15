import React, { useState, useEffect } from 'react';
import ExpertNavbar from '../../components/ExpertNavbar';
import expertAPI from '../../services/expertAPI';
import './ExpertProfile.css';

const ExpertProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    qualification: '',
    bio: '',
    hourlyRate: '',
    languages: '',
    location: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getExpertProfile();
      if (response.data.success) {
        const profileData = response.data.data;
        setProfile(profileData);
        setFormData({
          name: profileData.users?.name || '',
          email: profileData.users?.email || '',
          phone: profileData.phone || '',
          specialization: profileData.specialization || '',
          experience: profileData.experience || '',
          qualification: profileData.qualification || '',
          bio: profileData.bio || '',
          hourlyRate: profileData.hourlyrate || '',
          languages: profileData.languages || '',
          location: profileData.location || ''
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setSuccessMessage('');
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.users?.name || '',
        email: profile.users?.email || '',
        phone: profile.phone || '',
        specialization: profile.specialization || '',
        experience: profile.experience || '',
        qualification: profile.qualification || '',
        bio: profile.bio || '',
        hourlyRate: profile.hourlyrate || '',
        languages: profile.languages || '',
        location: profile.location || ''
      });
    }
    setError(null);
    setSuccessMessage('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      
      const response = await expertAPI.updateExpertProfile(formData);
      
      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setEditing(false);
        fetchProfile();
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-profile">
          <div className="loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-profile">
          <div className="error">
            <p>Failed to load profile</p>
            <button onClick={fetchProfile}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-layout">
      <ExpertNavbar />
      <div className="expert-profile">
        <div className="profile-header">
          <h1>Expert Profile</h1>
          {!editing && (
            <button onClick={handleEdit} className="edit-button">
              Edit Profile
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-section">
            <h2>Personal Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Professional Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Specialization</label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g., Crop Diseases, Soil Management"
                  required
                />
              </div>

              <div className="form-group">
                <label>Experience (years)</label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  disabled={!editing}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Qualification</label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g., Ph.D. in Agriculture"
                  required
                />
              </div>

              <div className="form-group">
                <label>Hourly Rate (₹)</label>
                <input
                  type="number"
                  name="hourlyRate"
                  value={formData.hourlyRate}
                  onChange={handleChange}
                  disabled={!editing}
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Languages</label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g., English, Hindi, Telugu"
                />
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>About</h2>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!editing}
                rows="4"
                placeholder="Tell farmers about your expertise and experience..."
              />
            </div>
          </div>

          {editing && (
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
              <button type="submit" className="save-button" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>

        <div className="profile-stats">
          <h3>Profile Status</h3>
          <div className="status-info">
            <span className={`status-badge ${profile.users?.verified ? 'verified' : 'unverified'}`}>
              {profile.users?.verified ? '✓ Verified' : '⏳ Pending Verification'}
            </span>
            <span className={`status-badge ${profile.available ? 'available' : 'unavailable'}`}>
              {profile.available ? '🟢 Available' : '🔴 Unavailable'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertProfile;
