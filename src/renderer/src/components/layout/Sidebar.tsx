import React from 'react'
import { Button, Icon } from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { ConnectionTree } from '../connections/ConnectionTree'

export const Sidebar: React.FC = () => {
  const { setConnectionDialogOpen, setSettingsDialogOpen } = useAppStore()

  return (
    <div className="sidebar" style={{ width: '100%', height: '100%' }}>
      <div className="sidebar-header">
        <h3>Connections</h3>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            minimal
            small
            icon="plus"
            onClick={() => {
              useAppStore.getState().setEditingConnection(null)
              setConnectionDialogOpen(true)
            }}
          />
          <Button
            minimal
            small
            icon="cog"
            onClick={() => setSettingsDialogOpen(true)}
          />
        </div>
      </div>
      <div className="sidebar-content">
        <ConnectionTree />
      </div>
    </div>
  )
}
