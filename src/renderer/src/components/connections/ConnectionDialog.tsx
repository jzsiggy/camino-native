import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogBody, DialogFooter,
  Button, FormGroup, InputGroup, HTMLSelect, Switch, Intent
} from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useCreateConnection, useUpdateConnection, useTestConnection } from '../../hooks/useConnections'
import type { DatabaseEngine, ConnectionCreateInput } from '@shared/types/connection'

const defaultPorts: Record<DatabaseEngine, number> = {
  postgres: 5432,
  mysql: 3306,
  sqlite: 0
}

export const ConnectionDialog: React.FC = () => {
  const { connectionDialogOpen, setConnectionDialogOpen, editingConnection, setEditingConnection } = useAppStore()
  const createMutation = useCreateConnection()
  const updateMutation = useUpdateConnection()
  const testMutation = useTestConnection()

  const [testPassed, setTestPassed] = useState(false)

  const [form, setForm] = useState<ConnectionCreateInput>({
    name: '',
    engine: 'postgres',
    host: 'localhost',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
    ssl_enabled: false,
    file_path: ''
  })

  useEffect(() => {
    if (editingConnection) {
      setForm({
        name: editingConnection.name,
        engine: editingConnection.engine,
        host: editingConnection.host || 'localhost',
        port: editingConnection.port || defaultPorts[editingConnection.engine],
        database_name: editingConnection.database_name || '',
        username: editingConnection.username || '',
        password: '', // Don't populate password
        ssl_enabled: editingConnection.ssl_enabled || false,
        file_path: editingConnection.file_path || ''
      })
    } else {
      setForm({
        name: '', engine: 'postgres', host: 'localhost', port: 5432,
        database_name: '', username: '', password: '', ssl_enabled: false, file_path: ''
      })
    }
  }, [editingConnection, connectionDialogOpen])

  const updateForm = (updater: Parameters<typeof setForm>[0]) => {
    setForm(updater)
    setTestPassed(false)
  }

  const handleClose = () => {
    setConnectionDialogOpen(false)
    setEditingConnection(null)
    testMutation.reset()
    setTestPassed(false)
  }

  const handleEngineChange = (engine: DatabaseEngine) => {
    updateForm((f) => ({ ...f, engine, port: defaultPorts[engine] }))
  }

  const handleSave = async () => {
    if (editingConnection) {
      await updateMutation.mutateAsync({ id: editingConnection.id, ...form })
    } else {
      await createMutation.mutateAsync(form)
    }
    handleClose()
  }

  const handleTest = () => {
    testMutation.mutate(form, {
      onSuccess: (result) => {
        if (result.success) setTestPassed(true)
      }
    })
  }

  const isSqlite = form.engine === 'sqlite'

  return (
    <Dialog
      isOpen={connectionDialogOpen}
      onClose={handleClose}
      title={editingConnection ? 'Edit Connection' : 'New Connection'}
      style={{ width: 500 }}
    >
      <DialogBody>
        <FormGroup label="Connection Name" labelFor="name">
          <InputGroup
            id="name"
            value={form.name}
            onChange={(e) => updateForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="My Database"
          />
        </FormGroup>

        <FormGroup label="Database Engine" labelFor="engine">
          <HTMLSelect
            id="engine"
            value={form.engine}
            onChange={(e) => handleEngineChange(e.target.value as DatabaseEngine)}
            fill
          >
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
          </HTMLSelect>
        </FormGroup>

        {isSqlite ? (
          <FormGroup label="File Path" labelFor="file_path">
            <InputGroup
              id="file_path"
              value={form.file_path || ''}
              onChange={(e) => updateForm((f) => ({ ...f, file_path: e.target.value }))}
              placeholder="/path/to/database.db"
            />
          </FormGroup>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 12 }}>
              <FormGroup label="Host" labelFor="host" style={{ flex: 1 }}>
                <InputGroup
                  id="host"
                  value={form.host || ''}
                  onChange={(e) => updateForm((f) => ({ ...f, host: e.target.value }))}
                />
              </FormGroup>
              <FormGroup label="Port" labelFor="port" style={{ width: 100 }}>
                <InputGroup
                  id="port"
                  type="number"
                  value={String(form.port || '')}
                  onChange={(e) => updateForm((f) => ({ ...f, port: parseInt(e.target.value) || undefined }))}
                />
              </FormGroup>
            </div>

            <FormGroup label="Database" labelFor="database">
              <InputGroup
                id="database"
                value={form.database_name || ''}
                onChange={(e) => updateForm((f) => ({ ...f, database_name: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Username" labelFor="username">
              <InputGroup
                id="username"
                value={form.username || ''}
                onChange={(e) => updateForm((f) => ({ ...f, username: e.target.value }))}
              />
            </FormGroup>

            <FormGroup label="Password" labelFor="password">
              <InputGroup
                id="password"
                type="password"
                value={form.password || ''}
                onChange={(e) => updateForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editingConnection ? '(unchanged)' : ''}
              />
            </FormGroup>

            <Switch
              label="SSL Enabled"
              checked={form.ssl_enabled || false}
              onChange={(e) => updateForm((f) => ({ ...f, ssl_enabled: (e.target as HTMLInputElement).checked }))}
            />
          </>
        )}

        {testMutation.data && (
          <div style={{ marginTop: 8, fontSize: 13 }}>
            {testMutation.data.success ? (
              <span style={{ color: 'var(--success)' }}>
                Connected successfully ({testMutation.data.latency_ms}ms)
              </span>
            ) : (
              <span style={{ color: 'var(--error)' }}>
                {testMutation.data.message}
              </span>
            )}
          </div>
        )}
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button
              text="Test"
              onClick={handleTest}
              loading={testMutation.isPending}
            />
            <Button text="Cancel" onClick={handleClose} />
            <Button
              text="Save"
              intent={Intent.PRIMARY}
              onClick={handleSave}
              loading={createMutation.isPending || updateMutation.isPending}
              disabled={!form.name || !testPassed}
            />
          </>
        }
      >
        {!testPassed && (
          <span style={{ fontSize: 12, color: 'var(--text-muted, #999)' }}>
            Test the connection before saving
          </span>
        )}
      </DialogFooter>
    </Dialog>
  )
}
