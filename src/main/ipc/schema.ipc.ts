import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import { poolManager } from '../db/pool-manager'
import { getAppDb } from '../db/app-db'

export function registerSchemaIpc(): void {
  ipcMain.handle(IPC.SCHEMA_GET_DATABASES, async (_event, connectionId: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getDatabases()
  })

  ipcMain.handle(IPC.SCHEMA_GET_SCHEMAS, async (_event, connectionId: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getSchemas()
  })

  ipcMain.handle(IPC.SCHEMA_GET_TABLES, async (_event, connectionId: string, schema?: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getTables(schema)
  })

  ipcMain.handle(IPC.SCHEMA_GET_COLUMNS, async (_event, connectionId: string, table: string, schema?: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected')
    return adapter.getColumns(table, schema)
  })

  ipcMain.handle(IPC.SCHEMA_GET_FULL, async (_event, connectionId: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected')

    const schema = await adapter.getFullSchema()

    // Cache the schema
    const db = getAppDb()
    db.prepare(
      `INSERT OR REPLACE INTO schema_cache (connection_id, schema_json, cached_at)
       VALUES (?, ?, datetime('now'))`
    ).run(connectionId, JSON.stringify(schema))

    return schema
  })

  ipcMain.handle(IPC.SCHEMA_REFRESH, async (_event, connectionId: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected')

    const schema = await adapter.getFullSchema()
    const db = getAppDb()
    db.prepare(
      `INSERT OR REPLACE INTO schema_cache (connection_id, schema_json, cached_at)
       VALUES (?, ?, datetime('now'))`
    ).run(connectionId, JSON.stringify(schema))

    return schema
  })
}
