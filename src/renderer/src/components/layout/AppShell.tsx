import React from 'react'
import { Allotment } from 'allotment'
import 'allotment/dist/style.css'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { StatusBar } from './StatusBar'
import { EditorArea } from '../editor/EditorArea'
import { ResultsPanel } from '../results/ResultsPanel'
import { AiChatPanel } from '../ai/AiChatPanel'
import { useAppStore } from '../../stores/app.store'

export const AppShell: React.FC = () => {
  const { rightPanel } = useAppStore()

  return (
    <div className="app-shell">
      <div className="titlebar-drag" />
      <div className="app-body">
        <Allotment>
          <Allotment.Pane minSize={200} preferredSize={280} maxSize={500}>
            <Sidebar />
          </Allotment.Pane>
          <Allotment.Pane>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <TabBar />
              <Allotment vertical>
                <Allotment.Pane>
                  <EditorArea />
                </Allotment.Pane>
                <Allotment.Pane minSize={100} preferredSize={300}>
                  {rightPanel === 'ai' ? <AiChatPanel /> : <ResultsPanel />}
                </Allotment.Pane>
              </Allotment>
            </div>
          </Allotment.Pane>
        </Allotment>
      </div>
      <StatusBar />
    </div>
  )
}
