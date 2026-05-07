
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_audit_vote_insert';
EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_election_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_constituency_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_voter_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_party_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_candidate_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_vote_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_officer_id';
  EXECUTE IMMEDIATE 'DROP TRIGGER trg_audit_id';
EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE AuditLog CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE Vote CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE Candidate CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE Voter CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE PoliticalParty CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE ElectionOfficer CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE Constituency CASCADE CONSTRAINTS';
  EXECUTE IMMEDIATE 'DROP TABLE Election CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_election';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_constituency';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_voter';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_party';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_candidate';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_vote';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_officer';
  EXECUTE IMMEDIATE 'DROP SEQUENCE seq_audit';
EXCEPTION WHEN OTHERS THEN NULL; END;
/

// -- -----------------------------
// -- TABLES
  
CREATE TABLE Election (
  election_id   NUMBER PRIMARY KEY,
  name          VARCHAR2(100) NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  status        VARCHAR2(20) NOT NULL
    CHECK (status IN ('Upcoming','Ongoing','Completed'))
);

CREATE TABLE Constituency (
  constituency_id NUMBER PRIMARY KEY,
  name            VARCHAR2(100) NOT NULL UNIQUE
);

CREATE TABLE PoliticalParty (
  party_id   NUMBER PRIMARY KEY,
  party_name VARCHAR2(100) NOT NULL UNIQUE
);

CREATE TABLE Voter (
  voter_id          NUMBER PRIMARY KEY,
  name              VARCHAR2(100) NOT NULL,
  email             VARCHAR2(100) NOT NULL UNIQUE,
  password_hash     VARCHAR2(255) NOT NULL,
  constituency_id   NUMBER NOT NULL,
  approval_status   VARCHAR2(20) DEFAULT 'Pending'
    CHECK (approval_status IN ('Pending','Approved','Rejected')),
  rejection_reason  VARCHAR2(255),
  CONSTRAINT fk_voter_const
    FOREIGN KEY (constituency_id) REFERENCES Constituency(constituency_id)
);

CREATE TABLE Candidate (
  candidate_id      NUMBER PRIMARY KEY,
  name              VARCHAR2(100) NOT NULL,
  email             VARCHAR2(100) NOT NULL UNIQUE,
  password_hash     VARCHAR2(255) NOT NULL,
  party_id          NUMBER NOT NULL,
  election_id       NUMBER NOT NULL,
  constituency_id   NUMBER NOT NULL,
  approval_status   VARCHAR2(20) DEFAULT 'Pending'
    CHECK (approval_status IN ('Pending','Approved','Rejected')),
  rejection_reason  VARCHAR2(255),
  CONSTRAINT fk_cand_party FOREIGN KEY (party_id)
    REFERENCES PoliticalParty(party_id),
  CONSTRAINT fk_cand_elec FOREIGN KEY (election_id)
    REFERENCES Election(election_id),
  CONSTRAINT fk_cand_const FOREIGN KEY (constituency_id)
    REFERENCES Constituency(constituency_id)
);

CREATE TABLE Vote (
  vote_id      NUMBER PRIMARY KEY,
  voter_id     NUMBER NOT NULL,
  candidate_id NUMBER NOT NULL,
  election_id  NUMBER NOT NULL,
  vote_time    TIMESTAMP DEFAULT SYSTIMESTAMP,
  CONSTRAINT uq_vote UNIQUE (voter_id, election_id),
  CONSTRAINT fk_vote_voter FOREIGN KEY (voter_id)
    REFERENCES Voter(voter_id),
  CONSTRAINT fk_vote_cand FOREIGN KEY (candidate_id)
    REFERENCES Candidate(candidate_id),
  CONSTRAINT fk_vote_elec FOREIGN KEY (election_id)
    REFERENCES Election(election_id)
);

CREATE TABLE ElectionOfficer (
  officer_id   NUMBER PRIMARY KEY,
  name         VARCHAR2(100) NOT NULL,
  email        VARCHAR2(100) NOT NULL UNIQUE,
  password_hash VARCHAR2(255) NOT NULL,
  role         VARCHAR2(50) NOT NULL
);

CREATE TABLE AuditLog (
  log_id    NUMBER PRIMARY KEY,
  user_id   NUMBER NOT NULL,
  action    VARCHAR2(255) NOT NULL,
  ts        TIMESTAMP DEFAULT SYSTIMESTAMP
);

// -- -----------------------------
// -- SEQUENCES

CREATE SEQUENCE seq_election START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_constituency START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_voter START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_party START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_candidate START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_vote START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_officer START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit START WITH 1 INCREMENT BY 1;

// -- -----------------------------
// -- AUTO-ID TRIGGERS

CREATE OR REPLACE TRIGGER trg_election_id
BEFORE INSERT ON Election FOR EACH ROW
BEGIN
  IF :NEW.election_id IS NULL THEN
    SELECT seq_election.NEXTVAL INTO :NEW.election_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_constituency_id
