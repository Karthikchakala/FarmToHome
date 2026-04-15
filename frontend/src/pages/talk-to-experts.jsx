import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import expertAPI from '../services/expertAPI';
import ExpertChat from '../components/ExpertChat';
import './talk-to-experts.css';

const TalkToExperts = () => {
  const [experts, setExperts] = useState([]);
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    message: '',
    preferredContact: 'platform',
    consultationType: 'chat',
    scheduledDate: '',
    scheduledTime: '',
    durationMinutes: 30
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showAppointments, setShowAppointments] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(false);

  useEffect(() => {
    const loadExperts = async () => {
      setLoading(true);
      try {
        // Get user role from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        setUserRole(user?.role);

        const response = await expertAPI.getAvailableExperts();
        if (response.data.success) {
          const expertList = response.data.data || [];
          setExperts(expertList);
          if (expertList[0]) setSelectedExpertId(expertList[0]._id);
        }
      } catch (error) {
        toast.error('Failed to load experts');
      } finally {
        setLoading(false);
      }
    };

    loadExperts();
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    // Get user and token from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    console.log('User:', user);
    console.log('Token exists:', !!token);
    
    if (!user || !token) {
      console.log('No user or token found');
      return;
    }
    
    if (user?.role !== 'farmer') {
      console.log('User is not a farmer:', user?.role);
      return;
    }
    
    setConsultationsLoading(true);
    try {
      console.log('Loading consultations...');
      const response = await expertAPI.getFarmerConsultations();
      console.log('Consultations response:', response.data);
      if (response.data.success) {
        const consultations = response.data.data || [];
        console.log('Setting consultations:', consultations);
        setConsultations(consultations);
      } else {
        console.log('API returned error:', response.data.error);
      }
    } catch (error) {
      console.error('Failed to load consultations:', error);
      if (error.response?.status === 401) {
        console.log('Authentication error - user may need to log in again');
      }
    } finally {
      setConsultationsLoading(false);
    }
  };

  const selectedExpert = useMemo(
    () => experts.find((expert) => expert._id === selectedExpertId),
    [experts, selectedExpertId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpertId) {
      toast.error('Select an expert first');
      return;
    }

    setSending(true);
    try {
      const consultationData = {
        expertId: selectedExpertId,
        consultationType: formData.consultationType,
        title: formData.topic,
        description: formData.message,
        consultationMode: formData.consultationType === 'chat' ? 'chat' : 'video',
        durationMinutes: formData.durationMinutes
      };

      // Add scheduled date/time for calls
      if (formData.consultationType !== 'chat' && formData.scheduledDate && formData.scheduledTime) {
        consultationData.scheduledDate = `${formData.scheduledDate}T${formData.scheduledTime}:00`;
      }

      const response = await expertAPI.createConsultation(consultationData);

      if (response.data.success) {
        const consultation = response.data.data;
        setActiveConsultation(consultation);
        if (formData.consultationType === 'chat') {
          setShowChat(true);
        }
        toast.success(formData.consultationType === 'chat' ? 'Chat started successfully' : 'Appointment booked successfully');
        setFormData({
          topic: '',
          message: '',
          preferredContact: 'platform',
          consultationType: 'chat',
          scheduledDate: '',
          scheduledTime: '',
          durationMinutes: 30
        });
      } else {
        toast.error(response.data.message || 'Failed to create consultation');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create consultation');
    } finally {
      setSending(false);
    }
  };

  const handleChatClose = () => {
    setShowChat(false);
    setActiveConsultation(null);
  };

  const getConsultationTypeIcon = (type) => {
    switch (type) {
      case 'chat': return '💬';
      case 'video_call': return '📹';
      case 'voice_call': return '📞';
      default: return '📝';
    }
  };

  return (
    <Layout showSidebar>
      <div className="expert-content">
        <div className="expert-header">
          <h1>Talk to Experts</h1>
          <p>Reach agronomy, pest-management, and market specialists without interrupting existing marketplace flows.</p>
          <div className="expert-actions">
            <Link to="/farmer/consultations" className="book-manage-appointments-btn">
              &#x1F5D1; Book and Manage Appointments
            </Link>
          </div>
        </div>

        <>
          {showChat && activeConsultation && selectedExpert ? (
            <ExpertChat
              consultationId={activeConsultation._id}
              expert={selectedExpert}
              onClose={handleChatClose}
            />
          ) : (
            <div className="expert-grid">
              <section className="expert-panel">
                <h2>Available Experts</h2>
                {loading ? (
                  <p>Loading experts...</p>
                ) : experts.length === 0 ? (
                  <p>No experts available right now.</p>
                ) : (
                  <div className="expert-list">
                    {experts.map((expert) => (
                      <div
                        key={expert._id}
                        className={`expert-card ${selectedExpertId === expert._id ? 'selected' : ''}`}
                        onClick={() => setSelectedExpertId(expert._id)}
                        >
                          <div className="expert-card-head">
                            <h3>{expert.users?.name || expert.users?.email}</h3>
                            <div className="expert-status-indicators">
                              <span className={`expert-status ${expert.online ? 'online' : 'offline'}`}>
                                {expert.online ? 'Online' : 'Offline'}
                              </span>
                              <span className={`expert-availability ${expert.availabilitystatus}`}>
                                {expert.availabilitystatus}
                              </span>
                            </div>
                          </div>
                          <p className="expert-specialization">{expert.specialization}</p>
                          <p>{expert.description}</p>
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
                          <div className="expert-actions">
                            <Link to="/farmer/consultations" className="book-appointment-btn">
                              Book Appointment
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="expert-panel">
                  <h2>Book Appointment</h2>
                  {userRole !== 'farmer' && (
                    <p className="access-warning">Only farmers can initiate consultations with experts.</p>
                  )}
                  {selectedExpert && (
                    <div className="selected-expert-summary">
                      <strong>{selectedExpert.users?.name || selectedExpert.users?.email}</strong>
                      <span>{selectedExpert.specialization}</span>
                      <span>₹{selectedExpert.consultationfee}/session</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="expert-form" disabled={userRole !== 'farmer'}>
                    <label>
                      Consultation Type
                      <select
                        name="consultationType"
                        value={formData.consultationType}
                        onChange={handleChange}
                        disabled={userRole !== 'farmer'}
                      >
                        <option value="chat">💬 Chat</option>
                        <option value="video_call">📹 Video Call</option>
                        <option value="voice_call">📞 Voice Call</option>
                      </select>
                    </label>

                    <label>
                      Topic
                      <input
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        placeholder="e.g. tomato leaf spots, storage decisions, soil health"
                        required
                        disabled={userRole !== 'farmer'}
                      />
                    </label>

                    <label>
                      Message
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Describe the issue, crop stage, symptoms, field context, or market question."
                        required
                        disabled={userRole !== 'farmer'}
                      />
                    </label>

                    {(formData.consultationType === 'video_call' || formData.consultationType === 'voice_call') && (
                      <>
                        <label>
                          Date
                          <input
                            type="date"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            disabled={userRole !== 'farmer'}
                          />
                        </label>

                        <label>
                          Time
                          <input
                            type="time"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleChange}
                            required
                            disabled={userRole !== 'farmer'}
                          />
                        </label>

                        <label>
                          Duration (minutes)
                          <select
                            name="durationMinutes"
                            value={formData.durationMinutes}
                            onChange={handleChange}
                            disabled={userRole !== 'farmer'}
                          >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">60 minutes</option>
                          </select>
                        </label>
                      </>
                    )}

                    <button type="submit" disabled={sending || !selectedExpertId || userRole !== 'farmer'}>
                      {sending ? 'Creating...' : formData.consultationType === 'chat' ? 'Start Chat' : 'Book Appointment'}
                    </button>
                  </form>

                  <div className="expert-quick-links">
                    <Link to="/farmer/consultations" className="quick-link">
                      📅 View All My Appointments
                    </Link>
                  </div>
                </section>
              </div>
            )}
          </>
      </div>
    </Layout>
  );
};

export default TalkToExperts;
