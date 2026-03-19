import { ipcMain } from 'electron'
import { v4 as uuid } from 'uuid'
import { IPC } from '@shared/constants/ipc-channels'
import { getAppDb } from '../db/app-db'

function mapScript(row: Record<string, unknown>) {
  return {
    id: row.id,
    connectionId: row.connection_id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function registerScriptIpc(): void {
  ipcMain.handle(IPC.SCRIPT_LIST, (_event, connectionId: string) => {
    const db = getAppDb()
    const rows = db
      .prepare('SELECT * FROM scripts WHERE connection_id = ? ORDER BY updated_at DESC')
      .all(connectionId) as Record<string, unknown>[]
    return rows.map(mapScript)
  })

  ipcMain.handle(IPC.SCRIPT_GET, (_event, id: string) => {
    const db = getAppDb()
    const row = db.prepare('SELECT * FROM scripts WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? mapScript(row) : null
  })

  ipcMain.handle(IPC.SCRIPT_CREATE, (_event, connectionId: string, title?: string) => {
    const db = getAppDb()
    const id = uuid()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO scripts (id, connection_id, title, content, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, connectionId, title || 'Untitled', '', now, now)
    return { id, connectionId, title: title || 'Untitled', content: '', createdAt: now, updatedAt: now }
  })

  ipcMain.handle(IPC.SCRIPT_UPDATE, (_event, id: string, updates: { title?: string; content?: string }) => {
    const db = getAppDb()
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.content !== undefined) {
      fields.push('content = ?')
      values.push(updates.content)
    }

    if (fields.length === 0) return { success: true }

    fields.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    db.prepare(`UPDATE scripts SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    return { success: true }
  })

  ipcMain.handle(IPC.SCRIPT_DELETE, (_event, id: string) => {
    const db = getAppDb()
    db.prepare('DELETE FROM scripts WHERE id = ?').run(id)
    return { success: true }
  })
}
