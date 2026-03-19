import Database from 'better-sqlite3'
import type { DatabaseAdapter } from './adapter.interface'
import type { QueryResult } from '@shared/types/query'
import type { DatabaseSchema, ColumnDetail } from '@shared/types/schema'
import type { ConnectionConfig } from '@shared/types/connection'

export class SqliteAdapter implements DatabaseAdapter {
  private db: Database.Database | null = null
  private config: ConnectionConfig

  constructor(config: ConnectionConfig) {
    this.config = config
  }

  async testConnection(): Promise<{ success: boolean; message: string; latency_ms?: number }> {
    const start = Date.now()
    try {
      const filePath = this.config.file_path
      if (!filePath) throw new Error('No file path specified for SQLite connection')
      const testDb = new Database(filePath, { readonly: true })
      testDb.prepare('SELECT 1').get()
      testDb.close()
      return { success: true, message: 'Connection successful', latency_ms: Date.now() - start }
    } catch (err) {
      return { success: false, message: (err as Error).message }
    }
  }

  async connect(): Promise<void> {
    if (this.db) return
    const filePath = this.config.file_path
    if (!filePath) throw new Error('No file path specified for SQLite connection')
    this.db = new Database(filePath)
    this.db.pragma('foreign_keys = ON')
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  isConnected(): boolean {
    return this.db !== null
  }

  async execute(sql: string, maxRows?: number): Promise<QueryResult> {
    if (!this.db) throw new Error('Not connected')
    const start = Date.now()
    try {
      const trimmed = sql.trim().toUpperCase()
      const isSelect = trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')

      if (isSelect) {
        const stmt = this.db.prepare(sql)
        const rows = stmt.all() as Record<string, unknown>[]
        const limited = maxRows ? rows.slice(0, maxRows) : rows
        const columns = limited.length > 0
          ? Object.keys(limited[0]).map((name) => ({ name, dataType: 'TEXT' }))
          : []
        return {
          columns,
          rows: limited,
          rowCount: limited.length,
          executionTime: Date.now() - start
        }
      } else {
        const result = this.db.prepare(sql).run()
        return {
          columns: [],
          rows: [],
          rowCount: 0,
          affectedRows: result.changes,
          executionTime: Date.now() - start
        }
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
    return [this.config.name]
  }

  async getSchemas(): Promise<string[]> {
    return ['main']
  }

  async getTables(): Promise<{ name: string; type: 'table' | 'view' }[]> {
    if (!this.db) throw new Error('Not connected')
    const rows = this.db
      .prepare(
        `SELECT name, type FROM sqlite_master
         WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%'
         ORDER BY name`
      )
      .all() as { name: string; type: string }[]
    return rows.map((r) => ({
      name: r.name,
      type: r.type === 'view' ? 'view' : 'table'
    }))
  }

  async getColumns(table: string): Promise<ColumnDetail[]> {
    if (!this.db) throw new Error('Not connected')
    const columns = this.db.prepare(`PRAGMA table_info('${table}')`).all() as {
      cid: number; name: string; type: string; notnull: number; dflt_value: string | null; pk: number
    }[]

    const fks = this.db.prepare(`PRAGMA foreign_key_list('${table}')`).all() as {
      from: string; table: string; to: string
    }[]
    const fkMap = new Map(fks.map((fk) => [fk.from, { table: fk.table, column: fk.to }]))

    return columns.map((c) => {
      const fk = fkMap.get(c.name)
      return {
        name: c.name,
        dataType: c.type || 'TEXT',
        nullable: !c.notnull,
        isPrimaryKey: c.pk > 0,
        isForeignKey: !!fk,
        defaultValue: c.dflt_value || undefined,
        referencesTable: fk?.table,
        referencesColumn: fk?.column
      }
    })
  }

  async getFullSchema(): Promise<DatabaseSchema> {
    const tables = await this.getTables()
    const tableInfos = await Promise.all(
      tables.map(async (t) => {
        const columns = await this.getColumns(t.name)
        return { name: t.name, schema: 'main', type: t.type, columns }
      })
    )
    return {
      name: this.config.name,
      schemas: [{ name: 'main', tables: tableInfos }]
    }
  }
}
