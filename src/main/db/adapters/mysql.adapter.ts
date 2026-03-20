import mysql from 'mysql2/promise'
import type { Pool, PoolOptions, PoolConnection } from 'mysql2/promise'
import type { DatabaseAdapter } from './adapter.interface'
import type { QueryResult, ExecuteOptions } from '@shared/types/query'
import type { DatabaseSchema, ColumnDetail } from '@shared/types/schema'
import type { ConnectionConfig } from '@shared/types/connection'
import { addLimitIfNeeded } from './query-utils'

export class MysqlAdapter implements DatabaseAdapter {
  private pool: Pool | null = null
  private config: ConnectionConfig
  private activeQueries = new Map<string, { connection: PoolConnection; threadId: number }>()

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  private getPoolOptions(): PoolOptions {
    return {
      host: this.config.host,
      port: this.config.port || 3306,
      database: this.config.database_name,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl_enabled ? {} : undefined,
      connectionLimit: 5,
      waitForConnections: true
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; latency_ms?: number }> {
    const start = Date.now()
    try {
      const conn = await mysql.createConnection(this.getPoolOptions())
      await conn.query('SELECT 1')
      await conn.end()
      return { success: true, message: 'Connection successful', latency_ms: Date.now() - start }
    } catch (err) {
      return { success: false, message: (err as Error).message }
    }
  }

  async connect(): Promise<void> {
    if (this.pool) return
    this.pool = mysql.createPool(this.getPoolOptions())
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
    }
  }

  isConnected(): boolean {
    return this.pool !== null
  }

  async execute(sql: string, options?: ExecuteOptions): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const start = Date.now()
    const maxRows = options?.maxRows
    const timeoutMs = options?.timeoutMs
    const queryId = options?.queryId

    const connection = await this.pool.getConnection()
    try {
      // Track for cancellation
      if (queryId) {
        this.activeQueries.set(queryId, { connection, threadId: connection.threadId! })
      }

      // Add server-side LIMIT for SELECT queries
      const { sql: limitedSql, limitApplied } = addLimitIfNeeded(sql, maxRows)

      const queryOpts: { sql: string; timeout?: number } = { sql: limitedSql }
      if (timeoutMs) queryOpts.timeout = timeoutMs

      const [rows, fields] = await connection.query(queryOpts)
      const resultRows = Array.isArray(rows) ? rows : []
      let limited = resultRows as Record<string, unknown>[]
      let truncated = false

      if (maxRows && limitApplied && limited.length > maxRows) {
        limited = limited.slice(0, maxRows)
        truncated = true
      }

      const columns = (fields && Array.isArray(fields))
        ? fields.map((f) => ({ name: f.name, dataType: String(f.type) }))
        : []
      return {
        columns,
        rows: limited,
        rowCount: limited.length,
        executionTime: Date.now() - start,
        truncated
      }
    } catch (err) {
      const message = (err as Error).message
      const cancelled = message.includes('KILL') || (err as NodeJS.ErrnoException).code === 'PROTOCOL_SEQUENCE_TIMEOUT'
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - start,
        error: message,
        cancelled
      }
    } finally {
      if (queryId) this.activeQueries.delete(queryId)
      connection.release()
    }
  }

  async cancelQuery(queryId: string): Promise<void> {
    const entry = this.activeQueries.get(queryId)
    if (!entry || !this.pool) return
    const conn = await this.pool.getConnection()
    try {
      await conn.query(`KILL QUERY ${entry.threadId}`)
    } finally {
      conn.release()
    }
  }

  async getDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const [rows] = await this.pool.query('SHOW DATABASES')
    return (rows as { Database: string }[]).map((r) => r.Database)
  }

  async getSchemas(): Promise<string[]> {
    return this.getDatabases()
  }

  async getTables(schema?: string): Promise<{ name: string; type: 'table' | 'view' }[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema || this.config.database_name
    const [rows] = await this.pool.query(
      `SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
      [db]
    )
    return (rows as { TABLE_NAME: string; TABLE_TYPE: string }[]).map((r) => ({
      name: r.TABLE_NAME,
      type: r.TABLE_TYPE === 'VIEW' ? 'view' : 'table'
    }))
  }

  async getColumns(table: string, schema?: string): Promise<ColumnDetail[]> {
    if (!this.pool) throw new Error('Not connected')
    const db = schema || this.config.database_name
    const [rows] = await this.pool.query(
      `SELECT
        c.COLUMN_NAME, c.DATA_TYPE, c.IS_NULLABLE, c.COLUMN_DEFAULT, c.COLUMN_KEY,
        kcu.REFERENCED_TABLE_NAME, kcu.REFERENCED_COLUMN_NAME
       FROM information_schema.COLUMNS c
       LEFT JOIN information_schema.KEY_COLUMN_USAGE kcu
         ON kcu.TABLE_SCHEMA = c.TABLE_SCHEMA
         AND kcu.TABLE_NAME = c.TABLE_NAME
         AND kcu.COLUMN_NAME = c.COLUMN_NAME
         AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
       WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ?
       ORDER BY c.ORDINAL_POSITION`,
      [db, table]
    )
    return (rows as Record<string, string>[]).map((r) => ({
      name: r.COLUMN_NAME,
      dataType: r.DATA_TYPE,
      nullable: r.IS_NULLABLE === 'YES',
      isPrimaryKey: r.COLUMN_KEY === 'PRI',
      isForeignKey: !!r.REFERENCED_TABLE_NAME,
      defaultValue: r.COLUMN_DEFAULT || undefined,
      referencesTable: r.REFERENCED_TABLE_NAME || undefined,
      referencesColumn: r.REFERENCED_COLUMN_NAME || undefined
    }))
  }

  async getFullSchema(): Promise<DatabaseSchema> {
    const tables = await this.getTables()
    const tableInfos = await Promise.all(
      tables.map(async (t) => {
        const columns = await this.getColumns(t.name)
        return { name: t.name, type: t.type, columns }
      })
    )
    return {
      name: this.config.database_name || '',
      schemas: [{ name: this.config.database_name || 'default', tables: tableInfos }]
    }
  }
}
