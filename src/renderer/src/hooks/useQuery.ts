import { useCallback } from 'react'
import { queryApi } from '../lib/ipc-client'
import { useEditorStore } from '../stores/editor.store'

export function useExecuteQuery() {
  const { setTabResult, setTabExecuting } = useEditorStore()

  const execute = useCallback(
    async (tabId: string, connectionId: string, sql: string) => {
      setTabExecuting(tabId, true)
      try {
        const result = await queryApi.execute({ connectionId, sql })
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
      }
    },
    [setTabResult, setTabExecuting]
  )

  return { execute }
}
