import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import expertAPI from '../../services/expertAPI';
import ExpertSocket from '../../services/expertSocket';
import './VideoCall.css';

const VideoCall = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, connected, ended
  const [callDuration, setCallDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    loadConsultation();
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      setLoading(true);
      const response = await expertAPI.getFarmerConsultations();
      if (response.data.success) {
        const consultationData = response.data.data.find(c => c._id === consultationId);
        if (consultationData) {
          setConsultation(consultationData);
        } else {
          setError('Consultation not found');
        }
      }
    } catch (err) {
      setError('Failed to load consultation');
    } finally {
      setLoading(false);
    }
  };

  const initializeCall = async () => {
    try {
      const token = localStorage.getItem('token');
      const expertSocket = new ExpertSocket();
      await expertSocket.connect(token);
      setSocket(expertSocket);

      // Initialize WebRTC for video call
      await initializeWebRTC();
      
      // Join consultation room
      expertSocket.emit('join_consultation', consultationId);
      
      // Start call
      expertSocket.emit('start_video_call', { consultationId });
      
    } catch (err) {
      setError('Failed to initialize call');
    }
  };

  const initializeWebRTC = async () => {
    try {
      // Get user media (video and audio for video call)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: true 
      });
      setLocalStream(stream);
      
      // Set local video
      const localVideo = document.getElementById('localVideo');
      if (localVideo) {
        localVideo.srcObject = stream;
      }
      
      // WebRTC implementation would go here
      setCallStatus('connected');
      
      // Start call duration timer
      const startTime = Date.now();
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      return () => clearInterval(interval);
      
    } catch (err) {
      setError('Failed to access camera and microphone');
    }
  };

  const endCall = () => {
    if (socket) {
      socket.emit('end_call', { consultationId });
    }
    setCallStatus('ended');
    cleanup();
    navigate('/farmer/consultations');
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (socket) {
      socket.disconnect();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Layout showSidebar>
        <div className="video-call-container">
          <div className="loading">Loading video call...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showSidebar>
        <div className="video-call-container">
          <div className="error">
            <h2>Call Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/farmer/consultations')}>
              Back to Consultations
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar>
      <div className="video-call-container">
        <div className="call-header">
          <h1>Video Call</h1>
          <div className="call-status">
            Status: <span className={`status ${callStatus}`}>{callStatus}</span>
          </div>
        </div>

        <div className="call-content">
          <div className="video-grid">
            <div className="video-container local-video">
              <video id="localVideo" autoPlay muted playsInline />
              <div className="video-label">You</div>
            </div>
            
            <div className="video-container remote-video">
              <video id="remoteVideo" autoPlay playsInline />
              <div className="video-label">
                {consultation?.expert?.users?.name || 'Expert'}
              </div>
            </div>
          </div>

          <div className="call-controls">
            {callStatus === 'connected' && (
              <div className="call-duration">
                Duration: {formatDuration(callDuration)}
              </div>
            )}
            
            <div className="control-buttons">
              <button className="end-call-btn" onClick={endCall}>
                End Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VideoCall;
