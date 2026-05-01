import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [role, setRole] = useState('VOTER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [constituency, setConstituency] = useState('');
  const [party, setParty] = useState('');
  const [election, setElection] = useState('');

  const [meta, setMeta] = useState({ constituencies: [], parties: [], elections: [] });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3000/api/meta')
      .then(res => res.json())
      .then(data => {
        setMeta(data);
        if (data.constituencies.length > 0) setConstituency(data.constituencies[0].constituency_id);
        if (data.parties.length > 0) setParty(data.parties[0].party_id);
        if (data.elections.length > 0) setElection(data.elections[0].election_id);
      });
  }, []);

  const handleRegister = (e) => {
    e.preventDefault();
    setError(null);

    const payload = { role, name, email, password, constituency_id: constituency };
    if (role === 'CANDIDATE') {
      payload.party_id = party;
      payload.election_id = election;
    }

    fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess(data.message);
        setTimeout(() => navigate('/login'), 2000);
      })
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto' }}>
      <div className="card">
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Create an Account</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Join the system. Pending admin approval.
        </p>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            type="button" 
            className={`btn-primary`} 
            style={{ flex: 1, backgroundColor: role === 'VOTER' ? 'var(--primary-color)' : 'var(--secondary-color)', color: role === 'VOTER' ? 'white' : 'var(--text-primary)', boxShadow: 'none' }}
            onClick={() => setRole('VOTER')}
          >
            Voter
          </button>
          <button 
            type="button" 
            className={`btn-primary`} 
            style={{ flex: 1, backgroundColor: role === 'CANDIDATE' ? 'var(--primary-color)' : 'var(--secondary-color)', color: role === 'CANDIDATE' ? 'white' : 'var(--text-primary)', boxShadow: 'none' }}
            onClick={() => setRole('CANDIDATE')}
          >
            Candidate
          </button>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Constituency</label>
            <select value={constituency} onChange={e => setConstituency(e.target.value)}>
              {meta.constituencies.map(c => <option key={c.constituency_id} value={c.constituency_id}>{c.name}</option>)}
            </select>
          </div>

          {role === 'CANDIDATE' && (
            <>
              <div className="form-group">
                <label>Political Party</label>
                <select value={party} onChange={e => setParty(e.target.value)}>
                  {meta.parties.map(p => <option key={p.party_id} value={p.party_id}>{p.party_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Participating Election</label>
                <select value={election} onChange={e => setElection(e.target.value)}>
                  {meta.elections.map(el => <option key={el.election_id} value={el.election_id}>{el.name}</option>)}
                </select>
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={success}>
            Register as {role === 'VOTER' ? 'Voter' : 'Candidate'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
