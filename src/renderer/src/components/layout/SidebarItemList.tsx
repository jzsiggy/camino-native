import React, { useState, useRef, useEffect } from 'react'
import { Icon, Menu, MenuItem, showContextMenu } from '@blueprintjs/core'

interface SidebarItem {
  id: string
  title: string
  icon: 'document' | 'chat'
}

interface Props {
  items: SidebarItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRename: (id: string, newTitle: string) => void
  onDelete: (id: string) => void
}

export const SidebarItemList: React.FC<Props> = ({ items, selectedId, onSelect, onRename, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim())
    }
    setEditingId(null)
  }

  const handleContextMenu = (e: React.MouseEvent, item: SidebarItem) => {
    e.preventDefault()
    showContextMenu({
      content: (
        <Menu>
          <MenuItem
            icon="edit"
            text="Rename"
            onClick={() => {
              setEditingId(item.id)
              setEditValue(item.title)
            }}
          />
          <MenuItem
            icon="trash"
            text="Delete"
            intent="danger"
            onClick={() => {
              if (confirm(`Delete "${item.title}"?`)) {
                onDelete(item.id)
              }
            }}
          />
        </Menu>
      ),
      targetOffset: { left: e.clientX, top: e.clientY }
    })
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        No items yet
      </div>
    )
  }

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.id}
          className={`sidebar-item ${item.id === selectedId ? 'selected' : ''}`}
          onClick={() => onSelect(item.id)}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          <Icon icon={item.icon} size={12} />
          {editingId === item.id ? (
            <input
              ref={inputRef}
              className="sidebar-rename-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitRename()
                } else if (e.key === 'Escape') {
                  setEditingId(null)
                }
                e.stopPropagation()
              }}
              onBlur={commitRename}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.title}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
