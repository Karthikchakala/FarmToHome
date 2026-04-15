const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const supabase = require('../config/supabaseClient');

class ExpertSocket {
  constructor(io) {
    this.io = io;
    this.connectedExperts = new Map(); // userId -> { socket, expertId }
    this.connectedFarmers = new Map(); // userId -> { socket, farmerId }
    this.activeCalls = new Map(); // callId -> { farmerId, expertId, status, startTime }
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for expert socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const { data: user, error } = await supabase
          .from('users')
          .select('_id, role, email, name')
          .eq('_id', decoded.id)
          .single();

        if (error || !user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        logger.error('Expert socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.user;
      logger.info(`Expert socket connection: ${user.role}_${user._id}`);

      // Join expert communication room
      const roomName = `${user.role}_${user._id}`;
      socket.join(roomName);

      // Track expert or farmer connection
      if (user.role === 'expert') {
        this.trackExpertConnection(socket, user);
      } else if (user.role === 'farmer') {
        this.trackFarmerConnection(socket, user);
      }

      // Join consultation room
      socket.on('join_consultation', async (consultationId) => {
        try {
          const { data: consultation, error } = await supabase
            .from('consultations')
            .select('expertid, farmerid')
            .eq('_id', consultationId)
            .single();

          if (error || !consultation) {
            socket.emit('error', { message: 'Consultation not found' });
            return;
          }

          // Get expert and farmer user IDs
          const { data: expert } = await supabase
            .from('experts')
            .select('userid')
            .eq('_id', consultation.expertid)
            .single();

          const { data: farmer } = await supabase
            .from('farmers')
            .select('userid')
            .eq('_id', consultation.farmerid)
            .single();

          const hasAccess = (user.role === 'expert' && expert?.userid === user._id) ||
                           (user.role === 'farmer' && farmer?.userid === user._id);

          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied to this consultation' });
            return;
          }

          const consultationRoom = `consultation_${consultationId}`;
          socket.join(consultationRoom);
          socket.emit('joined_consultation', { consultationId, room: consultationRoom });
          
          logger.info(`User ${user.role}_${user._id} joined consultation ${consultationId}`);
        } catch (error) {
          logger.error('Error joining consultation:', error);
          socket.emit('error', { message: 'Failed to join consultation' });
        }
      });

      // Send message in consultation
      socket.on('send_message', async ({ consultationId, message, messageType = 'text' }) => {
        try {
          const { data: consultation, error: consultError } = await supabase
            .from('consultations')
            .select('expertid, farmerid')
            .eq('_id', consultationId)
            .single();

          if (consultError || !consultation) {
            socket.emit('error', { message: 'Consultation not found' });
            return;
          }

          // Verify access
          const { data: expert } = await supabase
            .from('experts')
            .select('userid')
            .eq('_id', consultation.expertid)
            .single();

          const { data: farmer } = await supabase
            .from('farmers')
            .select('userid')
            .eq('_id', consultation.farmerid)
            .single();

          const hasAccess = (user.role === 'expert' && expert?.userid === user._id) ||
                           (user.role === 'farmer' && farmer?.userid === user._id);

          if (!hasAccess) {
            socket.emit('error', { message: 'Access denied' });
            return;
          }

          // Store message in database
          const { data: newMessage, error: msgError } = await supabase
            .from('consultation_messages')
            .insert([{
              consultationid: consultationId,
              senderid: user._id,
              message: message,
              messagetype: messageType
            }])
            .select(`
              *,
              users!consultation_messages_senderid_fkey(name, role)
            `)
            .single();

          if (msgError) {
            logger.error('Error storing message:', msgError);
            socket.emit('error', { message: 'Failed to send message' });
            return;
          }

          // Broadcast to consultation room
          this.io.to(`consultation_${consultationId}`).emit('receive_message', newMessage);
          
          logger.info(`Message sent in consultation ${consultationId} by ${user.role}_${user._id}`);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on('typing_start', ({ consultationId }) => {
        socket.to(`consultation_${consultationId}`).emit('user_typing', {
          consultationId,
          user: { id: user._id, role: user.role, name: user.name }
        });
      });

      socket.on('typing_stop', ({ consultationId }) => {
        socket.to(`consultation_${consultationId}`).emit('user_stop_typing', {
          consultationId,
          user: { id: user._id, role: user.role }
        });
      });

      // WebRTC signaling - Call initiation
      socket.on('call_request', async ({ consultationId, callType = 'video' }) => {
        try {
          const { data: consultation, error } = await supabase
            .from('consultations')
            .select('expertid, farmerid')
            .eq('_id', consultationId)
            .single();

          if (error || !consultation) {
            socket.emit('error', { message: 'Consultation not found' });
            return;
          }

          // Only farmers can initiate calls
          if (user.role !== 'farmer') {
            socket.emit('error', { message: 'Only farmers can initiate calls' });
            return;
          }

          // Get expert user ID
          const { data: expert } = await supabase
            .from('experts')
            .select('userid')
            .eq('_id', consultation.expertid)
            .single();

          if (!expert) {
            socket.emit('error', { message: 'Expert not found' });
            return;
          }

          // Check if expert is online
          const expertConnection = this.connectedExperts.get(expert.userid);
          if (!expertConnection) {
            socket.emit('call_rejected', { reason: 'Expert is offline' });
            return;
          }

          // Generate call ID
          const callId = `call_${Date.now()}_${user._id}`;

          this.activeCalls.set(callId, {
            farmerId: user._id,
            expertId: expert.userid,
            status: 'pending',
            callType,
            startTime: null
          });

          // Send call request to expert
          this.io.to(`expert_${expert.userid}`).emit('incoming_call', {
            callId,
            consultationId,
            farmerId: user._id,
            farmerName: user.name,
            callType
          });

          socket.emit('call_initiated', { callId });
          logger.info(`Call initiated: ${callId} from farmer ${user._id} to expert ${expert.userid}`);
        } catch (error) {
          logger.error('Error initiating call:', error);
          socket.emit('error', { message: 'Failed to initiate call' });
        }
      });

      // WebRTC signaling - Call acceptance
      socket.on('call_accept', ({ callId }) => {
        try {
          const call = this.activeCalls.get(callId);
          if (!call) {
            socket.emit('error', { message: 'Call not found' });
            return;
          }

          if (user.role !== 'expert' || user._id !== call.expertId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          call.status = 'active';
          call.startTime = new Date();

          // Notify farmer
          this.io.to(`farmer_${call.farmerId}`).emit('call_accepted', { callId });
          
          logger.info(`Call accepted: ${callId}`);
        } catch (error) {
          logger.error('Error accepting call:', error);
          socket.emit('error', { message: 'Failed to accept call' });
        }
      });

      // WebRTC signaling - Call rejection
      socket.on('call_reject', ({ callId, reason }) => {
        try {
          const call = this.activeCalls.get(callId);
          if (!call) return;

          if (user.role !== 'expert' || user._id !== call.expertId) {
            socket.emit('error', { message: 'Unauthorized' });
            return;
          }

          call.status = 'rejected';

          // Notify farmer
          this.io.to(`farmer_${call.farmerId}`).emit('call_rejected', { callId, reason });
          this.activeCalls.delete(callId);
          
          logger.info(`Call rejected: ${callId}, reason: ${reason}`);
        } catch (error) {
          logger.error('Error rejecting call:', error);
        }
      });

      // WebRTC signaling - Offer
      socket.on('webrtc_offer', ({ callId, offer }) => {
        try {
          const call = this.activeCalls.get(callId);
          if (!call) return;

          const targetUserId = user.role === 'farmer' ? call.expertId : call.farmerId;
          const targetRole = user.role === 'farmer' ? 'expert' : 'farmer';

          this.io.to(`${targetRole}_${targetUserId}`).emit('webrtc_offer', { callId, offer });
        } catch (error) {
          logger.error('Error sending WebRTC offer:', error);
        }
      });

      // WebRTC signaling - Answer
      socket.on('webrtc_answer', ({ callId, answer }) => {
        try {
          const call = this.activeCalls.get(callId);
          if (!call) return;

          const targetUserId = user.role === 'farmer' ? call.expertId : call.farmerId;
          const targetRole = user.role === 'farmer' ? 'expert' : 'farmer';

          this.io.to(`${targetRole}_${targetUserId}`).emit('webrtc_answer', { callId, answer });
        } catch (error) {
          logger.error('Error sending WebRTC answer:', error);
        }
      });

      // WebRTC signaling - ICE candidates
      socket.on('webrtc_ice_candidate', ({ callId, candidate }) => {
        try {
          const call = this.activeCalls.get(callId);
          if (!call) return;

          const targetUserId = user.role === 'farmer' ? call.expertId : call.farmerId;
          const targetRole = user.role === 'farmer' ? 'expert' : 'farmer';

          this.io.to(`${targetRole}_${targetUserId}`).emit('webrtc_ice_candidate', { callId, candidate });
        } catch (error) {
          logger.error('Error sending ICE candidate:', error);
        }
      });

      // End call
      socket.on('end_call', ({ callId }) => {
        try {
          const call = this.activeCalls.get(callId);
          if (!call) return;

          const duration = call.startTime ? Math.floor((new Date() - call.startTime) / 1000) : 0;

          // Notify both parties
          this.io.to(`expert_${call.expertId}`).emit('call_ended', { callId, duration });
          this.io.to(`farmer_${call.farmerId}`).emit('call_ended', { callId, duration });

          this.activeCalls.delete(callId);
          logger.info(`Call ended: ${callId}, duration: ${duration}s`);
        } catch (error) {
          logger.error('Error ending call:', error);
        }
      });

      // Disconnection
      socket.on('disconnect', () => {
        logger.info(`Expert socket disconnect: ${user.role}_${user._id}`);

        if (user.role === 'expert') {
          this.connectedExperts.delete(user._id);
          this.notifyExpertOffline(user._id);
        } else if (user.role === 'farmer') {
          this.connectedFarmers.delete(user._id);
        }
      });

      // Send connection confirmation
      socket.emit('expert_connected', {
        user: { id: user._id, role: user.role, name: user.name }
      });
    });
  }

  trackExpertConnection(socket, user) {
    // Get expert profile
    supabase
      .from('experts')
      .select('_id')
      .eq('userid', user._id)
      .single()
      .then(({ data: expert }) => {
        if (expert) {
          this.connectedExperts.set(user._id, { socket, expertId: expert._id });
          
          // Update global online experts tracking
          if (!global.onlineExperts) {
            global.onlineExperts = new Set();
          }
          global.onlineExperts.add(user._id);
          
          // Notify farmers that expert is online
          this.notifyExpertOnline(user._id);
          
          logger.info(`Expert ${user._id} is now online`);
        }
      })
      .catch(error => {
        logger.error('Error tracking expert connection:', error);
      });
  }

  trackFarmerConnection(socket, user) {
    // Get farmer profile
    supabase
      .from('farmers')
      .select('_id')
      .eq('userid', user._id)
      .single()
      .then(({ data: farmer }) => {
        if (farmer) {
          this.connectedFarmers.set(user._id, { socket, farmerId: farmer._id });
          logger.info(`Farmer ${user._id} connected to expert socket`);
        }
      })
      .catch(error => {
        logger.error('Error tracking farmer connection:', error);
      });
  }

  notifyExpertOnline(expertUserId) {
    this.io.emit('expert_online', { userId: expertUserId });
  }

  notifyExpertOffline(expertUserId) {
    if (global.onlineExperts) {
      global.onlineExperts.delete(expertUserId);
    }
    this.io.emit('expert_offline', { userId: expertUserId });
  }

  getOnlineExperts() {
    return Array.from(this.connectedExperts.keys());
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.entries()).map(([callId, call]) => ({
      callId,
      ...call,
      duration: call.startTime ? Math.floor((new Date() - call.startTime) / 1000) : 0
    }));
  }
}

module.exports = ExpertSocket;
