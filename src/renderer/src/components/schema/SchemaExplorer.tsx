import React, { useState } from 'react'
import { Icon, Spinner } from '@blueprintjs/core'
import { useTables, useColumns } from '../../hooks/useSchema'
import type { ColumnDetail } from '@shared/types/schema'

interface Props {
  connectionId: string
}

export const SchemaExplorer: React.FC<Props> = ({ connectionId }) => {
  const { data: tables = [], isLoading } = useTables(connectionId)
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (isLoading) {
    return (
      <div style={{ padding: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
        <Spinner size={12} /> Loading schema...
      </div>
    )
  }

  return (
    <div>
      {tables.map((table) => (
        <div key={table.name}>
          <div className="tree-node" onClick={() => toggleTable(table.name)}>
            <Icon
              icon={expandedTables.has(table.name) ? 'chevron-down' : 'chevron-right'}
              size={10}
            />
            <Icon icon={table.type === 'view' ? 'eye-open' : 'th'} size={12} />
            <span>{table.name}</span>
          </div>
          {expandedTables.has(table.name) && (
            <ColumnList connectionId={connectionId} table={table.name} />
          )}
        </div>
      ))}
      {tables.length === 0 && (
        <div style={{ padding: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
          No tables found
        </div>
      )}
    </div>
  )
}

const ColumnList: React.FC<{ connectionId: string; table: string }> = ({ connectionId, table }) => {
  const { data: columns = [], isLoading } = useColumns(connectionId, table)

  if (isLoading) {
    return <div style={{ padding: '2px 8px 2px 32px', fontSize: 11 }}><Spinner size={10} /></div>
  }

  return (
    <div>
      {columns.map((col: ColumnDetail) => (
        <div key={col.name} className="tree-node tree-node-indent" style={{ paddingLeft: 32 }}>
          <Icon
            icon={col.isPrimaryKey ? 'key' : col.isForeignKey ? 'link' : 'column-layout'}
            size={10}
            style={{ color: col.isPrimaryKey ? '#fab387' : col.isForeignKey ? '#89b4fa' : undefined }}
          />
          <span>{col.name}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 10, marginLeft: 'auto' }}>
            {col.dataType}
          </span>
        </div>
      ))}
    </div>
  )
}
