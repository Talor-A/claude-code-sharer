-- Migration: Create sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE INDEX idx_created_at ON sessions(created_at);
