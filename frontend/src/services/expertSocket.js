import { io } from 'socket.io-client';

class ExpertSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }

  connect(token) {
    if (this.socket?.connected) {
      return Promise.resolve(this.socket);
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io('http://localhost:5005', {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        this.socket.on('connect', () => {
          this.connected = true;
          console.log('Expert socket connected');
          this.emit('connected');
          resolve(this.socket);
        });

        this.socket.on('disconnect', () => {
          this.connected = false;
          console.log('Expert socket disconnected');
          this.emit('disconnected');
        });

        this.socket.on('error', (error) => {
          console.error('Expert socket error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.socket.on('expert_connected', (data) => {
          this.emit('expert_connected', data);
        });

        this.socket.on('expert_online', (data) => {
          this.emit('expert_online', data);
        });

        this.socket.on('expert_offline', (data) => {
          this.emit('expert_offline', data);
        });

        this.socket.on('joined_consultation', (data) => {
          this.emit('joined_consultation', data);
        });

        this.socket.on('receive_message', (data) => {
          this.emit('receive_message', data);
        });

        this.socket.on('user_typing', (data) => {
          this.emit('user_typing', data);
        });

        this.socket.on('user_stop_typing', (data) => {
          this.emit('user_stop_typing', data);
        });

        // WebRTC events
        this.socket.on('incoming_call', (data) => {
          this.emit('incoming_call', data);
        });

        this.socket.on('call_initiated', (data) => {
          this.emit('call_initiated', data);
        });

        this.socket.on('call_accepted', (data) => {
          this.emit('call_accepted', data);
        });

        this.socket.on('call_rejected', (data) => {
          this.emit('call_rejected', data);
        });

        this.socket.on('webrtc_offer', (data) => {
          this.emit('webrtc_offer', data);
        });

        this.socket.on('webrtc_answer', (data) => {
          this.emit('webrtc_answer', data);
        });

        this.socket.on('webrtc_ice_candidate', (data) => {
          this.emit('webrtc_ice_candidate', data);
        });

        this.socket.on('call_ended', (data) => {
          this.emit('call_ended', data);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Consultation room management
  joinConsultation(consultationId) {
    if (this.socket?.connected) {
      this.socket.emit('join_consultation', consultationId);
    }
  }

  // Messaging
  sendMessage(consultationId, message, messageType = 'text') {
    if (this.socket?.connected) {
      this.socket.emit('send_message', { consultationId, message, messageType });
    }
  }

  // Typing indicators
  startTyping(consultationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_start', { consultationId });
    }
  }

  stopTyping(consultationId) {
    if (this.socket?.connected) {
      this.socket.emit('typing_stop', { consultationId });
    }
  }

  // WebRTC - Call management
  initiateCall(consultationId, callType = 'video') {
    if (this.socket?.connected) {
      this.socket.emit('call_request', { consultationId, callType });
    }
  }

  acceptCall(callId) {
    if (this.socket?.connected) {
      this.socket.emit('call_accept', { callId });
    }
  }

  rejectCall(callId, reason) {
    if (this.socket?.connected) {
      this.socket.emit('call_reject', { callId, reason });
    }
  }

  // WebRTC - Signaling
  sendOffer(callId, offer) {
    if (this.socket?.connected) {
      this.socket.emit('webrtc_offer', { callId, offer });
    }
  }

  sendAnswer(callId, answer) {
    if (this.socket?.connected) {
      this.socket.emit('webrtc_answer', { callId, answer });
    }
  }

  sendIceCandidate(callId, candidate) {
    if (this.socket?.connected) {
      this.socket.emit('webrtc_ice_candidate', { callId, candidate });
    }
  }

  endCall(callId) {
    if (this.socket?.connected) {
      this.socket.emit('end_call', { callId });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  isConnected() {
    return this.connected;
  }
}

// Singleton instance
const expertSocketService = new ExpertSocketService();

export default expertSocketService;
