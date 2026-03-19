import { ipcMain } from 'electron'
import { v4 as uuid } from 'uuid'
import { IPC } from '@shared/constants/ipc-channels'
import type { ConnectionConfig, ConnectionCreateInput, ConnectionUpdateInput } from '@shared/types/connection'
import { getAppDb } from '../db/app-db'
import { encryptString, decryptString } from '../security/crypto'
import { poolManager } from '../db/pool-manager'

function decryptConnection(row: Record<string, unknown>): ConnectionConfig {
  const conn = { ...row } as ConnectionConfig
  if (row.password_enc && Buffer.isBuffer(row.password_enc)) {
    try {
      conn.password = decryptString(row.password_enc as Buffer)
    } catch {
      conn.password = undefined
    }
  }
  return conn
}

export function registerConnectionIpc(): void {
  ipcMain.handle(IPC.CONNECTION_LIST, () => {
    const db = getAppDb()
    const rows = db.prepare('SELECT * FROM connections ORDER BY name').all()
    return rows.map((r) => {
      const conn = decryptConnection(r as Record<string, unknown>)
      delete conn.password // Don't send password to renderer
      return conn
    })
  })

  ipcMain.handle(IPC.CONNECTION_GET, (_event, id: string) => {
    const db = getAppDb()
    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id)
    if (!row) return null
    const conn = decryptConnection(row as Record<string, unknown>)
    delete conn.password
    return conn
  })

  ipcMain.handle(IPC.CONNECTION_CREATE, (_event, input: ConnectionCreateInput) => {
    const db = getAppDb()
    const id = uuid()
    const now = new Date().toISOString()
    const passwordEnc = input.password ? encryptString(input.password) : null

    db.prepare(
      `INSERT INTO connections (id, name, engine, host, port, database_name, username, password_enc, ssl_enabled, file_path, extra_params, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, input.name, input.engine, input.host || null, input.port || null,
      input.database_name || null, input.username || null, passwordEnc,
      input.ssl_enabled ? 1 : 0, input.file_path || null,
      input.extra_params || null, now, now
    )

    return { id, ...input, created_at: now, updated_at: now, password: undefined }
  })

  ipcMain.handle(IPC.CONNECTION_UPDATE, (_event, input: ConnectionUpdateInput) => {
    const db = getAppDb()
    const existing = db.prepare('SELECT * FROM connections WHERE id = ?').get(input.id)
    if (!existing) throw new Error('Connection not found')

    const now = new Date().toISOString()
    const updates: string[] = []
    const values: unknown[] = []

    const fields = ['name', 'engine', 'host', 'port', 'database_name', 'username', 'ssl_enabled', 'file_path', 'extra_params']
    for (const field of fields) {
      if (field in input) {
        updates.push(`${field} = ?`)
        values.push(field === 'ssl_enabled' ? (input[field as keyof ConnectionUpdateInput] ? 1 : 0) : input[field as keyof ConnectionUpdateInput])
      }
    }

    if (input.password !== undefined) {
      updates.push('password_enc = ?')
      values.push(input.password ? encryptString(input.password) : null)
    }

    updates.push('updated_at = ?')
    values.push(now)
    values.push(input.id)

    db.prepare(`UPDATE connections SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    return { success: true }
  })

  ipcMain.handle(IPC.CONNECTION_DELETE, async (_event, id: string) => {
    await poolManager.disconnect(id)
    const db = getAppDb()
    db.prepare('DELETE FROM connections WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle(IPC.CONNECTION_TEST, async (_event, input: ConnectionCreateInput & { id?: string }) => {
    const config: ConnectionConfig = {
      id: input.id || 'test',
      name: input.name,
      engine: input.engine,
      host: input.host,
      port: input.port,
      database_name: input.database_name,
      username: input.username,
      password: input.password,
      ssl_enabled: input.ssl_enabled,
      file_path: input.file_path,
      created_at: '',
      updated_at: ''
    }
    const adapter = poolManager.createAdapter(config)
    return adapter.testConnection()
  })

  ipcMain.handle(IPC.CONNECTION_CONNECT, async (_event, id: string) => {
    const db = getAppDb()
    const row = db.prepare('SELECT * FROM connections WHERE id = ?').get(id)
    if (!row) throw new Error('Connection not found')
    const config = decryptConnection(row as Record<string, unknown>)
    await poolManager.connect(config)
    return { success: true }
  })

  ipcMain.handle(IPC.CONNECTION_DISCONNECT, async (_event, id: string) => {
    await poolManager.disconnect(id)
    return { success: true }
  })
}