BEFORE INSERT ON Constituency FOR EACH ROW
BEGIN
  IF :NEW.constituency_id IS NULL THEN
    SELECT seq_constituency.NEXTVAL INTO :NEW.constituency_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_voter_id
BEFORE INSERT ON Voter FOR EACH ROW
BEGIN
  IF :NEW.voter_id IS NULL THEN
    SELECT seq_voter.NEXTVAL INTO :NEW.voter_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_party_id
BEFORE INSERT ON PoliticalParty FOR EACH ROW
BEGIN
  IF :NEW.party_id IS NULL THEN
    SELECT seq_party.NEXTVAL INTO :NEW.party_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_candidate_id
BEFORE INSERT ON Candidate FOR EACH ROW
BEGIN
  IF :NEW.candidate_id IS NULL THEN
    SELECT seq_candidate.NEXTVAL INTO :NEW.candidate_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_vote_id
BEFORE INSERT ON Vote FOR EACH ROW
BEGIN
  IF :NEW.vote_id IS NULL THEN
    SELECT seq_vote.NEXTVAL INTO :NEW.vote_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_officer_id
BEFORE INSERT ON ElectionOfficer FOR EACH ROW
BEGIN
  IF :NEW.officer_id IS NULL THEN
    SELECT seq_officer.NEXTVAL INTO :NEW.officer_id FROM dual;
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_audit_id
BEFORE INSERT ON AuditLog FOR EACH ROW
BEGIN
  IF :NEW.log_id IS NULL THEN
    SELECT seq_audit.NEXTVAL INTO :NEW.log_id FROM dual;
  END IF;
END;
/

// -- -----------------------------
// -- AUDIT TRIGGER (KEY FEATURE)

CREATE OR REPLACE TRIGGER trg_audit_vote_insert
AFTER INSERT ON Vote
FOR EACH ROW
BEGIN
  INSERT INTO AuditLog (log_id, user_id, action, ts)
  VALUES (
    seq_audit.NEXTVAL,
    :NEW.voter_id,
    'Casted vote for candidate ' || :NEW.candidate_id ||
    ' in election ' || :NEW.election_id,
    SYSTIMESTAMP
  );
END;
/

// -- -----------------------------
// -- PROCEDURE: CAST VOTE

CREATE OR REPLACE PROCEDURE cast_vote (
  p_voter_id     IN NUMBER,
  p_candidate_id IN NUMBER,
  p_election_id  IN NUMBER
)
IS
  v_cnt NUMBER;
  v_status VARCHAR2(20);
BEGIN
  -- Check voter approval
  SELECT approval_status INTO v_status
  FROM Voter WHERE voter_id = p_voter_id;

  IF v_status <> 'Approved' THEN
    RAISE_APPLICATION_ERROR(-20002, 'Voter not approved');
  END IF;

  -- Check election status
  SELECT status INTO v_status
  FROM Election WHERE election_id = p_election_id;

  IF v_status <> 'Ongoing' THEN
    RAISE_APPLICATION_ERROR(-20003, 'Election not ongoing');
  END IF;

  -- Check duplicate vote
  SELECT COUNT(*) INTO v_cnt
  FROM Vote
  WHERE voter_id = p_voter_id AND election_id = p_election_id;

  IF v_cnt > 0 THEN
    RAISE_APPLICATION_ERROR(-20001, 'Already voted');
  END IF;

  -- Insert vote
  INSERT INTO Vote (voter_id, candidate_id, election_id)
  VALUES (p_voter_id, p_candidate_id, p_election_id);

  COMMIT;

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
END;
/

// -- -----------------------------
// -- SAMPLE DATA

INSERT INTO Election (name, start_date, end_date, status)
VALUES ('General Election 2025', DATE '2025-11-01', DATE '2025-11-30', 'Ongoing');

INSERT INTO Constituency (name) VALUES ('North Delhi');
INSERT INTO Constituency (name) VALUES ('South Mumbai');

INSERT INTO PoliticalParty (party_name) VALUES ('Progressive Alliance');
INSERT INTO PoliticalParty (party_name) VALUES ('National Unity Party');

INSERT INTO Voter (name, email, password_hash, constituency_id, approval_status)
VALUES ('Ravi Kumar', 'ravi@mail.com', 'hash123', 1, 'Approved');

INSERT INTO Candidate (name, email, password_hash, party_id, election_id, constituency_id, approval_status)
VALUES ('Amit Sharma', 'amit@mail.com', 'hash456', 1, 1, 1, 'Approved');

COMMIT;

// -- -----------------------------
// -- TEST CALL

BEGIN
  cast_vote(1, 1, 1);
END;
/

// -- -----------------------------
// -- RESULT QUERY

SELECT c.name AS candidate, COUNT(v.vote_id) AS votes
FROM Vote v
JOIN Candidate c ON v.candidate_id = c.candidate_id
GROUP BY c.name
ORDER BY votes DESC;

// -- -----------------------------
// -- AUDIT LOG VIEW

SELECT * FROM AuditLog ORDER BY ts DESC;

// -- =============================
// -- END OF SCRIPT
// -- =============================
