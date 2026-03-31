import { useState } from 'react'
import { feedbackAPI } from '../services/api'

const FeedbackDetails = ({ feedback, onClose, adminView, onStatusUpdate }) => {
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState(feedback.notes || [])

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    
    try {
      const response = await feedbackAPI.addFeedbackNote(feedback._id, {
        note: newNote,
        isAdmin: adminView
      })
      
      if (response.data.success) {
        setNotes(prev => [...prev, response.data.data])
        setNewNote('')
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#ffc107', label: 'Pending' },
      in_progress: { color: '#17a2b8', label: 'In Progress' },
      resolved: { color: '#28a745', label: 'Resolved' },
      rejected: { color: '#dc3545', label: 'Rejected' }
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span 
        className="status-badge" 
        style={{ backgroundColor: config.color }}
      >
        {config.label}
      </span>
    )
  }

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Feedback Details</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="modal-content">
          <div className="feedback-details-grid">
            <div className="detail-section">
              <h4>Basic Information</h4>
              <div className="detail-row">
                <span className="label">ID:</span>
                <span className="value">#{feedback._id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Category:</span>
                <span className="value">{feedback.category}</span>
              </div>
              <div className="detail-row">
                <span className="label">Subcategory:</span>
                <span className="value">{feedback.subcategory}</span>
              </div>
              <div className="detail-row">
                <span className="label">Priority:</span>
                <span className="value">{feedback.priority}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value">{getStatusBadge(feedback.status)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Subject & Description</h4>
              <div className="subject">{feedback.subject}</div>
              <div className="description">{feedback.description}</div>
            </div>

            {feedback.orderId && (
              <div className="detail-section">
                <h4>Related Order</h4>
                <div className="detail-row">
                  <span className="label">Order ID:</span>
                  <span className="value">#{feedback.orderId}</span>
                </div>
              </div>
            )}

            {feedback.productId && (
              <div className="detail-section">
                <h4>Related Product</h4>
                <div className="detail-row">
                  <span className="label">Product ID:</span>
                  <span className="value">{feedback.productId}</span>
                </div>
              </div>
            )}

            {feedback.attachments && feedback.attachments.length > 0 && (
              <div className="detail-section">
                <h4>Attachments</h4>
                <div className="attachments-list">
                  {feedback.attachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <span className="attachment-icon">📎</span>
                      <a 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        {attachment.name}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-section">
              <h4>Notes & Updates</h4>
              <div className="notes-list">
                {notes.map((note, index) => (
                  <div key={index} className="note-item">
                    <div className="note-header">
                      <span className="note-author">
                        {note.isAdmin ? 'Admin' : 'User'}
                      </span>
                      <span className="note-date">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="note-content">{note.note}</div>
                  </div>
                ))}
              </div>
              
              <div className="add-note">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note or update..."
                  rows={3}
                />
                <button onClick={handleAddNote} className="btn btn-primary btn-small">
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>

        {adminView && (
          <div className="modal-actions">
            {feedback.status === 'pending' && (
              <>
                <button
                  onClick={() => onStatusUpdate(feedback._id, 'in_progress')}
                  className="btn btn-primary"
                >
                  Start Working
                </button>
                <button
                  onClick={() => onStatusUpdate(feedback._id, 'resolved')}
                  className="btn btn-success"
                >
                  Mark Resolved
                </button>
              </>
            )}
            
            {feedback.status === 'in_progress' && (
              <button
                onClick={() => onStatusUpdate(feedback._id, 'resolved')}
                className="btn btn-success"
              >
                Mark Resolved
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackDetails
