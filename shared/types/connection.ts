export type DatabaseEngine = 'postgres' | 'mysql' | 'sqlite'

export interface ConnectionConfig {
  id: string
  name: string
  engine: DatabaseEngine
  host?: string
  port?: number
  database_name?: string
  username?: string
  password?: string // Plain text in memory, encrypted at rest
  ssl_enabled?: boolean
  file_path?: string // For SQLite
  extra_params?: string // JSON
  ai_wizard_completed?: boolean
  created_at: string
  updated_at: string
}

export interface ConnectionCreateInput {
  name: string
  engine: DatabaseEngine
  host?: string
  port?: number
  database_name?: string
  username?: string
  password?: string
  ssl_enabled?: boolean
  file_path?: string
  extra_params?: string
}

export interface ConnectionUpdateInput extends Partial<ConnectionCreateInput> {
  id: string
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  latency_ms?: number
}
