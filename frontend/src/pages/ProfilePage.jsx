import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function ProfilePage({ user, setUser }) {
  const navigate = useNavigate();
  const [elections, setElections] = useState([]);
  const [meta, setMeta] = useState({ constituencies: [] });
  
  // Resubmission state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editConstituency, setEditConstituency] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Set default resubmission states if rejected
    if (user.approval_status === 'Rejected') {
      setEditName(user.name);
      setEditEmail(user.email);
      setEditConstituency(user.constituency_id);
    }
    
    fetch('http://localhost:3000/api/elections')
      .then(res => res.json())
      .then(data => setElections(data.filter(e => e.status !== 'Completed')));

    fetch('http://localhost:3000/api/meta')
      .then(res => res.json())
      .then(data => setMeta(data));

  }, [user, navigate]);

  const handleResubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:3000/api/user/resubmit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: user.role,
        id: user.id,
        name: editName,
        email: editEmail,
        constituency_id: editConstituency
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        // Force app to resync data from DB
        const refreshedUser = { ...user, name: editName, email: editEmail, constituency_id: editConstituency, approval_status: 'Pending', rejection_reason: null };
        setUser(refreshedUser);
        localStorage.setItem('user', JSON.stringify(refreshedUser));
      })
      .catch(console.error);
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div className="page-header">
        <h1>Welcome, {user.name}</h1>
        <p>Manage your account and exercise your democratic rights.</p>
      </div>

      {user.approval_status === 'Rejected' && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <strong>Registration Rejected:</strong> {user.rejection_reason || 'No specific reason provided by administrators.'}
        </div>
      )}

      {user.approval_status === 'Rejected' ? (
         <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--danger-color)' }}>
           <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--danger-color)' }}>Appeal / Resubmission Form</h2>
           <form onSubmit={handleResubmit}>
              <div className="form-group">
                <label>Updated Full Name</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Updated Email</label>
                <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Correct Constituency</label>
                <select value={editConstituency} onChange={e => setEditConstituency(e.target.value)}>
                  {meta.constituencies.map(c => <option key={c.constituency_id} value={c.constituency_id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Resubmit Application</button>
           </form>
         </div>
      ) : (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '0.5rem' }}>Account Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user.email}</span>
            </div>
            <div>
              <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Role Type</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--primary-color)' }}>{user.role}</span>
            </div>
            <div>
              <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Account Status</span>
              <span style={{ 
                display: 'inline-block',
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px', 
                fontSize: '0.875rem', 
                fontWeight: '600',
                marginTop: '0.25rem',
                background: user.approval_status === 'Approved' ? '#dcfce7' : '#fef9c3',
                color: user.approval_status === 'Approved' ? '#166534' : '#854d0e'
              }}>
                {user.approval_status}
              </span>
            </div>
            <div>
              <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '500' }}>Constituency ID</span>
              <span style={{ fontSize: '1.125rem', fontWeight: '500' }}>{user.constituency_id ? `Constituency #${user.constituency_id}` : 'System Wide'}</span>
            </div>
          </div>
        </div>
      )}

      {user.role === 'VOTER' && user.approval_status !== 'Rejected' && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '0.5rem' }}>Action Center</h2>
          
          {user.approval_status === 'Pending' ? (
            <div className="alert alert-danger" style={{ marginBottom: 0, backgroundColor: '#fef9c3', color: '#854d0e', borderColor: '#fef08a' }}>
              Your account is currently {user.approval_status}. You must wait for an administrator to approve your details before you can vote.
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '1.5rem' }}>You are eligible to vote in the following active elections within your constituency.</p>
              {elections.map((el) => (
                <div key={el.election_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--secondary-color)', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{el.name}</h3>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status: {el.status}</span>
                  </div>
                  {el.status === 'Ongoing' ? (
                     <Link to={`/vote/${el.election_id}`} className="btn-primary">Enter Booth</Link>
                  ) : (
                     <button disabled className="btn-primary" style={{ opacity: 0.5 }}>Inactive</button>
                  )}
                </div>
              ))}
              {elections.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active elections found.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
