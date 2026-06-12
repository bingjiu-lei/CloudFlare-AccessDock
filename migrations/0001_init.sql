CREATE TABLE IF NOT EXISTS rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host TEXT NOT NULL,
  path_pattern TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'password',
  password_hash TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rules_enabled_host ON rules(enabled, host);

CREATE TABLE IF NOT EXISTS access_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code_hash TEXT NOT NULL UNIQUE,
  rule_id INTEGER NOT NULL,
  session_seconds INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY(rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_codes_rule ON access_codes(rule_id);
CREATE INDEX IF NOT EXISTS idx_codes_expires ON access_codes(expires_at);

CREATE TABLE IF NOT EXISTS one_time_grants (
  id TEXT PRIMARY KEY,
  rule_id INTEGER NOT NULL,
  host TEXT NOT NULL,
  path_pattern TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_grants_expires ON one_time_grants(expires_at);
