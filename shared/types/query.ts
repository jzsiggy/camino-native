export interface QueryResult {
  columns: ColumnInfo[]
  rows: Record<string, unknown>[]
  rowCount: number
  affectedRows?: number
  executionTime: number
  error?: string
}

export interface ColumnInfo {
  name: string
  dataType: string
}

export interface QueryRequest {
  connectionId: string
  sql: string
  maxRows?: number
}
