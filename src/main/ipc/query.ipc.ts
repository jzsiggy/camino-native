import { ipcMain } from 'electron'
import { IPC } from '@shared/constants/ipc-channels'
import { MAX_ROWS, TIMEOUT_MS } from '@shared/constants/defaults'
import type { QueryRequest } from '@shared/types/query'
import { poolManager } from '../db/pool-manager'

export function registerQueryIpc(): void {
  ipcMain.handle(IPC.QUERY_EXECUTE, async (_event, request: QueryRequest) => {
    const adapter = poolManager.getAdapter(request.connectionId)
    if (!adapter) throw new Error('Not connected. Please connect first.')
    return adapter.execute(request.sql, {
      maxRows: request.maxRows ?? MAX_ROWS,
      timeoutMs: request.timeoutMs ?? TIMEOUT_MS,
      queryId: request.queryId
    })
  })

  ipcMain.handle(IPC.QUERY_CANCEL, async (_event, connectionId: string, queryId: string) => {
    const adapter = poolManager.getAdapter(connectionId)
    if (!adapter) throw new Error('Not connected.')
    await adapter.cancelQuery(queryId)
    return { success: true }
  })
}
