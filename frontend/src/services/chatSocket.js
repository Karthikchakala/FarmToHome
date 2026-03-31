import { io } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'

class ChatSocket {
  constructor() {
    this.socket = null
    this.connected = false
    this.eventListeners = new Map()
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket && this.connected) {
      return Promise.resolve(this.socket)
    }

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5005', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        })

        // Connection events
        this.socket.on('connect', () => {
          console.log('Chat socket connected')
          this.connected = true
          this.emit('connection_changed', true)
          resolve(this.socket)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('Chat socket disconnected:', reason)
          this.connected = false
          this.emit('connection_changed', false)
        })

        this.socket.on('connect_error', (error) => {
          console.error('Chat socket connection error:', error)
          this.connected = false
          this.emit('connection_changed', false)
          reject(error)
        })

        // Chat events
        this.socket.on('new_message', (data) => {
          this.emit('new_message', data)
        })

        this.socket.on('message_sent', (data) => {
          this.emit('message_sent', data)
        })

        this.socket.on('messages_read', (data) => {
          this.emit('messages_read', data)
        })

        this.socket.on('user_typing', (data) => {
          this.emit('user_typing', data)
        })

        this.socket.on('user_stop_typing', (data) => {
          this.emit('user_stop_typing', data)
        })

        this.socket.on('online_status', (data) => {
          this.emit('online_status', data)
        })

        this.socket.on('user_offline', (data) => {
          this.emit('user_offline', data)
        })

        this.socket.on('joined_order', (data) => {
          this.emit('joined_order', data)
        })

        this.socket.on('left_order', (data) => {
          this.emit('left_order', data)
        })

        this.socket.on('error', (error) => {
          console.error('Socket error:', error)
          this.emit('error', error)
        })

        this.socket.on('connected', (data) => {
          this.emit('connected', data)
        })

      } catch (error) {
        console.error('Failed to initialize socket:', error)
        reject(error)
      }
    })
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
      this.emit('connection_changed', false)
    }
  }

  // Join an order conversation
  joinOrder(orderId) {
    if (this.socket && this.connected) {
      this.socket.emit('join_order', orderId)
    }
  }

  // Leave an order conversation
  leaveOrder(orderId) {
    if (this.socket && this.connected) {
      this.socket.emit('leave_order', orderId)
    }
  }

  // Send typing indicator
  startTyping(orderId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing_start', orderId)
    }
  }

  // Stop typing indicator
  stopTyping(orderId) {
    if (this.socket && this.connected) {
      this.socket.emit('typing_stop', orderId)
    }
  }

  // Get online status for multiple orders
  getOnlineStatus(orderIds) {
    if (this.socket && this.connected) {
      this.socket.emit('get_online_status', orderIds)
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event)
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in socket event listener:', error)
        }
      })
    }
  }

  // Check if connected
  isConnected() {
    return this.connected
  }
}

// Create singleton instance
const chatSocket = new ChatSocket()

export default chatSocket
