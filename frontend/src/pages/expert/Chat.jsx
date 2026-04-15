import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import io from 'socket.io-client';
import expertAPI from '../../services/expertAPI';
import ExpertNavbar from '../../components/ExpertNavbar';
import './ExpertChat.css';

const ExpertChat = () => {
  const { consultationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // WebRTC call state
  const [callActive, setCallActive] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callType, setCallType] = useState('video');
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

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
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5005', {
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

    // WebRTC call events
    newSocket.on('incoming_call', ({ callId, farmerId, farmerName, callType }) => {
      setIncomingCall({ callId, farmerId, farmerName, callType });
    });

    newSocket.on('call_accepted', ({ callId }) => {
      setCallActive(true);
      setIncomingCall(null);
    });

    newSocket.on('call_rejected', ({ callId, reason }) => {
      setCallActive(false);
      setIncomingCall(null);
      alert(`Call rejected: ${reason || 'Unknown reason'}`);
    });

    newSocket.on('call_ended', ({ callId, duration }) => {
      endCall();
    });

    newSocket.on('webrtc_offer', async ({ callId, offer }) => {
      await handleWebRTCOffer(offer);
    });

    newSocket.on('webrtc_answer', async ({ callId, answer }) => {
      await handleWebRTCAnswer(answer);
    });

    newSocket.on('webrtc_ice_candidate', async ({ callId, candidate }) => {
      await handleICECandidate(candidate);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    setSocket(newSocket);
  };

  const fetchConsultation = async () => {
    try {
      const response = await expertAPI.getExpertConsultations();
      if (response.data.success) {
        const consultation = response.data.data.find(c => c._id === consultationId);
        setConsultation(consultation);
      }
    } catch (err) {
      setError('Failed to load consultation');
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getConsultationMessages(consultationId);
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load messages');
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

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing_start', { consultationId });
    }
  };

  const handleStopTyping = () => {
    if (socket) {
      socket.emit('typing_stop', { consultationId });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateStatus = async (status) => {
    try {
      await expertAPI.updateConsultationStatus(consultationId, { status });
      fetchConsultation();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // WebRTC functions
  const setupPeerConnection = () => {
    const config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
          consultationId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    return pc;
  };

  const handleWebRTCOffer = async (offer) => {
    const pc = setupPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === 'video',
      audio: true
    });

    setLocalStream(stream);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit('webrtc_answer', {
      consultationId,
      answer
    });
  };

  const handleWebRTCAnswer = async (answer) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    }
  };

  const handleICECandidate = async (candidate) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingCall.callType === 'video',
        audio: true
      });

      setLocalStream(stream);
      setCallType(incomingCall.callType);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = setupPeerConnection();
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('webrtc_offer', {
        consultationId,
        offer
      });

      socket.emit('call_accept', { callId: incomingCall.callId });
    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Failed to access camera/microphone');
    }
  };

  const rejectCall = () => {
    if (incomingCall && socket) {
      socket.emit('call_reject', {
        callId: incomingCall.callId,
        reason: 'Expert rejected the call'
      });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (socket) {
      socket.emit('end_call', { consultationId });
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);
    setIncomingCall(null);
    peerConnectionRef.current = null;
  };

  if (loading) {
    return (
      <div className="expert-layout">
        <ExpertNavbar />
        <div className="expert-chat">
          <div className="chat-loading">Loading...</div>
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
          <div className="consultation-info">
            <h2>Chat with {consultation?.farmers?.users?.name}</h2>
            <p>{consultation?.title}</p>
            {consultation && (
              <div className="status-controls">
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

        <form onSubmit={handleSendMessage} className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onFocus={handleTyping}
            onBlur={handleStopTyping}
            placeholder="Type your message..."
          />
          <button type="submit" disabled={!newMessage.trim()}>
            Send
          </button>
        </form>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="incoming-call-modal">
            <div className="call-modal-content">
              <h3>Incoming {incomingCall.callType} Call</h3>
              <p>Farmer: {incomingCall.farmerName}</p>
              <div className="call-actions">
                <button onClick={acceptCall} className="accept-call-button">
                  Accept
                </button>
                <button onClick={rejectCall} className="reject-call-button">
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active Call UI */}
        {callActive && (
          <div className="active-call-ui">
            <div className="call-videos">
              {callType === 'video' && (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="local-video"
                  />
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="remote-video"
                  />
                </>
              )}
              {callType === 'voice' && (
                <div className="voice-call-indicator">
                  <div className="pulse-animation">📞 Voice Call Active</div>
                </div>
              )}
            </div>
            <div className="call-controls">
              <button onClick={endCall} className="end-call-button">
                End Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertChat;
