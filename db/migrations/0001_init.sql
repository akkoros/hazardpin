-- D1 schema
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  displayName   TEXT,
  avatarUrl     TEXT,
  tier          TEXT NOT NULL DEFAULT 'COMMUNITY' CHECK (tier IN ('COMMUNITY','TRUSTED','VERIFIED')),
  role          TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','MODERATOR','ADMIN')),
  reportsSubmitted INTEGER NOT NULL DEFAULT 0,
  reportsVerified  INTEGER NOT NULL DEFAULT 0,
  reporterScore    REAL NOT NULL DEFAULT 0.0,
  reviewsGiven     INTEGER NOT NULL DEFAULT 0,
  reviewsCorrect   INTEGER NOT NULL DEFAULT 0,
  reviewerScore    REAL NOT NULL DEFAULT 0.0,
  createdAt        INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt        INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS hazard_reports (
  id            TEXT PRIMARY KEY,
  reporterId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('POTHOLE','DEBRIS','FLOODING','FALLEN_SIGNAGE','ROAD_CRACK','OTHER')),
  severity      TEXT NOT NULL CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  description   TEXT,
  latitude      REAL NOT NULL,
  longitude     REAL NOT NULL,
  address       TEXT,
  status        TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','UNDER_REVIEW','VERIFIED','RESOLVED','ARCHIVED')),
  upvotes       INTEGER NOT NULL DEFAULT 0,
  downvotes     INTEGER NOT NULL DEFAULT 0,
  verificationScore REAL NOT NULL DEFAULT 0.0,
  resolvedAt    INTEGER,
  resolvedBy    TEXT,
  createdAt     INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt     INTEGER NOT NULL DEFAULT (unixepoch()),
  geohash       TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_latlng  ON hazard_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_reports_status  ON hazard_reports(status, createdAt);
CREATE INDEX IF NOT EXISTS idx_reports_geo     ON hazard_reports(geohash);

CREATE TABLE IF NOT EXISTS report_images (
  id        TEXT PRIMARY KEY,
  reportId  TEXT NOT NULL REFERENCES hazard_reports(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  r2Key     TEXT NOT NULL,
  orderIdx  INTEGER NOT NULL DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS reviews (
  id          TEXT PRIMARY KEY,
  reportId    TEXT NOT NULL REFERENCES hazard_reports(id) ON DELETE CASCADE,
  reviewerId  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote        TEXT NOT NULL CHECK (vote IN ('UP','DOWN')),
  comment     TEXT,
  weight      REAL NOT NULL DEFAULT 1.0,
  createdAt   INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (reportId, reviewerId)
);

CREATE TABLE IF NOT EXISTS community_notes (
  id          TEXT PRIMARY KEY,
  reportId    TEXT NOT NULL REFERENCES hazard_reports(id) ON DELETE CASCADE,
  authorId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  upvotes     INTEGER NOT NULL DEFAULT 0,
  downvotes   INTEGER NOT NULL DEFAULT 0,
  consensus   INTEGER NOT NULL DEFAULT 0,
  createdAt   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('TOP_REPORTER','TOP_REVIEWER')),
  period      TEXT NOT NULL CHECK (period IN ('WEEK','MONTH','ALL_TIME')),
  payload     TEXT NOT NULL,
  generatedAt INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (type, period)
);
