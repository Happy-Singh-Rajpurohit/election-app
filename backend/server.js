const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Get metadata (constituencies, parties, elections) for registration
app.get('/api/meta', (req, res) => {
  const meta = {};
  db.all("SELECT * FROM Constituency", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    meta.constituencies = rows;
    db.all("SELECT * FROM PoliticalParty", [], (err, rows) => {
      meta.parties = rows;
      db.all("SELECT * FROM Election", [], (err, rows) => {
        meta.elections = rows;
        res.json(meta);
      });
    });
  });
});

// Registration
app.post('/api/register', (req, res) => {
  const { role, name, email, password, constituency_id, party_id, election_id } = req.body;
  if (!name || !email || !password || !constituency_id) return res.status(400).json({ error: "Missing common fields" });

  if (role === 'VOTER') {
    db.run("INSERT INTO Voter (name, email, password_hash, constituency_id, approval_status) VALUES (?, ?, ?, ?, 'Pending')",
      [name, email, password, constituency_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Registered successfully! Pending admin approval." });
      });
  } else if (role === 'CANDIDATE') {
    if (!party_id || !election_id) return res.status(400).json({ error: "Missing candidate specific fields" });
    db.run("INSERT INTO Candidate (name, email, password_hash, party_id, election_id, constituency_id, approval_status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')",
      [name, email, password, party_id, election_id, constituency_id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Registered successfully! Pending admin approval." });
      });
  } else {
    res.status(400).json({ error: "Invalid role specified" });
  }
});

// Authentication
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Check Admin
  db.get("SELECT * FROM ElectionOfficer WHERE email = ? AND password_hash = ?", [email, password], (err, admin) => {
    if (admin) return res.json({ id: admin.officer_id, role: 'ADMIN', name: admin.name, email: admin.email, approval_status: 'Approved' });
    
    // Check Voter
    db.get("SELECT * FROM Voter WHERE email = ? AND password_hash = ?", [email, password], (err, voter) => {
      if (voter) return res.json({ id: voter.voter_id, role: 'VOTER', name: voter.name, email: voter.email, constituency_id: voter.constituency_id, approval_status: voter.approval_status, rejection_reason: voter.rejection_reason });
      
      // Check Candidate
      db.get("SELECT * FROM Candidate WHERE email = ? AND password_hash = ?", [email, password], (err, candidate) => {
        if (candidate) return res.json({ id: candidate.candidate_id, role: 'CANDIDATE', name: candidate.name, email: candidate.email, constituency_id: candidate.constituency_id, approval_status: candidate.approval_status, rejection_reason: candidate.rejection_reason });
        
        return res.status(401).json({ error: "Invalid credentials" });
      });
    });
  });
});

// Get User Profile details (for refreshing stale sessions)
app.get('/api/user/:role/:id', (req, res) => {
  const { role, id } = req.params;
  const table = role === 'VOTER' ? 'Voter' : 'Candidate';
  const pk = role === 'VOTER' ? 'voter_id' : 'candidate_id';
  db.get(`SELECT * FROM ${table} WHERE ${pk} = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });
    
    res.json({ 
      id: row[pk], 
      role: role, 
      name: row.name, 
      email: row.email, 
      constituency_id: row.constituency_id, 
      approval_status: row.approval_status, 
      rejection_reason: row.rejection_reason 
    });
  });
});

// Resubmit application
app.put('/api/user/resubmit', (req, res) => {
  const { role, id, name, email, constituency_id } = req.body;
  const table = role === 'VOTER' ? 'Voter' : 'Candidate';
  const pk = role === 'VOTER' ? 'voter_id' : 'candidate_id';

  db.run(`UPDATE ${table} SET name = ?, email = ?, constituency_id = ?, approval_status = 'Pending', rejection_reason = NULL WHERE ${pk} = ?`, 
    [name, email, constituency_id, id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Resubmission sent. Pending approval." });
  });
});

// Admin endpoints
app.get('/api/admin/pending', (req, res) => {
  const pending = { voters: [], candidates: [] };
  db.all("SELECT * FROM Voter WHERE approval_status = 'Pending'", [], (err, v) => {
    pending.voters = v;
    db.all("SELECT * FROM Candidate WHERE approval_status = 'Pending'", [], (err, c) => {
      pending.candidates = c;
      res.json(pending);
    });
  });
});

// Fetch all users
app.get('/api/admin/users', (req, res) => {
  const users = { voters: [], candidates: [] };
  db.all("SELECT * FROM Voter", [], (err, v) => {
    users.voters = v;
    db.all("SELECT * FROM Candidate", [], (err, c) => {
      users.candidates = c;
      res.json(users);
    });
  });
});

app.post('/api/admin/approve', (req, res) => {
  const { id, role, db_status, rejection_reason } = req.body;
  const table = role === 'VOTER' ? 'Voter' : 'Candidate';
  const pk = role === 'VOTER' ? 'voter_id' : 'candidate_id';

  db.run(`UPDATE ${table} SET approval_status = ?, rejection_reason = ? WHERE ${pk} = ?`, [db_status, rejection_reason || null, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Status updated successfully" });
  });
});

// Change Election Status
app.put('/api/admin/elections/:id/status', (req, res) => {
  const { status } = req.body;
  db.run("UPDATE Election SET status = ? WHERE election_id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Election status updated." });
  });
});

// Get all elections
app.get('/api/elections', (req, res) => {
  db.all("SELECT * FROM Election", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get candidates for an election filtered by constituency
app.get('/api/candidates/:election_id/:constituency_id', (req, res) => {
  const sql = `
    SELECT c.candidate_id, c.name AS candidate_name, p.party_name, co.name AS constituency_name 
    FROM Candidate c
    JOIN PoliticalParty p ON c.party_id = p.party_id
    JOIN Constituency co ON c.constituency_id = co.constituency_id
    WHERE c.election_id = ? AND c.constituency_id = ? AND c.approval_status = 'Approved'
  `;
  db.all(sql, [req.params.election_id, req.params.constituency_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Cast Vote
app.post('/api/vote', (req, res) => {
  const { voter_id, candidate_id, election_id } = req.body;
  
  // Validate voter is approved
  db.get("SELECT approval_status FROM Voter WHERE voter_id = ?", [voter_id], (err, row) => {
    if (!row || row.approval_status !== 'Approved') return res.status(403).json({ error: "Only approved voters can vote." });

    db.run(`INSERT INTO Vote (voter_id, candidate_id, election_id) VALUES (?, ?, ?)`, 
      [voter_id, candidate_id, election_id], 
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: "You have already voted in this election." });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Vote cast successfully!", vote_id: this.lastID });
      });
  });
});

// Results calculation
app.get('/api/results/:election_id', (req, res) => {
  const sql = `
    SELECT c.name as candidate_name, p.party_name, COUNT(v.vote_id) as vote_count
    FROM Candidate c
    LEFT JOIN Vote v ON c.candidate_id = v.candidate_id
    JOIN PoliticalParty p ON c.party_id = p.party_id
    WHERE c.election_id = ? AND c.approval_status = 'Approved'
    GROUP BY c.candidate_id
    ORDER BY vote_count DESC
  `;
  db.all(sql, [req.params.election_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
