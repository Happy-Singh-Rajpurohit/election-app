const db = require('./db');

db.serialize(() => {
  console.log("Seeding Database...");

  const elections = [
    { name: "General Election 2026", start_date: "2026-05-01", end_date: "2026-05-02", status: "Ongoing" }
  ];

  const constituencies = [
    { name: "North District" },
    { name: "South District" }
  ];

  const parties = [
    { name: "Progressive Alliance" },
    { name: "Conservative Union" },
    { name: "Independent" }
  ];

  elections.forEach(e => db.run("INSERT OR IGNORE INTO Election (name, start_date, end_date, status) VALUES (?, ?, ?, ?)", [e.name, e.start_date, e.end_date, e.status]));
  constituencies.forEach(c => db.run("INSERT OR IGNORE INTO Constituency (name) VALUES (?)", [c.name]));
  parties.forEach(p => db.run("INSERT OR IGNORE INTO PoliticalParty (party_name) VALUES (?)", [p.name]));

  // Add dummy candidates and voters if empty
  db.get("SELECT COUNT(*) AS count FROM Candidate", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO Candidate (name, email, password_hash, party_id, election_id, constituency_id, approval_status) VALUES ('Alice Smith', 'alice@election.com', 'password123', 1, 1, 1, 'Approved')");
      db.run("INSERT INTO Candidate (name, email, password_hash, party_id, election_id, constituency_id, approval_status) VALUES ('Bob Jones', 'bob@election.com', 'password123', 2, 1, 1, 'Approved')");
    }
  });

  db.get("SELECT COUNT(*) AS count FROM Voter", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO Voter (name, email, password_hash, constituency_id, approval_status) VALUES ('John Doe', 'john@example.com', 'password123', 1, 'Approved')");
      db.run("INSERT INTO Voter (name, email, password_hash, constituency_id, approval_status) VALUES ('Jane Doe', 'jane@example.com', 'password123', 2, 'Pending')");
    }
  });

  db.get("SELECT COUNT(*) AS count FROM ElectionOfficer", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO ElectionOfficer (name, email, password_hash, role) VALUES ('Admin Chief', 'admin@election.com', 'admin123', 'SuperAdmin')");
    }
  });

  console.log("Seeding complete.");
});
