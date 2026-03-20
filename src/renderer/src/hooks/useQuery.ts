import { useCallback, useRef } from 'react'
import { queryApi } from '../lib/ipc-client'
import { useEditorStore } from '../stores/editor.store'

export function useExecuteQuery() {
  const { setTabResult, setTabExecuting } = useEditorStore()
  const activeQueryIds = useRef<Map<string, string>>(new Map())

  const execute = useCallback(
    async (tabId: string, connectionId: string, sql: string) => {
      const queryId = crypto.randomUUID()
      activeQueryIds.current.set(tabId, queryId)
      setTabExecuting(tabId, true)
      try {
        const result = await queryApi.execute({ connectionId, sql, queryId })
        setTabResult(tabId, result)
        return result
      } catch (err) {
        setTabResult(tabId, {
          columns: [],
          rows: [],
          rowCount: 0,
          executionTime: 0,
          error: (err as Error).message
        })
      } finally {
        activeQueryIds.current.delete(tabId)
      }
    },
    [setTabResult, setTabExecuting]
  )

  const cancel = useCallback(
    async (tabId: string, connectionId: string) => {
      const queryId = activeQueryIds.current.get(tabId)
      if (!queryId) return
      try {
        await queryApi.cancel(connectionId, queryId)
      } catch {
        // Query may have already finished
      }
    },
    []
  )

  return { execute, cancel }
}
