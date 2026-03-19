import React from 'react'
import { Icon, Button, NonIdealState } from '@blueprintjs/core'
import { useEditorStore } from '../../stores/editor.store'
import { useAppStore } from '../../stores/app.store'

export const ResultsPanel: React.FC = () => {
  const { activeTabId, tabs } = useEditorStore()
  const { setRightPanel } = useAppStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const result = activeTab?.result

  return (
    <div className="results-panel" style={{ height: '100%' }}>
      <div className="results-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Results</span>
          {result && !result.error && (
            <span style={{ color: 'var(--text-secondary)' }}>
              {result.rowCount} rows · {result.executionTime}ms
            </span>
          )}
        </div>
        <Button
          minimal
          small
          icon="chat"
          text="AI Chat"
          onClick={() => setRightPanel('ai')}
        />
      </div>

      {!result ? (
        <div className="empty-state">
          <Icon icon="th" size={32} style={{ opacity: 0.3 }} />
          <p>Execute a query to see results</p>
        </div>
      ) : result.error ? (
        <div style={{ padding: 16 }}>
          <NonIdealState
            icon="error"
            title="Query Error"
            description={result.error}
          />
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
            {result.affectedRows !== undefined && (
              <span>{result.affectedRows} affected</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
