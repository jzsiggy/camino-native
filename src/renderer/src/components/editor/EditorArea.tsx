import React from 'react'
import { useEditorStore } from '../../stores/editor.store'
import { SqlEditor } from './SqlEditor'

export const EditorArea: React.FC = () => {
  const { tabs, activeTabId } = useEditorStore()
  const activeTab = tabs.find((t) => t.id === activeTabId)

  if (!activeTab) {
    return (
      <div className="empty-state">
        <h3>No editor open</h3>
        <p>Connect to a database and open a new query tab</p>
      </div>
    )
  }

  return <SqlEditor key={activeTab.id} tab={activeTab} />
}
