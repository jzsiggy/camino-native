export interface DatabaseSchema {
  name: string
  schemas: SchemaInfo[]
}

export interface SchemaInfo {
  name: string
  tables: TableInfo[]
}

export interface TableInfo {
  name: string
  schema?: string
  type: 'table' | 'view'
  columns: ColumnDetail[]
  rowCount?: number
}

export interface ColumnDetail {
  name: string
  dataType: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  defaultValue?: string
  referencesTable?: string
  referencesColumn?: string
}

export interface SchemaCache {
  connectionId: string
  schema: DatabaseSchema
  cachedAt: string
}
