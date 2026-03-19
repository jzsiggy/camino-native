import React, { useState } from 'react'
import { Icon, Menu, MenuItem, showContextMenu } from '@blueprintjs/core'
import { useConnections, useConnectConnection, useDisconnectConnection, useDeleteConnection } from '../../hooks/useConnections'
import { useAppStore } from '../../stores/app.store'
import { SchemaExplorer } from '../schema/SchemaExplorer'
import type { ConnectionConfig, DatabaseEngine } from '@shared/types/connection'

const engineIcons: Record<DatabaseEngine, string> = {
  postgres: 'database',
  mysql: 'database',
  sqlite: 'document'
}

export const ConnectionTree: React.FC = () => {
  const { data: connections = [] } = useConnections()
  const { activeConnectionId, setActiveConnectionId, connectedIds, setConnectionDialogOpen, setEditingConnection, setConnectionSettingsOpen, setConnectionSettingsId } = useAppStore()
  const connectMutation = useConnectConnection()
  const disconnectMutation = useDisconnectConnection()
  const deleteMutation = useDeleteConnection()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConnect = async (id: string) => {
    await connectMutation.mutateAsync(id)
    setExpandedIds((prev) => new Set([...prev, id]))
  }

  const handleContextMenu = (e: React.MouseEvent, conn: ConnectionConfig) => {
    e.preventDefault()
    const isConnected = connectedIds.has(conn.id)

    showContextMenu({
      content: (
        <Menu>
          {isConnected ? (
            <MenuItem
              icon="offline"
              text="Disconnect"
              onClick={() => disconnectMutation.mutate(conn.id)}
            />
          ) : (
            <MenuItem
              icon="link"
              text="Connect"
              onClick={() => handleConnect(conn.id)}
            />
          )}
          <MenuItem
            icon="edit"
            text="Edit"
            onClick={() => {
              setEditingConnection(conn)
              setConnectionDialogOpen(true)
            }}
          />
          <MenuItem
            icon="cog"
            text="Settings"
            onClick={() => {
              setConnectionSettingsId(conn.id)
              setConnectionSettingsOpen(true)
            }}
          />
          <MenuItem
            icon="trash"
            text="Delete"
            intent="danger"
            onClick={() => {
              if (confirm(`Delete connection "${conn.name}"?`)) {
                deleteMutation.mutate(conn.id)
              }
            }}
          />
        </Menu>
      ),
      targetOffset: { left: e.clientX, top: e.clientY }
    })
  }

  if (connections.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 24, height: 'auto' }}>
        <p style={{ fontSize: 12 }}>No connections yet</p>
      </div>
    )
  }

  return (
    <div>
      {connections.map((conn) => {
        const isConnected = connectedIds.has(conn.id)
        const isExpanded = expandedIds.has(conn.id)
        const isActive = conn.id === activeConnectionId

        return (
          <div key={conn.id}>
            <div
              className={`connection-tree-item ${isActive ? 'active' : ''} ${isConnected ? 'connected' : ''}`}
              onClick={() => {
                setActiveConnectionId(conn.id)
                if (isConnected) toggleExpanded(conn.id)
                else handleConnect(conn.id)
              }}
              onContextMenu={(e) => handleContextMenu(e, conn)}
              onDoubleClick={() => {
                if (!isConnected) handleConnect(conn.id)
              }}
            >
              <Icon
                icon={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={12}
                style={{ opacity: isConnected ? 1 : 0.3 }}
              />
              <span className={`connection-status ${isConnected ? 'connected' : ''}`} />
              <Icon icon={engineIcons[conn.engine] as any} size={14} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {conn.name}
              </span>
            </div>
            {isExpanded && isConnected && (
              <div className="schema-tree">
                <SchemaExplorer connectionId={conn.id} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
