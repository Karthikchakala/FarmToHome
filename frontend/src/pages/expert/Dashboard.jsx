import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import expertAPI from '../../services/expertAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import ExpertNavbar from '../../components/ExpertNavbar';
import './ExpertDashboard.css';

const ExpertDashboard = () => {
  const [stats, setStats] = useState({
    totalConsultations: 0,
    pendingConsultations: 0,
    completedConsultations: 0,
    averageRating: 0,
    totalEarnings: 0,
    activeChats: 0,
    incomingCalls: 0
  });
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch recent consultations
      const consultationsResponse = await expertAPI.getExpertConsultations({ limit: 5 });
      if (consultationsResponse.data.success) {
        const consultations = consultationsResponse.data.data;
        setRecentConsultations(consultations);

        // Calculate stats
        const stats = consultations.reduce((acc, consultation) => {
          acc.totalConsultations++;
          if (consultation.status === 'pending') acc.pendingConsultations++;
          if (consultation.status === 'completed') {
            acc.completedConsultations++;
            acc.totalEarnings += consultation.fee || 0;
          }
          if (consultation.status === 'in_progress') acc.activeChats++;
          return acc;
        }, { totalConsultations: 0, pendingConsultations: 0, completedConsultations: 0, averageRating: 0, totalEarnings: 0, activeChats: 0, incomingCalls: 0 });

        setStats(stats);
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
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
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'crop_issue': return '\ud83c\udf31';
      case 'general_advice': return '\ud83d\udca1';
      case 'soil_analysis': return '\ud83e\udeb4';
      case 'pest_management': return '\ud83d\udc1b';
      case 'fertilizer_recommendation': return '\ud83e\uddea';
      default: return '\ud83d\udcda';
    }
  };

  if (loading) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-dashboard">
          <div className="dashboard-header">
            <h1>Expert Dashboard</h1>
          </div>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-dashboard">
          <div className="dashboard-header">
            <h1>Expert Dashboard</h1>
          </div>
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="retry-button">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expert-layout">
      <ExpertNavbar />
      <div className="expert-dashboard">
        <div className="dashboard-header">
          <h1>Expert Dashboard</h1>
          <p>Manage your consultations and help farmers succeed</p>
        </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.totalConsultations}</h3>
            <p>Total Appointments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingConsultations}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{stats.activeChats}</h3>
            <p>Active Chats</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📞</div>
          <div className="stat-content">
            <h3>{stats.incomingCalls}</h3>
            <p>Incoming Calls</p>
          </div>
        </div>
      </div>

      {/* Active Chats Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>💬 Active Chats</h2>
          <Link to="/expert/chat" className="view-all-link">
            View All
          </Link>
        </div>
        <div className="chats-list">
          {recentConsultations.filter(c => c.status === 'in_progress').length === 0 ? (
            <div className="empty-state">
              <p>No active chats</p>
            </div>
          ) : (
            recentConsultations.filter(c => c.status === 'in_progress').map((consultation) => (
              <div key={consultation._id} className="chat-card">
                <div className="chat-info">
                  <h3>{consultation.farmers?.users?.name}</h3>
                  <p>{consultation.title}</p>
                </div>
                <Link to={`/expert/chat/${consultation._id}`} className="chat-button">
                  Open Chat
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Incoming Calls Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📞 Incoming Calls</h2>
        </div>
        <div className="calls-list">
          <div className="empty-state">
            <p>No incoming calls</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/expert/consultations" className="action-button">
            <span className="action-icon">📅</span>
            <span>View Appointments</span>
          </Link>
          <Link to="/expert/chat" className="action-button">
            <span className="action-icon">💬</span>
            <span>Open Chat</span>
          </Link>
          <Link to="/expert/profile" className="action-button">
            <span className="action-icon">⚙️</span>
            <span>Profile Settings</span>
          </Link>
        </div>
      </div>

      {/* Recent Consultations */}
      <div className="recent-consultations">
        <div className="section-header">
          <h2>Recent Consultations</h2>
          <Link to="/expert/consultations" className="view-all-link">
            View All
          </Link>
        </div>
        <div className="consultations-list">
          {recentConsultations.length === 0 ? (
            <div className="empty-state">
              <p>No recent consultations found</p>
              <p>Consultation requests will appear here once farmers start booking sessions with you.</p>
            </div>
          ) : (
            recentConsultations.map((consultation) => (
              <div key={consultation._id} className="consultation-card">
                <div className="consultation-header">
                  <div className="consultation-info">
                    <div className="consultation-title">
                      <span className="consultation-icon">
                        {getConsultationTypeIcon(consultation.consultationtype)}
                      </span>
                      <h3>{consultation.title}</h3>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(consultation.status) }}
                    >
                      {consultation.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="consultation-meta">
                    <p><strong>Farmer:</strong> {consultation.farmers?.users?.name}</p>
                    <p><strong>Date:</strong> {consultation.scheduleddate ? formatDate(consultation.scheduleddate) : 'Not scheduled'}</p>
                    <p><strong>Fee:</strong> {formatPrice(consultation.fee)}</p>
                  </div>
                </div>
                <div className="consultation-description">
                  <p>{consultation.description.substring(0, 150)}{consultation.description.length > 150 ? '...' : ''}</p>
                </div>
                <div className="consultation-actions">
                  <Link 
                    to={`/expert/consultations/${consultation._id}`} 
                    className="view-button"
                  >
                    View Details
                  </Link>
                  {consultation.status === 'pending' && (
                    <button className="accept-button">
                      Accept
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Expert Tips */}
      <div className="expert-tips">
        <h2>Expert Tips</h2>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">{"\ud83d\udca1"}</div>
            <h3>Be Responsive</h3>
            <p>Respond to consultation requests quickly to build trust with farmers.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">{"\ud83d\udcdd"}</div>
            <h3>Detailed Analysis</h3>
            <p>Provide thorough and actionable advice to help farmers solve their problems.</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">{"\u2b50"}</div>
            <h3>Build Reputation</h3>
            <p>High-quality consultations lead to better ratings and more clients.</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ExpertDashboard;
