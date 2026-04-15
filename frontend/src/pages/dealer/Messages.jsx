import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import dealerAPI from '../../services/dealerAPI';
import LoadingSpinner from '../../components/LoadingSpinner';
import DealerNavbar from '../../components/DealerNavbar';
import './DealerDashboard.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await dealerAPI.getDealerMessages();
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load messages');
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (farmerId) => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await dealerAPI.sendMessageToFarmer(farmerId, {
        message: newMessage
      });
      if (response.data.success) {
        toast.success('Message sent');
        setNewMessage('');
        fetchMessages();
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
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
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Messages</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dealer-dashboard">
        <div className="dashboard-header">
          <h1>Messages</h1>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMessages} className="retry-button">
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
          <h1>Messages</h1>
          <p>Communicate with farmers and manage orders</p>
        </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet</p>
            <p>Start a conversation with a farmer from the orders page</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((conversation) => (
              <div
                key={conversation._id}
                className={`message-card ${selectedConversation === conversation._id ? 'active' : ''}`}
                onClick={() => setSelectedConversation(conversation._id)}
              >
                <div className="message-header">
                  <div className="farmer-avatar">
                    {conversation.farmer?.users?.profileimageurl ? (
                      <img src={conversation.farmer.users.profileimageurl} alt="" />
                    ) : (
                      <span className="avatar-placeholder">
                        {conversation.farmer?.users?.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="message-info">
                    <h3>{conversation.farmer?.users?.name}</h3>
                    <p className="message-preview">
                      {conversation.lastMessage || 'No messages yet'}
                    </p>
                    <span className="message-time">
                      {conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'Never'}
                    </span>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </div>

                {selectedConversation === conversation._id && (
                  <div className="message-conversation">
                    <div className="conversation-history">
                      {conversation.messages?.map((msg) => (
                        <div
                          key={msg._id}
                          className={`chat-message ${msg.senderId === conversation.farmerId ? 'received' : 'sent'}`}
                        >
                          <div className="message-content">
                            <p>{msg.message}</p>
                            <span className="message-time">{formatDate(msg.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="message-input">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(conversation.farmerId)}
                      />
                      <button
                        onClick={() => handleSendMessage(conversation.farmerId)}
                        disabled={sending || !newMessage.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Messages;
