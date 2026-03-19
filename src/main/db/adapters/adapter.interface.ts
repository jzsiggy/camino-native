import type { QueryResult } from '@shared/types/query'
import type { DatabaseSchema, ColumnDetail } from '@shared/types/schema'

export interface DatabaseAdapter {
  /** Test the connection */
  testConnection(): Promise<{ success: boolean; message: string; latency_ms?: number }>

  /** Connect to the database */
  connect(): Promise<void>

  /** Disconnect from the database */
  disconnect(): Promise<void>

  /** Execute a SQL query */
  execute(sql: string, maxRows?: number): Promise<QueryResult>

  /** Get list of databases (where applicable) */
  getDatabases(): Promise<string[]>

  /** Get list of schemas */
  getSchemas(database?: string): Promise<string[]>

  /** Get list of tables in a schema */
  getTables(schema?: string): Promise<{ name: string; type: 'table' | 'view' }[]>

  /** Get column details for a table */
  getColumns(table: string, schema?: string): Promise<ColumnDetail[]>

  /** Get full schema introspection */
  getFullSchema(): Promise<DatabaseSchema>

  /** Check if connected */
  isConnected(): boolean
}
