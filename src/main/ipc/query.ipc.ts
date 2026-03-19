import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import type { QueryRequest } from '@shared/types/query'
import { poolManager } from '../db/pool-manager'

export function registerQueryIpc(): void {
  ipcMain.handle(IPC.QUERY_EXECUTE, async (_event, request: QueryRequest) => {
    const adapter = poolManager.getAdapter(request.connectionId)
    if (!adapter) throw new Error('Not connected. Please connect first.')
    return adapter.execute(request.sql, request.maxRows)
  })
}
