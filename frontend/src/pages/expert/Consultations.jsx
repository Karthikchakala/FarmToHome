import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ExpertNavbar from '../../components/ExpertNavbar';
import expertAPI from '../../services/expertAPI';
import './ExpertConsultations.css';

const ExpertConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchConsultations();
  }, [filter]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getExpertConsultations();
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

  const handleUpdateStatus = async (consultationId, status) => {
    try {
      await expertAPI.updateConsultationStatus(consultationId, { status });
      fetchConsultations();
    } catch (err) {
      console.error('Failed to update status:', err);
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

  if (loading) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-consultations">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-layout">
      <ExpertNavbar />
      <div className="expert-consultations">
        <div className="consultations-header">
          <h1>Consultations</h1>
          <p>Manage your consultation requests and appointments</p>
        </div>

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
            <p>Consultation requests will appear here once farmers start booking sessions with you.</p>
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
                    <strong>Farmer:</strong>
                    <span>{consultation.farmers?.users?.name || 'Unknown'}</span>
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
                  <Link 
                    to={`/expert/chat/${consultation._id}`} 
                    className="chat-button"
                  >
                    Open Chat
                  </Link>
                  
                  {consultation.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(consultation._id, 'confirmed')}
                        className="accept-button"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(consultation._id, 'cancelled')}
                        className="reject-button"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {consultation.status === 'confirmed' && (
                    <button 
                      onClick={() => handleUpdateStatus(consultation._id, 'in_progress')}
                      className="start-button"
                    >
                      Start Session
                    </button>
                  )}
                  
                  {consultation.status === 'in_progress' && (
                    <button 
                      onClick={() => handleUpdateStatus(consultation._id, 'completed')}
                      className="complete-button"
                    >
                      Complete Session
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertConsultations;
