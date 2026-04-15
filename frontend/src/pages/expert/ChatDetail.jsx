import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import io from 'socket.io-client';
import expertAPI from '../../services/expertAPI';
import ExpertNavbar from '../../components/ExpertNavbar';
import './ExpertChat.css';

const ExpertChatDetail = () => {
  const { consultationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (consultationId) {
      fetchConsultation();
      fetchMessages();
      connectWebSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [consultationId]);

  const connectWebSocket = () => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:5005', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('join_consultation', consultationId);
    });

    newSocket.on('joined_consultation', ({ room }) => {
      console.log('Joined consultation room:', room);
    });

    newSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user_typing', ({ user }) => {
      if (user.role !== 'expert') {
        setIsTyping(true);
      }
    });

    newSocket.on('user_stop_typing', () => {
      setIsTyping(false);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    setSocket(newSocket);
  };

  const fetchConsultation = async () => {
    try {
      console.log('Fetching consultation for ID:', consultationId);
      const response = await expertAPI.getExpertConsultations();
      console.log('Expert consultations response:', response.data);
      
      if (response.data.success) {
        const consultation = response.data.data.find(c => c._id === consultationId);
        console.log('Found consultation:', consultation);
        
        if (!consultation) {
          setError('Consultation not found');
          return;
        }
        
        setConsultation(consultation);
      } else {
        console.error('API returned error:', response.data.error);
        setError(response.data.error || 'Failed to load consultation');
      }
    } catch (err) {
      console.error('Error fetching consultation:', err);
      setError('Failed to load consultation: ' + err.message);
    }
  };

  const fetchMessages = async () => {
    console.log('Fetching messages for consultation ID:', consultationId);
    
    try {
      const response = await expertAPI.getConsultationMessages(consultationId);
      console.log('Messages response:', response.data);
      
      if (response.data.success) {
        setMessages(response.data.data || []);
      } else {
        console.error('API returned error:', response.data.error);
        setError(response.data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      // Send via WebSocket for real-time delivery
      if (socket) {
        socket.emit('send_message', {
          consultationId,
          message: newMessage,
          messageType: 'text'
        });
      }

      // Also store in database
      const response = await expertAPI.sendConsultationMessage(consultationId, {
        message: newMessage,
        messageType: 'text'
      });

      if (response.data.success) {
        setMessages([...messages, response.data.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      await expertAPI.updateConsultationStatus(consultation._id, { status });
      fetchConsultation();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-chat">
          <div className="loading">Loading chat...</div>
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
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Reload Page
            </button>
            <Link to="/expert/chat" className="back-button">
              Back to Chat List
            </Link>
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
          <Link to="/expert/chat" className="back-button">← Back to Chat List</Link>
          <div className="consultation-info">
            <h2>Chat with {consultation?.farmers?.users?.name || 'Farmer'}</h2>
            <p>{consultation?.title}</p>
            {consultation && (
              <div className="status-controls">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(consultation.status) }}
                >
                  {consultation.status.replace('_', ' ').toUpperCase()}
                </span>
                {consultation.status === 'pending' && (
                  <>
                    <button onClick={() => handleUpdateStatus('confirmed')} className="status-button accept">
                      Accept
                    </button>
                    <button onClick={() => handleUpdateStatus('cancelled')} className="status-button reject">
                      Reject
                    </button>
                  </>
                )}
                {consultation.status === 'confirmed' && (
                  <button onClick={() => handleUpdateStatus('in_progress')} className="status-button start">
                    Start Session
                  </button>
                )}
                {consultation.status === 'in_progress' && (
                  <button onClick={() => handleUpdateStatus('completed')} className="status-button complete">
                    Complete Session
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg) => (
              <div key={msg._id} className={`message ${msg.users?.role === 'expert' ? 'expert' : 'farmer'}`}>
                <div className="message-header">
                  <strong>{msg.users?.name}</strong>
                  <span className="message-time">
                    {new Date(msg.createdat).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))
          )}
          {isTyping && <div className="typing-indicator">Farmer is typing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={!consultation || consultation.status !== 'in_progress'}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || !consultation || consultation.status !== 'in_progress'}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpertChatDetail;
