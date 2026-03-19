import React from 'react'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'
import { ScriptView } from '../editor/ScriptView'
import { ConversationView } from '../ai/ConversationView'
import { useAppStore } from '../../stores/app.store'
import { Icon } from '@blueprintjs/core'

const EmptyMainState: React.FC = () => (
  <div className="empty-state">
    <Icon icon="application" size={40} style={{ opacity: 0.2 }} />
    <h3>Welcome to Camino</h3>
    <p>Select or create a script or conversation from the sidebar</p>
  </div>
)

export const AppShell: React.FC = () => {
  const { activeItemType } = useAppStore()

  return (
    <div className="app-shell">
      <div className="titlebar-drag" />
      <div className="app-body">
        <Allotment>
          <Allotment.Pane minSize={200} preferredSize={280} maxSize={500}>
            <Sidebar />
          </Allotment.Pane>
          <Allotment.Pane>
            {activeItemType === null && <EmptyMainState />}
            {activeItemType === 'script' && <ScriptView />}
            {activeItemType === 'conversation' && <ConversationView />}
          </Allotment.Pane>
        </Allotment>
      </div>
      <StatusBar />
    </div>
  )
}
