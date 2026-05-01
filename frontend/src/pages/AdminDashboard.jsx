import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('APPROVALS');
  
  const [pending, setPending] = useState({ voters: [], candidates: [] });
  const [allUsers, setAllUsers] = useState({ voters: [], candidates: [] });
  const [elections, setElections] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchPending();
    fetchAllUsers();
    fetchElections();
  }, [navigate]);

  const fetchPending = () => {
    fetch('http://localhost:3000/api/admin/pending')
      .then(res => res.json())
      .then(data => setPending(data))
      .catch(console.error);
  };

  const fetchAllUsers = () => {
    fetch('http://localhost:3000/api/admin/users')
      .then(res => res.json())
      .then(data => setAllUsers(data))
      .catch(console.error);
  };

  const fetchElections = () => {
    fetch('http://localhost:3000/api/elections')
      .then(res => res.json())
      .then(data => setElections(data))
      .catch(console.error);
  };

  const handleAction = (id, role, decision) => {
    let rejection_reason = null;
    if (decision === 'Rejected') {
      rejection_reason = prompt("Please provide a reason for rejecting this user:");
      if (rejection_reason === null) return; // cancelled
    }

    fetch('http://localhost:3000/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, role, db_status: decision, rejection_reason })
    })
      .then(() => {
        fetchPending();
        fetchAllUsers();
      })
      .catch(console.error);
  };

  const handleElectionStatusUpdate = (election_id, new_status) => {
    fetch(`http://localhost:3000/api/admin/elections/${election_id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: new_status })
    })
      .then(() => fetchElections())
      .catch(console.error);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Administrative Center</h1>
        <p>Advanced system controls, comprehensive audits, and approval workflows.</p>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '1rem', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('APPROVALS')} style={{ background: 'none', color: activeTab === 'APPROVALS' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'APPROVALS' ? '600' : '500', fontSize: '1.125rem' }}>
          Pending Approvals
        </button>
        <button onClick={() => setActiveTab('USERS')} style={{ background: 'none', color: activeTab === 'USERS' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'USERS' ? '600' : '500', fontSize: '1.125rem' }}>
          System Users
        </button>
        <button onClick={() => setActiveTab('ELECTIONS')} style={{ background: 'none', color: activeTab === 'ELECTIONS' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'ELECTIONS' ? '600' : '500', fontSize: '1.125rem' }}>
          Manage Elections
        </button>
        <button onClick={() => setActiveTab('RESULTS')} style={{ background: 'none', color: activeTab === 'RESULTS' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'RESULTS' ? '600' : '500', fontSize: '1.125rem' }}>
          Live Stats
        </button>
      </div>

      {activeTab === 'APPROVALS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '0.5rem' }}>Pending Voters ({pending.voters.length})</h2>
            {pending.voters.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No voters pending approval.</p> : (
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--secondary-color)' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Email</th>
                    <th style={{ padding: '0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.voters.map(v => (
                    <tr key={v.voter_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem' }}>{v.name}</td>
                      <td style={{ padding: '0.5rem' }}>{v.email}</td>
                      <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleAction(v.voter_id, 'VOTER', 'Approved')} style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>Approve</button>
                        <button onClick={() => handleAction(v.voter_id, 'VOTER', 'Rejected')} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '0.5rem' }}>Pending Candidates ({pending.candidates.length})</h2>
            {pending.candidates.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No candidates pending approval.</p> : (
               <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--secondary-color)' }}>
                   <th style={{ padding: '0.5rem' }}>Name</th>
                   <th style={{ padding: '0.5rem' }}>Email</th>
                   <th style={{ padding: '0.5rem' }}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {pending.candidates.map(c => (
                   <tr key={c.candidate_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '0.5rem' }}>{c.name}</td>
                     <td style={{ padding: '0.5rem' }}>{c.email}</td>
                     <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                       <button onClick={() => handleAction(c.candidate_id, 'CANDIDATE', 'Approved')} style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>Approve</button>
                       <button onClick={() => handleAction(c.candidate_id, 'CANDIDATE', 'Rejected')} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.25rem 0.5rem', borderRadius: '4px', fontWeight: '500' }}>Reject</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
           <div className="card">
             <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '0.5rem' }}>Voter Directory</h2>
             <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--secondary-color)' }}>
                   <th style={{ padding: '0.5rem' }}>ID</th>
                   <th style={{ padding: '0.5rem' }}>Name</th>
                   <th style={{ padding: '0.5rem' }}>Email</th>
                   <th style={{ padding: '0.5rem' }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {allUsers.voters.map(v => (
                   <tr key={v.voter_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '0.5rem' }}>{v.voter_id}</td>
                     <td style={{ padding: '0.5rem' }}>{v.name}</td>
                     <td style={{ padding: '0.5rem' }}>{v.email}</td>
                     <td style={{ padding: '0.5rem', fontWeight: 600, color: v.approval_status === 'Approved' ? 'var(--success-color)' : v.approval_status === 'Pending' ? '#ca8a04' : 'var(--danger-color)' }}>
                        {v.approval_status}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
           
           <div className="card">
             <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--secondary-color)', paddingBottom: '0.5rem' }}>Candidate Directory</h2>
             <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--secondary-color)' }}>
                   <th style={{ padding: '0.5rem' }}>ID</th>
                   <th style={{ padding: '0.5rem' }}>Name</th>
                   <th style={{ padding: '0.5rem' }}>Email</th>
                   <th style={{ padding: '0.5rem' }}>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {allUsers.candidates.map(c => (
                   <tr key={c.candidate_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                     <td style={{ padding: '0.5rem' }}>{c.candidate_id}</td>
                     <td style={{ padding: '0.5rem' }}>{c.name}</td>
                     <td style={{ padding: '0.5rem' }}>{c.email}</td>
                     <td style={{ padding: '0.5rem', fontWeight: 600, color: c.approval_status === 'Approved' ? 'var(--success-color)' : c.approval_status === 'Pending' ? '#ca8a04' : 'var(--danger-color)' }}>
                        {c.approval_status}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {activeTab === 'ELECTIONS' && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Active Elections Board</h2>
          {elections.map((el) => (
             <div key={el.election_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--secondary-color)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
               <div>
                 <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{el.name}</h3>
                 <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>From: {el.start_date} to {el.end_date}</span>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <select 
                   value={el.status} 
                   onChange={(e) => handleElectionStatusUpdate(el.election_id, e.target.value)}
                   style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--secondary-color)', fontWeight: '600' }}
                 >
                   <option value="Upcoming">Upcoming</option>
                   <option value="Ongoing">Ongoing</option>
                   <option value="Completed">Completed</option>
                 </select>
               </div>
             </div>
           ))}
        </div>
      )}

      {activeTab === 'RESULTS' && <Dashboard />}
    </div>
  );
}

export default AdminDashboard;
