import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function VotePage({ user }) {
  const { election_id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'VOTER' || user.approval_status !== 'Approved') {
      navigate('/login');
      return;
    }

    // Fetch candidates filtered by the voter's constituency
    fetch(`http://localhost:3000/api/candidates/${election_id}/${user.constituency_id}`)
      .then(res => res.json())
      .then(data => {
        setCandidates(data);
        setLoading(false);
      });
  }, [election_id, user, navigate]);

  const handleCastVote = () => {
    if (!selectedCandidate) return;
    setError(null);

    fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voter_id: user.id,
        candidate_id: selectedCandidate,
        election_id: parseInt(election_id)
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setSuccess("Vote cast successfully!");
        setTimeout(() => navigate('/profile'), 2000);
      })
      .catch(err => setError(err.message));
  };

  if (loading) return <div className="spinner"></div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="page-header">
        <h1>Cast Your Vote</h1>
        <p>Your vote matters. You are securely authenticated as {user?.name}.</p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Constituency #{user?.constituency_id} Candidates</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Select your preferred candidate for this election.</p>

        {candidates.length === 0 ? (
          <div className="alert alert-danger" style={{ marginBottom: 0 }}>
             There are no approved candidates running in your constituency yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {candidates.map(candidate => (
              <label 
                key={candidate.candidate_id} 
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  border: `2px solid ${selectedCandidate === candidate.candidate_id ? 'var(--primary-color)' : 'var(--secondary-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'border-color var(--transition-fast)'
                }}
              >
                <input 
                  type="radio" 
                  name="candidate" 
                  value={candidate.candidate_id} 
                  checked={selectedCandidate === candidate.candidate_id}
                  onChange={() => setSelectedCandidate(candidate.candidate_id)}
                  style={{ marginRight: '1rem' }}
                />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{candidate.candidate_name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{candidate.party_name} - {candidate.constituency_name}</div>
                </div>
              </label>
            ))}
          </div>
        )}

        {candidates.length > 0 && (
          <button 
            onClick={handleCastVote} 
            disabled={!selectedCandidate || success}
            className="btn-primary" 
            style={{ width: '100%', marginTop: '2rem', opacity: (!selectedCandidate || success) ? 0.5 : 1 }}
          >
            Confirm & Cast Vote
          </button>
        )}
      </div>
    </div>
  );
}

export default VotePage;
