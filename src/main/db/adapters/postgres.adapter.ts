import { Pool, type PoolConfig } from 'pg'
import type { DatabaseAdapter } from './adapter.interface'
import type { QueryResult } from '@shared/types/query'
import type { DatabaseSchema, ColumnDetail } from '@shared/types/schema'
import type { ConnectionConfig } from '@shared/types/connection'

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool | null = null
  private config: ConnectionConfig

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  private getPoolConfig(): PoolConfig {
    return {
      host: this.config.host,
      port: this.config.port || 5432,
      database: this.config.database_name,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl_enabled ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; latency_ms?: number }> {
    const start = Date.now()
    try {
      const pool = new Pool(this.getPoolConfig())
      const client = await pool.connect()
      await client.query('SELECT 1')
      client.release()
      await pool.end()
      return { success: true, message: 'Connection successful', latency_ms: Date.now() - start }
    } catch (err) {
      return { success: false, message: (err as Error).message }
    }
  }

  async connect(): Promise<void> {
    if (this.pool) return
    this.pool = new Pool(this.getPoolConfig())
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

  async execute(sql: string, maxRows?: number): Promise<QueryResult> {
    if (!this.pool) throw new Error('Not connected')
    const start = Date.now()
    try {
      const result = await this.pool.query(sql)
      const rows = maxRows ? result.rows.slice(0, maxRows) : result.rows
      const columns = (result.fields || []).map((f) => ({
        name: f.name,
        dataType: String(f.dataTypeID)
      }))
      return {
        columns,
        rows,
        rowCount: rows.length,
        affectedRows: result.rowCount ?? undefined,
        executionTime: Date.now() - start
      }
    } catch (err) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: Date.now() - start,
        error: (err as Error).message
      }
    }
  }

  async getDatabases(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname`
    )
    return result.rows.map((r) => r.datname)
  }

  async getSchemas(): Promise<string[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT schema_name FROM information_schema.schemata
       WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
       ORDER BY schema_name`
    )
    return result.rows.map((r) => r.schema_name)
  }

  async getTables(schema = 'public'): Promise<{ name: string; type: 'table' | 'view' }[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT table_name, table_type FROM information_schema.tables
       WHERE table_schema = $1 ORDER BY table_name`,
      [schema]
    )
    return result.rows.map((r) => ({
      name: r.table_name,
      type: r.table_type === 'VIEW' ? 'view' : 'table'
    }))
  }

  async getColumns(table: string, schema = 'public'): Promise<ColumnDetail[]> {
    if (!this.pool) throw new Error('Not connected')
    const result = await this.pool.query(
      `SELECT
        c.column_name, c.data_type, c.is_nullable, c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_pk,
        fk.foreign_table_name, fk.foreign_column_name
       FROM information_schema.columns c
       LEFT JOIN (
         SELECT kcu.column_name FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
       ) pk ON pk.column_name = c.column_name
       LEFT JOIN (
         SELECT kcu.column_name, ccu.table_name as foreign_table_name,
                ccu.column_name as foreign_column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu
           ON tc.constraint_name = ccu.constraint_name
         WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'FOREIGN KEY'
       ) fk ON fk.column_name = c.column_name
       WHERE c.table_schema = $1 AND c.table_name = $2
       ORDER BY c.ordinal_position`,
      [schema, table]
    )
    return result.rows.map((r) => ({
      name: r.column_name,
      dataType: r.data_type,
      nullable: r.is_nullable === 'YES',
      isPrimaryKey: r.is_pk,
      isForeignKey: !!r.foreign_table_name,
      defaultValue: r.column_default || undefined,
      referencesTable: r.foreign_table_name || undefined,
      referencesColumn: r.foreign_column_name || undefined
    }))
  }

  async getFullSchema(): Promise<DatabaseSchema> {
    const schemas = await this.getSchemas()
    const schemaInfos = await Promise.all(
      schemas.map(async (schemaName) => {
        const tables = await this.getTables(schemaName)
        const tableInfos = await Promise.all(
          tables.map(async (t) => {
            const columns = await this.getColumns(t.name, schemaName)
            return { name: t.name, schema: schemaName, type: t.type, columns }
          })
        )
        return { name: schemaName, tables: tableInfos }
      })
    )
    return { name: this.config.database_name || '', schemas: schemaInfos }
  }
}
