CREATE TABLE IF NOT EXISTS ai_connection_context (
  id TEXT PRIMARY KEY,
  connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL CHECK (context_type IN (
    'schema_summary','business_rule','naming_convention',
    'relationship_note','user_correction','custom'
  )),
  content TEXT NOT NULL,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schema_cache (
  connection_id TEXT PRIMARY KEY REFERENCES connections(id) ON DELETE CASCADE,
  schema_json TEXT NOT NULL,
  cached_at TEXT NOT NULL DEFAULT (datetime('now'))
);
