import React, { useCallback, useRef } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { Button, Intent } from '@blueprintjs/core'
import { useEditorStore, type EditorTab } from '../../stores/editor.store'
import { useAppStore } from '../../stores/app.store'
import { useExecuteQuery } from '../../hooks/useQuery'
import { getStatementAtCursor } from './getStatementAtCursor'

interface Props {
  tab: EditorTab
}

export const SqlEditor: React.FC<Props> = ({ tab }) => {
  const { updateTabContent } = useEditorStore()
  const { theme } = useAppStore()
  const { execute } = useExecuteQuery()
  const editorRef = useRef<any>(null)

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Cmd/Ctrl+Enter to execute all
    editor.addAction({
      id: 'execute-query',
      label: 'Execute Query',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => handleExecute()
    })

    // Shift+Enter to execute current statement at cursor
    editor.addAction({
      id: 'execute-current-query',
      label: 'Execute Current Query',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
      run: () => handleExecuteCurrent()
    })
  }

  const handleExecuteCurrent = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const sql = getStatementAtCursor(editor)
    if (sql.trim()) {
      execute(tab.id, tab.connectionId, sql.trim())
    }
  }, [tab.id, tab.connectionId, execute])

  const handleExecute = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    // Get selected text or full content
    const selection = editor.getSelection()
    let sql = ''
    if (selection && !selection.isEmpty()) {
      sql = editor.getModel()?.getValueInRange(selection) || ''
    } else {
      sql = editor.getValue()
    }

    if (sql.trim()) {
      execute(tab.id, tab.connectionId, sql.trim())
    }
  }, [tab.id, tab.connectionId, execute])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)', gap: 8
      }}>
        <Button
          small
          icon="play"
          intent={Intent.SUCCESS}
          text="Run"
          onClick={handleExecute}
          loading={tab.isExecuting}
        />
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to run all · Shift+Enter for current statement
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <Editor
          defaultLanguage="sql"
          value={tab.content}
          onChange={(value) => updateTabContent(tab.id, value || '')}
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
      </div>
    </div>
  )
}
