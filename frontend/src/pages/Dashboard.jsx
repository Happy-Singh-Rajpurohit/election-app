import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [elections, setElections] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/elections')
      .then(res => res.json())
      .then(async (data) => {
        setElections(data);
        const resData = {};
        for (const election of data) {
          const res = await fetch(`http://localhost:3000/api/results/${election.election_id}`);
          resData[election.election_id] = await res.json();
        }
        setResults(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Election Officer Dashboard</h1>
        <p>Monitor ongoing elections, view candidates, and analyze live voting results.</p>
      </div>

      {elections.map(election => (
        <div key={election.election_id} className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--primary-color)' }}>{election.name}</h2>
            <span style={{
              background: election.status === 'Ongoing' ? '#dcfce7' : '#fef9c3',
              color: election.status === 'Ongoing' ? '#166534' : '#854d0e',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {election.status}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {election.start_date} to {election.end_date}
          </p>

          <div className="grid-cards" style={{ marginTop: '0' }}>
            {results[election.election_id]?.map((candidate, idx) => (
              <div key={idx} className="card" style={{ padding: '1rem', background: '#f8fafc', border: '1px solid var(--secondary-color)', boxShadow: 'none' }}>
                <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>{candidate.candidate_name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>{candidate.party_name}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.25rem', color: 'var(--primary-hover)' }}>{candidate.vote_count} Votes</span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--secondary-color)', paddingTop: '1rem' }}>
             <Link to={`/vote/${election.election_id}`} className="btn-primary" style={{ display: 'inline-block' }}>Cast Vote Here</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
