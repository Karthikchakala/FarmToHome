import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import expertSocket from '../services/expertSocket';
import expertAPI from '../services/expertAPI';
import './ExpertChat.css';

const ExpertChat = ({ consultationId, expert, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const callTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  useEffect(() => {
    const initializeChat = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      try {
        // Connect to WebSocket
        await expertSocket.connect(token);
        setConnected(true);

        // Join consultation room
        expertSocket.joinConsultation(consultationId);

        // Load existing messages
        await loadMessages();

        // Set up event listeners
        setupSocketListeners();
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        toast.error('Failed to connect to chat');
      }
    };

    initializeChat();

    return () => {
      cleanup();
    };
  }, [consultationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await expertAPI.getConsultationMessages(consultationId);
      if (response.data.success) {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    expertSocket.on('receive_message', (message) => {
      setMessages(prev => [...prev, message]);
      setOtherUserTyping(false);
    });

    expertSocket.on('user_typing', (data) => {
      setOtherUserTyping(true);
    });

    expertSocket.on('user_stop_typing', () => {
      setOtherUserTyping(false);
    });

    expertSocket.on('incoming_call', (data) => {
      handleIncomingCall(data);
    });

    expertSocket.on('call_accepted', (data) => {
      handleCallAccepted(data);
    });

    expertSocket.on('call_rejected', (data) => {
      handleCallRejected(data);
    });

    expertSocket.on('webrtc_offer', (data) => {
      handleWebRTCOffer(data);
    });

    expertSocket.on('webrtc_answer', (data) => {
      handleWebRTCAnswer(data);
    });

    expertSocket.on('webrtc_ice_candidate', (data) => {
      handleWebRTCIceCandidate(data);
    });

    expertSocket.on('call_ended', (data) => {
      handleCallEnded(data);
    });

    expertSocket.on('error', (error) => {
      toast.error(error.message || 'Chat error occurred');
    });
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    expertSocket.disconnect();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !connected) return;

    expertSocket.sendMessage(consultationId, newMessage.trim());
    setNewMessage('');
    setOtherUserTyping(false);
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      expertSocket.startTyping(consultationId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      expertSocket.stopTyping(consultationId);
    }, 1000);
  };

  const handleIncomingCall = (data) => {
    toast.info(`Incoming call from ${data.farmerName}`);
    // Show call UI with accept/reject buttons
  };

  const handleCallAccepted = (data) => {
    setCallActive(true);
    startCallTimer();
    toast.success('Call connected');
  };

  const handleCallRejected = (data) => {
    setCallActive(false);
    toast.error(data.reason || 'Call rejected');
  };

  const handleCallEnded = (data) => {
    setCallActive(false);
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    toast.info(`Call ended. Duration: ${data.duration}s`);
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInitiateCall = (callType = 'video') => {
    if (!connected) {
      toast.error('Not connected to chat');
      return;
    }
    expertSocket.initiateCall(consultationId, callType);
  };

  const handleAcceptCall = () => {
    expertSocket.acceptCall(currentCallId);
  };

  const handleRejectCall = (reason = 'Busy') => {
    expertSocket.rejectCall(currentCallId, reason);
  };

  const handleEndCall = () => {
    if (currentCallId) {
      expertSocket.endCall(currentCallId);
    }
  };

  // WebRTC handlers
  const handleWebRTCOffer = async (data) => {
    try {
      const pc = await createPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      expertSocket.sendAnswer(data.callId, answer);
    } catch (error) {
      console.error('Error handling WebRTC offer:', error);
    }
  };

  const handleWebRTCAnswer = async (data) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    } catch (error) {
      console.error('Error handling WebRTC answer:', error);
    }
  };

  const handleWebRTCIceCandidate = async (data) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const createPeerConnection = async () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Get local media stream
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Add tracks to peer connection
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    // Handle remote stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        expertSocket.sendIceCandidate(currentCallId, event.candidate);
      }
    };

    return pc;
  };

  return (
    <div className="expert-chat-container">
      <div className="expert-chat-header">
        <div className="expert-chat-info">
          <h3>{expert?.users?.name || expert?.users?.email}</h3>
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
        <div className="expert-chat-actions">
          <button
            className="btn-video-call"
            onClick={() => handleInitiateCall('video')}
            disabled={!connected}
          >
            📹 Video Call
          </button>
          <button
            className="btn-audio-call"
            onClick={() => handleInitiateCall('audio')}
            disabled={!connected}
          >
            📞 Audio Call
          </button>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {callActive && (
        <div className="video-call-container">
          <div className="video-call-header">
            <span className="call-timer">⏱ {formatDuration(callDuration)}</span>
            <button className="btn-end-call" onClick={handleEndCall}>
              📵 End Call
            </button>
          </div>
          <div className="video-streams">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="local-video"
            />
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="remote-video"
            />
          </div>
        </div>
      )}

      <div className="expert-chat-messages">
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.users?.role === 'farmer' ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <span className="message-sender">{message.users?.name}</span>
                <p>{message.message}</p>
                <span className="message-time">
                  {new Date(message.createdat).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        {otherUserTyping && (
          <div className="typing-indicator">
            <span>{expert?.users?.name} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="expert-chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTypingStart();
          }}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ExpertChat;
