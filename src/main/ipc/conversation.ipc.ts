import { ipcMain } from 'electron'
import { v4 as uuid } from 'uuid'
import { IPC } from '@shared/constants/ipc-channels'
import { getAppDb } from '../db/app-db'

export function registerConversationIpc(): void {
  ipcMain.handle(IPC.CONVERSATION_LIST, (_event, connectionId: string) => {
    const db = getAppDb()
    return db
      .prepare('SELECT * FROM conversations WHERE connection_id = ? ORDER BY updated_at DESC')
      .all(connectionId)
  })

  ipcMain.handle(IPC.CONVERSATION_GET, (_event, id: string) => {
    const db = getAppDb()
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id)
  })

  ipcMain.handle(IPC.CONVERSATION_CREATE, (_event, connectionId: string, title?: string) => {
    const db = getAppDb()
    const id = uuid()
    const now = new Date().toISOString()
    db.prepare(
      `INSERT INTO conversations (id, connection_id, title, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(id, connectionId, title || 'New Conversation', now, now)
    return { id, connection_id: connectionId, title: title || 'New Conversation', created_at: now, updated_at: now }
  })

  ipcMain.handle(IPC.CONVERSATION_DELETE, (_event, id: string) => {
    const db = getAppDb()
    db.prepare('DELETE FROM conversations WHERE id = ?').run(id)
    return { success: true }
  })

  ipcMain.handle(IPC.CONVERSATION_MESSAGES, (_event, conversationId: string) => {
    const db = getAppDb()
    return db
      .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId)
  })
}
