import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

import Dashboard from './pages/Dashboard';
import VotePage from './pages/VotePage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProfilePage from './pages/ProfilePage';

function Navbar({ user, setUser }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="nav-brand" style={{ textDecoration: 'none', color: 'var(--primary-color)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          Election Management
        </Link>
        <div className="nav-links">
          {user ? (
            <>
              {user.role === 'ADMIN' && <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Admin Dashboard</Link>}
              {(user.role === 'VOTER' || user.role === 'CANDIDATE') && <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>My Profile</Link>}
              <button onClick={handleLogout} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);

      // Defeat token caching by actively querying the user profile across refreshes
      if (parsedUser.role !== 'ADMIN') {
        fetch(`http://localhost:3000/api/user/${parsedUser.role}/${parsedUser.id}`)
          .then(res => {
            if (res.ok) return res.json();
            throw new Error();
          })
          .then(freshUser => {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          })
          .catch(() => {
            // Invalid session
            localStorage.removeItem('user');
            setUser(null);
          });
      }
    }
  }, []);

  return (
    <>
      <Navbar user={user} setUser={setUser} />
      <main className="container" style={{ minHeight: '80vh', paddingBottom: '2rem' }}>
        <Routes>
          <Route path="/" element={user ? (user.role === 'ADMIN' ? <AdminDashboard /> : <ProfilePage user={user} setUser={setUser} />) : <Dashboard />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
          <Route path="/vote/:election_id" element={<VotePage user={user} />} />
        </Routes>
      </main>
      <footer style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)', borderTop: '1px solid var(--secondary-color)' }}>
        <p>&copy; 2026 Online Election Management System. All rights reserved.</p>
      </footer>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
