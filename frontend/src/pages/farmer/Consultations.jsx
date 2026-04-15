import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import expertAPI from '../../services/expertAPI';
import './FarmerConsultations.css';

const FarmerConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [experts, setExperts] = useState([]);
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    selectedExpertId: '',
    consultationType: 'chat',
    topic: '',
    message: '',
    durationMinutes: '30'
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchConsultations();
    fetchExperts();
  }, [filter]);

  const fetchExperts = async () => {
    try {
      const response = await expertAPI.getAvailableExperts();
      if (response.data.success) {
        setExperts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching experts:', err);
    }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getFarmerConsultations();
      if (response.data.success) {
        let filteredData = response.data.data || [];
        
        if (filter !== 'all') {
          filteredData = filteredData.filter(c => c.status === filter);
        }
        
        setConsultations(filteredData);
      }
    } catch (err) {
      setError('Failed to load consultations');
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'scheduled': return '#3b82f6';
      case 'confirmed': return '#3b82f6';
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'chat': return '💬';
      case 'video_call': return '📹';
      case 'voice_call': return '📞';
      default: return '📝';
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedExpertId) {
      alert('Please select an expert');
      return;
    }

    try {
      setBookingLoading(true);
      
      const consultationData = {
        expertid: selectedExpertId,
        consultationtype: bookingData.consultationType,
        title: bookingData.topic,
        description: bookingData.message,
        status: 'pending',
        durationminutes: bookingData.durationMinutes
      };

      const response = await expertAPI.createConsultation(consultationData);
      
      if (response.data.success) {
        alert('Consultation booked successfully!');
        setShowBookingForm(false);
        setBookingData({
          selectedExpertId: '',
          consultationType: 'chat',
          topic: '',
          message: '',
          durationMinutes: '30'
        });
        fetchConsultations();
      } else {
        alert('Failed to book consultation: ' + (response.data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error booking consultation:', err);
      alert('Failed to book consultation');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteAppointment = async (consultationId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await expertAPI.updateConsultationStatus(consultationId, { status: 'cancelled' });
        fetchConsultations();
      } catch (err) {
        console.error('Failed to delete appointment:', err);
      }
    }
  };

  const handleUpdateStatus = async (consultationId, status) => {
    try {
      await expertAPI.updateConsultationStatus(consultationId, { status });
      fetchConsultations();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (loading) {
    return (
      <Layout showSidebar>
        <div className="farmer-consultations">
          <div className="loading">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar>
      <div className="farmer-consultations">
        <div className="consultations-header">
          <h1>My Consultations</h1>
          <p>View and manage your consultation appointments</p>
          <button 
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="new-consultation-button"
          >
            {showBookingForm ? 'View Appointments' : '+ Book New Appointment'}
          </button>
        </div>

        {/* Expert Listing Section */}
        {!showBookingForm && (
          <div className="experts-section">
            <h2>Available Experts</h2>
            {experts.length === 0 ? (
              <p>No experts available right now.</p>
            ) : (
              <div className="experts-grid">
                {experts.map((expert) => (
                  <div key={expert._id} className="expert-card">
                    <div className="expert-header">
                      <h3>{expert.users?.name || expert.users?.email}</h3>
                      <div className="expert-status">
                        <span className={`status ${expert.online ? 'online' : 'offline'}`}>
                          {expert.online ? 'Online' : 'Offline'}
                        </span>
                        <span className="availability">{expert.availabilitystatus}</span>
                      </div>
                    </div>
                    <p className="expert-specialization">{expert.specialization}</p>
                    <p className="expert-description">{expert.description}</p>
                    <div className="expert-meta">
                      <span>{expert.expertiselevel}</span>
                      <span>{expert.experienceyears} yrs exp</span>
                      <span>Rs.{expert.consultationfee}/session</span>
                      {expert.ratingaverage && <span>Rating: {expert.ratingaverage}</span>}
                    </div>
                    <div className="expert-languages">
                      {(expert.languages || []).map((language) => (
                        <span key={language}>{language}</span>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedExpertId(expert._id);
                        setShowBookingForm(true);
                      }}
                      className="book-expert-btn"
                    >
                      Book Appointment
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        {showBookingForm && (
          <div className="booking-form-section">
            <div className="booking-header">
              <h2>Book New Appointment</h2>
              <button 
                onClick={() => {
                  setShowBookingForm(false);
                  setSelectedExpertId('');
                }}
                className="back-to-experts-btn"
              >
                Back to Experts
              </button>
            </div>
            
            {selectedExpertId && (
              <div className="selected-expert-info">
                <strong>Selected Expert:</strong> {experts.find(e => e._id === selectedExpertId)?.users?.name}
              </div>
            )}
            
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-row">
                <label>
                  Select Expert
                  <select
                    value={selectedExpertId}
                    onChange={(e) => setSelectedExpertId(e.target.value)}
                    required
                    className="expert-select"
                  >
                    <option value="">Choose an expert...</option>
                    {experts.map((expert) => (
                      <option key={expert._id} value={expert._id}>
                        {expert.users?.name} - {expert.specialization} - Rs.{expert.consultationfee}/session
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  Communication Type
                  <select
                    name="consultationType"
                    value={bookingData.consultationType}
                    onChange={handleBookingChange}
                    required
                  >
                    <option value="chat">Chat (Instant Messaging)</option>
                    <option value="video_call">Video Call (Face-to-Face)</option>
                    <option value="voice_call">Voice Call (Phone)</option>
                  </select>
                </label>
              </div>

              {bookingData.consultationType && (
                <div className="communication-info">
                  <div className="info-badge">
                    {bookingData.consultationType === 'chat' && 'Chat: Instant text messaging with expert'}
                    {bookingData.consultationType === 'video_call' && 'Video Call: Face-to-face video consultation'}
                    {bookingData.consultationType === 'voice_call' && 'Voice Call: Phone consultation with expert'}
                  </div>
                </div>
              )}

              <div className="form-row">
                <label>
                  Topic
                  <input
                    type="text"
                    name="topic"
                    value={bookingData.topic}
                    onChange={handleBookingChange}
                    placeholder="e.g. tomato leaf spots, soil health"
                    required
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Message
                  <textarea
                    name="message"
                    value={bookingData.message}
                    onChange={handleBookingChange}
                    rows="3"
                    placeholder="Describe your issue in detail..."
                    required
                  />
                </label>
              </div>

              {bookingData.consultationType === 'video_call' && (
                <div className="call-scheduling">
                  <h3>Video Call</h3>
                  <div className="form-row">
                    <label>
                      Call Duration
                      <select
                        name="durationMinutes"
                        value={bookingData.durationMinutes}
                        onChange={handleBookingChange}
                        required
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              {bookingData.consultationType === 'voice_call' && (
                <div className="call-scheduling">
                  <h3>Voice Call</h3>
                  <div className="form-row">
                    <label>
                      Call Duration
                      <select
                        name="durationMinutes"
                        value={bookingData.durationMinutes}
                        onChange={handleBookingChange}
                        required
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                      </select>
                    </label>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowBookingForm(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={bookingLoading} className="submit-btn">
                  {bookingLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''} 
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={filter === 'confirmed' ? 'active' : ''} 
            onClick={() => setFilter('confirmed')}
          >
            Confirmed
          </button>
          <button 
            className={filter === 'in_progress' ? 'active' : ''} 
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''} 
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button 
            className={filter === 'cancelled' ? 'active' : ''} 
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchConsultations} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {consultations.length === 0 ? (
          <div className="empty-state">
            <p>No consultations found</p>
            <p>Book your first consultation with an expert to get started.</p>
            <Link to="/farmer/consultations" className="new-consultation-button">
              Book Now
            </Link>
          </div>
        ) : (
          <div className="consultations-list">
            {consultations.map((consultation) => (
              <div key={consultation._id} className="consultation-card">
                <div className="consultation-header">
                  <div className="consultation-title-row">
                    <span className="consultation-icon">
                      {getConsultationTypeIcon(consultation.consultationtype)}
                    </span>
                    <h3>{consultation.title}</h3>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(consultation.status) }}
                    >
                      {consultation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="consultation-details">
                  <div className="detail-row">
                    <strong>Expert:</strong>
                    <span>{consultation.experts?.users?.name || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Specialization:</strong>
                    <span>{consultation.experts?.specialization || 'General'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Type:</strong>
                    <span>{consultation.consultationtype?.replace('_', ' ') || 'General'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Date:</strong>
                    <span>{consultation.scheduleddate ? formatDate(consultation.scheduleddate) : 'Not scheduled'}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Duration:</strong>
                    <span>{consultation.durationminutes || 30} minutes</span>
                  </div>
                  <div className="detail-row">
                    <strong>Fee:</strong>
                    <span>{formatPrice(consultation.fee)}</span>
                  </div>
                </div>

                <div className="consultation-description">
                  <p>{consultation.description}</p>
                </div>

                <div className="consultation-actions">
                  {consultation.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleDeleteAppointment(consultation._id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </>
                  )}
                  
                  {consultation.status === 'confirmed' && (
                    <>
                      <Link 
                        to={`/farmer/chat/${consultation._id}`} 
                        className="start-chat-button"
                      >
                        Start Chat
                      </Link>
                      <button 
                        onClick={() => handleDeleteAppointment(consultation._id)}
                        className="delete-button"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {consultation.status === 'in_progress' && (
                    <>
                      <Link 
                        to={`/farmer/chat/${consultation._id}`} 
                        className="continue-chat-button"
                      >
                        Continue Chat
                      </Link>
                      <button 
                        onClick={() => handleUpdateStatus(consultation._id, 'completed')}
                        className="complete-button"
                      >
                        Mark Complete
                      </button>
                    </>
                  )}

                  {consultation.status === 'completed' && (
                    <>
                      <button className="view-summary-button" disabled>
                        View Summary
                      </button>
                      <button 
                        onClick={() => handleDeleteAppointment(consultation._id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </>
                  )}

                  {consultation.status === 'cancelled' && (
                    <button 
                      onClick={() => handleDeleteAppointment(consultation._id)}
                      className="delete-button"
                    >
                      Delete Permanently
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FarmerConsultations;
