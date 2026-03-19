import React from 'react'
import { Icon } from '@blueprintjs/core'
import { useEditorStore } from '../../stores/editor.store'
import { useAppStore } from '../../stores/app.store'
import { v4 as uuid } from 'uuid'

export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab, openTab } = useEditorStore()
  const { activeConnectionId } = useAppStore()

  const handleNewTab = () => {
    if (!activeConnectionId) return
    openTab({
      id: uuid(),
      title: `Query ${tabs.length + 1}`,
      connectionId: activeConnectionId,
      content: '',
      isDirty: false,
      isExecuting: false
    })
  }

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`editor-tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <Icon icon="document" size={12} />
          <span>{tab.title}{tab.isDirty ? ' •' : ''}</span>
          <span
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation()
              closeTab(tab.id)
            }}
          >
            <Icon icon="small-cross" size={12} />
          </span>
        </div>
      ))}
      <div
        className="editor-tab"
        onClick={handleNewTab}
        style={{ cursor: 'pointer', padding: '0 8px' }}
      >
        <Icon icon="plus" size={12} />
      </div>
    </div>
  )
}
