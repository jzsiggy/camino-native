import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: '001_initial.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        engine TEXT NOT NULL CHECK (engine IN ('postgres','mysql','sqlite')),
        host TEXT,
        port INTEGER,
        database_name TEXT,
        username TEXT,
        password_enc BLOB,
        ssl_enabled INTEGER DEFAULT 0,
        file_path TEXT,
        extra_params TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE,
        title TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
        content TEXT NOT NULL,
        sql_generated TEXT,
        token_count INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `
  },
  {
    name: '002_ai_context.sql',
    sql: `
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
    `
  },
  {
    name: '003_scripts.sql',
    sql: `
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Untitled',
        content TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      ALTER TABLE messages ADD COLUMN sql_results TEXT;
    `
  },
  {
    name: '004_chart_config.sql',
    sql: `
      ALTER TABLE messages ADD COLUMN chart_config TEXT;
    `
  },
  {
    name: '005_context_metadata.sql',
    sql: `
      ALTER TABLE ai_connection_context ADD COLUMN metadata TEXT;
    `
  },
  {
    name: '006_ai_wizard_completed.sql',
    sql: `
      ALTER TABLE connections ADD COLUMN ai_wizard_completed INTEGER DEFAULT 0;
    `
  }
]

export function getAppDb(): Database.Database {
  if (db) return db

  const dbPath = join(app.getPath('userData'), 'camino.db')
  db = new Database(dbPath)

  // Enable WAL mode and foreign keys
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  runMigrations(db)
  return db
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const applied = new Set(
    database
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((row: { name: string }) => row.name)
  )

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue
    database.exec(migration.sql)
    database.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name)
  }
}

export function closeAppDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
