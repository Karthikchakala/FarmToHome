import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import expertAPI from '../services/expertAPI';
import './talk-to-experts.css';

const TalkToExperts = () => {
  const [experts, setExperts] = useState([]);
  const [selectedExpertId, setSelectedExpertId] = useState('');
  const [formData, setFormData] = useState({
    topic: '',
    message: '',
    preferredContact: 'platform'
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadExperts = async () => {
      setLoading(true);
      try {
        const response = await expertAPI.getExperts();
        if (response.data.success) {
          const expertList = response.data.data.experts || [];
          setExperts(expertList);
          if (expertList[0]) setSelectedExpertId(expertList[0].id);
        }
      } catch (error) {
        toast.error('Failed to load experts');
      } finally {
        setLoading(false);
      }
    };

    loadExperts();
  }, []);

  const selectedExpert = useMemo(
    () => experts.find((expert) => expert.id === selectedExpertId),
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
      const response = await expertAPI.createInquiry({
        expertId: selectedExpertId,
        topic: formData.topic,
        message: formData.message,
        preferredContact: formData.preferredContact
      });

      if (response.data.success) {
        toast.success('Consultation request sent');
        setFormData({
          topic: '',
          message: '',
          preferredContact: 'platform'
        });
      } else {
        toast.error(response.data.message || 'Failed to send request');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout showSidebar>
      <div className="expert-content">
        <div className="expert-header">
          <h1>Talk to Experts</h1>
          <p>Reach agronomy, pest-management, and market specialists without interrupting existing marketplace flows.</p>
        </div>

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
                  <button
                    type="button"
                    key={expert.id}
                    className={`expert-card ${selectedExpertId === expert.id ? 'selected' : ''}`}
                    onClick={() => setSelectedExpertId(expert.id)}
                  >
                    <div className="expert-card-head">
                      <h3>{expert.name}</h3>
                      <span className={`expert-status ${expert.availabilityStatus || 'available'}`}>
                        {expert.availabilityStatus || 'available'}
                      </span>
                    </div>
                    <p className="expert-specialization">{expert.specialization}</p>
                    <p>{expert.bio}</p>
                    <div className="expert-meta">
                      <span>{expert.region}</span>
                      <span>{expert.experienceYears} yrs</span>
                      <span>Rating {expert.rating}</span>
                    </div>
                    <div className="expert-languages">
                      {(expert.languages || []).map((language) => (
                        <span key={language}>{language}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="expert-panel">
            <h2>Request Consultation</h2>
            {selectedExpert && (
              <div className="selected-expert-summary">
                <strong>{selectedExpert.name}</strong>
                <span>{selectedExpert.specialization}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="expert-form">
              <label>
                Topic
                <input
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="e.g. tomato leaf spots, storage decisions, soil health"
                  required
                />
              </label>

              <label>
                Message
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="8"
                  placeholder="Describe the issue, crop stage, symptoms, field context, or market question."
                  required
                />
              </label>

              <label>
                Preferred Contact
                <select name="preferredContact" value={formData.preferredContact} onChange={handleChange}>
                  <option value="platform">Platform reply</option>
                  <option value="email">Email</option>
                </select>
              </label>

              <button type="submit" disabled={sending || !selectedExpertId}>
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TalkToExperts;
