import React from 'react'
import { useAppStore } from '../../stores/app.store'

export const StatusBar: React.FC = () => {
  const { activeConnectionId, connectedIds } = useAppStore()
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
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <span>Camino v1.0.0</span>
      </div>
    </div>
  )
}
