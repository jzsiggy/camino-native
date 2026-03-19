import React from 'react'
import { useAppStore } from '../../stores/app.store'
import { useEditorStore } from '../../stores/editor.store'

export const StatusBar: React.FC = () => {
  const { activeConnectionId, connectedIds } = useAppStore()
  const { activeTabId, tabs } = useEditorStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)
  const isConnected = activeConnectionId ? connectedIds.has(activeConnectionId) : false

  return (
    <div className="status-bar">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            className={`connection-status ${isConnected ? 'connected' : ''}`}
            style={{ width: 6, height: 6 }}
          />
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {activeTab?.result && !activeTab.result.error && (
          <span>
            {activeTab.result.rowCount} rows · {activeTab.result.executionTime}ms
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <span>Camino v1.0.0</span>
      </div>
    </div>
  )
}
