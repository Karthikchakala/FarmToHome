import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expertAPI from '../../services/expertAPI';
import ExpertNavbar from '../../components/ExpertNavbar';
import './ExpertChat.css';

const ExpertChat = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveConsultations();
  }, []);

  const fetchActiveConsultations = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getExpertConsultations();
      if (response.data.success) {
        // Filter to show only active consultations (confirmed, in_progress)
        // Exclude completed and cancelled appointments
        const activeConsultations = response.data.data.filter(
          c => c.status === 'confirmed' || c.status === 'in_progress'
        );
        setConsultations(activeConsultations);
      }
    } catch (err) {
      setError('Failed to load consultations');
      console.error('Error fetching consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-chat">
          <div className="loading">Loading active consultations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-chat">
          <div className="error">
            <p>{error}</p>
            <button onClick={fetchActiveConsultations}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-layout">
      <ExpertNavbar />
      <div className="expert-chat">
        <div className="chat-header">
          <Link to="/expert/dashboard" className="back-button">← Back to Dashboard</Link>
          <h2>Active Consultations</h2>
          <p>Select a consultation to start chatting</p>
        </div>

        {consultations.length === 0 ? (
          <div className="no-consultations">
            <p>No active consultations found</p>
            <Link to="/expert/consultations">View All Consultations</Link>
          </div>
        ) : (
          <div className="consultations-list">
            {consultations.map((consultation) => (
              <div key={consultation._id} className="consultation-card">
                <div className="consultation-card-header">
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
                </div>

                <div className="consultation-actions">
                  <Link 
                    to={`/expert/chat/${consultation._id}`} 
                    className="chat-button"
                  >
                    Open Chat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertChat;
