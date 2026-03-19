import React from 'react'
import {
  Dialog, DialogBody, DialogFooter,
  Button, Tabs, Tab, FormGroup, Tag
} from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useAiStore } from '../../stores/ai.store'
import { useConnection } from '../../hooks/useConnections'

export const ConnectionSettingsDialog: React.FC = () => {
  const {
    connectionSettingsOpen, setConnectionSettingsOpen,
    connectionSettingsId, setConnectionSettingsId,
    connectedIds, setActiveConnectionId,
    setConnectionDialogOpen, setEditingConnection
  } = useAppStore()

  const { setWizardOpen, setContextViewerOpen } = useAiStore()
  const { data: connection } = useConnection(connectionSettingsId)

  // Auto-close if connection was deleted
  if (connectionSettingsOpen && connectionSettingsId && connection === null) {
    setConnectionSettingsOpen(false)
    setConnectionSettingsId(null)
    return null
  }

  if (!connection) return null

  const isConnected = connectedIds.has(connection.id)

  const handleEdit = () => {
    setConnectionSettingsOpen(false)
    setEditingConnection(connection)
    setConnectionDialogOpen(true)
  }

  const handleWizard = () => {
    setActiveConnectionId(connection.id)
    setConnectionSettingsOpen(false)
    setWizardOpen(true)
  }

  const handleContextViewer = () => {
    setActiveConnectionId(connection.id)
    setConnectionSettingsOpen(false)
    setContextViewerOpen(true)
  }

  const handleClose = () => {
    setConnectionSettingsOpen(false)
    setConnectionSettingsId(null)
  }

  const isSqlite = connection.engine === 'sqlite'

  const connectionTab = (
    <div style={{ paddingTop: 12 }}>
      <FormGroup label="Engine">
        <Tag minimal large>{connection.engine}</Tag>
      </FormGroup>
      {isSqlite ? (
        <FormGroup label="File Path">
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{connection.file_path || '—'}</span>
        </FormGroup>
      ) : (
        <>
          <FormGroup label="Host">
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>
              {connection.host || '—'}:{connection.port || '—'}
            </span>
          </FormGroup>
          <FormGroup label="Database">
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{connection.database_name || '—'}</span>
          </FormGroup>
          <FormGroup label="Username">
            <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{connection.username || '—'}</span>
          </FormGroup>
          <FormGroup label="SSL">
            <Tag minimal intent={connection.ssl_enabled ? 'success' : 'none'}>
              {connection.ssl_enabled ? 'Enabled' : 'Disabled'}
            </Tag>
          </FormGroup>
        </>
      )}
      <div style={{ marginTop: 12 }}>
        <Button icon="edit" text="Edit Connection" onClick={handleEdit} />
      </div>
    </div>
  )

  const aiTab = (
    <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Button
        icon="learning"
        text="Run AI Setup Wizard"
        disabled={!isConnected}
        onClick={handleWizard}
      />
      <Button
        icon="list-detail-view"
        text="View AI Context"
        onClick={handleContextViewer}
      />
      {!isConnected && (
        <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
          Connect to this database to run the AI Setup Wizard.
        </p>
      )}
    </div>
  )

  return (
    <Dialog
      isOpen={connectionSettingsOpen}
      onClose={handleClose}
      title={`${connection.name} Settings`}
      style={{ width: 500 }}
    >
      <DialogBody>
        <Tabs>
          <Tab id="connection" title="Connection" panel={connectionTab} />
          <Tab id="ai" title="AI" panel={aiTab} />
        </Tabs>
      </DialogBody>
      <DialogFooter
        actions={<Button text="Close" onClick={handleClose} />}
      />
    </Dialog>
  )
}
