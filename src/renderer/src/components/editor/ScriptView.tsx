import React, { useCallback, useRef, useEffect, useState } from 'react'
import { Allotment } from 'allotment'
import Editor, { type OnMount } from '@monaco-editor/react'
import { Button, Intent, Icon, NonIdealState } from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useScript, useUpdateScript } from '../../hooks/useScripts'
import { queryApi } from '../../lib/ipc-client'
import type { QueryResult } from '@shared/types/query'

export const ScriptView: React.FC = () => {
  const { activeScriptId, activeConnectionId, theme } = useAppStore()
  const { data: script } = useScript(activeScriptId)
  const updateScript = useUpdateScript()
  const editorRef = useRef<any>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync from script data
  useEffect(() => {
    if (script) {
      setTitle(script.title)
      setContent(script.content)
    }
  }, [script?.id])

  // Auto-save with debounce
  const debounceSave = useCallback(
    (updates: { title?: string; content?: string }) => {
      if (!activeScriptId) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        updateScript.mutate({ id: activeScriptId, updates })
      }, 1500)
    },
    [activeScriptId, updateScript]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    debounceSave({ title: newTitle })
  }

  const handleContentChange = (value: string | undefined) => {
    const newContent = value || ''
    setContent(newContent)
    debounceSave({ content: newContent })
  }

  const handleExecute = useCallback(async () => {
    if (!activeConnectionId) return
    const editor = editorRef.current
    if (!editor) return

    const selection = editor.getSelection()
    let sql = ''
    if (selection && !selection.isEmpty()) {
      sql = editor.getModel()?.getValueInRange(selection) || ''
    } else {
      sql = editor.getValue()
    }

    if (!sql.trim()) return

    setIsExecuting(true)
    try {
      const queryResult = await queryApi.execute({ connectionId: activeConnectionId, sql: sql.trim() })
      setResult(queryResult)
    } catch (err) {
      setResult({
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: (err as Error).message
      })
    } finally {
      setIsExecuting(false)
    }
  }, [activeConnectionId])

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleExecute()
    })
  }

  if (!script) {
    return (
      <div className="empty-state">
        <p>Loading script...</p>
      </div>
    )
  }

  return (
    <div className="script-view">
      <div className="script-header">
        <input
          className="script-title-input"
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Script"
        />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            small
            icon="play"
            intent={Intent.SUCCESS}
            text="Run"
            onClick={handleExecute}
            loading={isExecuting}
          />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
            {navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}+Enter
          </span>
        </div>
      </div>
      <Allotment vertical>
        <Allotment.Pane>
          <Editor
            defaultLanguage="sql"
            value={content}
            onChange={handleContentChange}
            onMount={handleEditorMount}
            theme={theme === 'dark' ? 'vs-dark' : 'vs'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              tabSize: 2,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              automaticLayout: true,
              padding: { top: 8 }
            }}
          />
        </Allotment.Pane>
        <Allotment.Pane minSize={80} preferredSize={250}>
          <div className="results-panel" style={{ height: '100%' }}>
            <div className="results-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>Results</span>
                {result && !result.error && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {result.rowCount} rows &middot; {result.executionTime}ms
                  </span>
                )}
              </div>
            </div>
            {!result ? (
              <div className="empty-state">
                <Icon icon="th" size={32} style={{ opacity: 0.3 }} />
                <p>Execute a query to see results</p>
              </div>
            ) : result.error ? (
              <div style={{ padding: 16 }}>
                <NonIdealState icon="error" title="Query Error" description={result.error} />
              </div>
            ) : (
              <>
                <div className="results-grid">
                  <table className="results-table">
                    <thead>
                      <tr>
                        {result.columns.map((col, i) => (
                          <th key={i}>{col.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {result.columns.map((col, j) => (
                            <td key={j}>
                              {row[col.name] === null ? (
                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>NULL</span>
                              ) : (
                                String(row[col.name])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="results-status">
                  <span>{result.rowCount} rows returned</span>
                  <span>{result.executionTime}ms</span>
                </div>
              </>
            )}
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  )
}
