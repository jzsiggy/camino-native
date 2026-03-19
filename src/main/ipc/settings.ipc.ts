import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import { getAppDb } from '../db/app-db'
import { encryptString, decryptString } from '../security/crypto'

const ENCRYPTED_KEYS = new Set(['anthropicApiKey', 'openaiApiKey'])

export function registerSettingsIpc(): void {
  ipcMain.handle(IPC.SETTINGS_GET, (_event, key: string) => {
    const db = getAppDb()
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    if (!row) return null

    if (ENCRYPTED_KEYS.has(key)) {
      try {
        return decryptString(Buffer.from(row.value, 'base64'))
      } catch {
        return null
      }
    }
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  })

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: unknown) => {
    const db = getAppDb()
    let storedValue: string

    if (ENCRYPTED_KEYS.has(key) && typeof value === 'string') {
      storedValue = encryptString(value).toString('base64')
    } else {
      storedValue = JSON.stringify(value)
    }

    db.prepare(
      'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'
    ).run(key, storedValue)

    return { success: true }
  })

  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    const db = getAppDb()
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    const settings: Record<string, unknown> = {}

    for (const row of rows) {
      if (ENCRYPTED_KEYS.has(row.key)) {
        // Don't send encrypted values to renderer, just indicate they exist
        settings[row.key] = '********'
      } else {
        try {
          settings[row.key] = JSON.parse(row.value)
        } catch {
          settings[row.key] = row.value
        }
      }
    }
    return settings
  })
}
