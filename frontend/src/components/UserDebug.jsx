import { useAuth } from '../contexts/AuthContext'

const UserDebug = () => {
  const { user, isAuthenticated } = useAuth()

  // Also check localStorage directly
  const localStorageUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #2e7d32',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>User Debug Info</h4>
      
      <div><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
      
      <div style={{ marginTop: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
        <strong>AuthContext User:</strong>
        <pre style={{ fontSize: '10px', background: '#f8f9fa', padding: '5px', borderRadius: '4px', marginTop: '5px' }}>
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      
      <div style={{ marginTop: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
        <strong>localStorage User:</strong>
        <pre style={{ fontSize: '10px', background: '#fff3cd', padding: '5px', borderRadius: '4px', marginTop: '5px' }}>
          {JSON.stringify(localStorageUser, null, 2)}
        </pre>
      </div>
      
      {user && (
        <>
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Role:</strong> <span style={{ 
            color: user.role === 'farmer' ? '#28a745' : user.role === 'consumer' ? '#007bff' : '#dc3545',
            fontWeight: 'bold'
          }}>{user.role}</span></div>
          <div><strong>ID:</strong> {user._id}</div>
        </>
      )}
      
      <div style={{ marginTop: '10px', fontSize: '10px', color: '#666' }}>
        <strong>Issue:</strong> If role shows "consumer" instead of "farmer", check both AuthContext and localStorage values above.
      </div>
    </div>
  )
}

export default UserDebug
