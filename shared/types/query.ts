export interface QueryResult {
  columns: ColumnInfo[]
  rows: Record<string, unknown>[]
  rowCount: number
  affectedRows?: number
  executionTime: number
  error?: string
  truncated?: boolean
  cancelled?: boolean
}

export interface ColumnInfo {
  name: string
  dataType: string
}

export interface QueryRequest {
  connectionId: string
  sql: string
  maxRows?: number
  timeoutMs?: number
  queryId?: string
}

export interface ExecuteOptions {
  maxRows?: number
  timeoutMs?: number
  queryId?: string
}
