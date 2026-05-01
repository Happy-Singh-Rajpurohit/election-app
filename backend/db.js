const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'election.sqlite');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  // Election Table
  db.run(`CREATE TABLE IF NOT EXISTS Election (
    election_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Upcoming', 'Ongoing', 'Completed'))
  )`);

  // Constituency Table
  db.run(`CREATE TABLE IF NOT EXISTS Constituency (
    constituency_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
  )`);

  // Voter Table - includes approval_status
  db.run(`CREATE TABLE IF NOT EXISTS Voter (
    voter_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    constituency_id INTEGER NOT NULL,
    approval_status TEXT DEFAULT 'Pending' CHECK(approval_status IN ('Pending', 'Approved', 'Rejected')),
    rejection_reason TEXT,
    FOREIGN KEY(constituency_id) REFERENCES Constituency(constituency_id)
  )`);

  // Political Party Table
  db.run(`CREATE TABLE IF NOT EXISTS PoliticalParty (
    party_id INTEGER PRIMARY KEY AUTOINCREMENT,
    party_name TEXT NOT NULL UNIQUE
  )`);

  // Candidate Table - includes approval_status
  db.run(`CREATE TABLE IF NOT EXISTS Candidate (
    candidate_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    party_id INTEGER NOT NULL,
    election_id INTEGER NOT NULL,
    constituency_id INTEGER NOT NULL,
    approval_status TEXT DEFAULT 'Pending' CHECK(approval_status IN ('Pending', 'Approved', 'Rejected')),
    rejection_reason TEXT,
    FOREIGN KEY(party_id) REFERENCES PoliticalParty(party_id),
    FOREIGN KEY(election_id) REFERENCES Election(election_id),
    FOREIGN KEY(constituency_id) REFERENCES Constituency(constituency_id)
  )`);

  // Vote Table - UNIQUE constraint ensures one vote per voter per election
  db.run(`CREATE TABLE IF NOT EXISTS Vote (
    vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
    voter_id INTEGER NOT NULL,
    candidate_id INTEGER NOT NULL,
    election_id INTEGER NOT NULL,
    vote_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(voter_id, election_id),
    FOREIGN KEY(voter_id) REFERENCES Voter(voter_id),
    FOREIGN KEY(candidate_id) REFERENCES Candidate(candidate_id),
    FOREIGN KEY(election_id) REFERENCES Election(election_id)
  )`);

  // Election Officer / Admin Table
  db.run(`CREATE TABLE IF NOT EXISTS ElectionOfficer (
    officer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL
  )`);

  // Audit Log Table
  db.run(`CREATE TABLE IF NOT EXISTS AuditLog (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Trigger to populate AuditLog on vote insertion
  db.run(`
    CREATE TRIGGER IF NOT EXISTS trg_audit_vote_insert
    AFTER INSERT ON Vote
    BEGIN
      INSERT INTO AuditLog (user_id, action) 
      VALUES (NEW.voter_id, 'Casted vote for candidate ' || NEW.candidate_id || ' in election ' || NEW.election_id);
    END;
  `);

});

module.exports = db;
