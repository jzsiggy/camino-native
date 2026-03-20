import React from 'react'
import { Allotment } from 'allotment'
import { Button, Icon } from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useAiStore } from '../../stores/ai.store'
import { ConnectionTree } from '../connections/ConnectionTree'
import { SidebarItemList } from './SidebarItemList'
import { useScripts, useCreateScript, useDeleteScript, useUpdateScript } from '../../hooks/useScripts'
import { useConversations, useCreateConversation, useUpdateConversation, useDeleteConversation, useWizardStatus } from '../../hooks/useAiChat'
import { useConnections } from '../../hooks/useConnections'

export const Sidebar: React.FC = () => {
  const { setConnectionDialogOpen, setSettingsDialogOpen, activeConnectionId, activeItemType, activeScriptId, selectItem } = useAppStore()
  const { activeConversationId, setActiveConversationId } = useAiStore()
  const { data: wizardStatus } = useWizardStatus(activeConnectionId)
  const { data: connections = [] } = useConnections()
  const { data: scripts = [] } = useScripts(activeConnectionId)
  const { data: conversations = [] } = useConversations(activeConnectionId)
  const createScript = useCreateScript()
  const updateScript = useUpdateScript()
  const deleteScript = useDeleteScript()
  const createConversation = useCreateConversation()
  const updateConversation = useUpdateConversation()
  const deleteConversation = useDeleteConversation()

  const activeConnection = connections.find((c) => c.id === activeConnectionId)

  const handleNewScript = async () => {
    if (!activeConnectionId) return
    const script = await createScript.mutateAsync({ connectionId: activeConnectionId })
    selectItem('script', script.id)
  }

  const handleNewConversation = async () => {
    if (!activeConnectionId) return
    const conv = await createConversation.mutateAsync({ connectionId: activeConnectionId })
    setActiveConversationId(conv.id)
    selectItem('conversation', conv.id)
  }

  const handleSelectScript = (id: string) => {
    selectItem('script', id)
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
    selectItem('conversation', id)
  }

  const handleRenameScript = (id: string, newTitle: string) => {
    updateScript.mutate({ id, updates: { title: newTitle } })
  }

  const handleDeleteScript = (id: string) => {
    deleteScript.mutate(id)
    if (activeScriptId === id) {
      selectItem(null, null)
    }
  }

  const handleRenameConversation = (id: string, newTitle: string) => {
    updateConversation.mutate({ id, updates: { title: newTitle } })
  }

  const handleDeleteConversation = (id: string) => {
    deleteConversation.mutate(id)
    if (activeConversationId === id) {
      setActiveConversationId(null)
      selectItem(null, null)
    }
  }

  return (
    <div className="sidebar" style={{ width: '100%', height: '100%' }}>
      <Allotment vertical>
        <Allotment.Pane minSize={100} preferredSize={200}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
        </Allotment.Pane>
        <Allotment.Pane minSize={100}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="sidebar-header">
              <h3>{activeConnection ? activeConnection.name : 'Scripts & Conversations'}</h3>
              {activeConnectionId && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button minimal small icon="document" title="New Script" onClick={handleNewScript} />
                  <Button
                    minimal
                    small
                    icon="chat"
                    title={wizardStatus?.completed ? 'New Conversation' : 'Run the AI Setup Wizard first'}
                    disabled={!wizardStatus?.completed}
                    onClick={handleNewConversation}
                  />
                </div>
              )}
            </div>
            <div className="sidebar-content">
              {!activeConnectionId ? (
                <div style={{ padding: '12px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Select a connection to view scripts and conversations
                </div>
              ) : (
                <>
                  <div className="sidebar-section-label">
                    <Icon icon="document" size={10} />
                    <span>Scripts</span>
                  </div>
                  <SidebarItemList
                    items={(scripts || []).map((s) => ({ id: s.id, title: s.title, icon: 'document' as const }))}
                    selectedId={activeItemType === 'script' ? activeScriptId : null}
                    onSelect={handleSelectScript}
                    onRename={handleRenameScript}
                    onDelete={handleDeleteScript}
                  />
                  <div className="sidebar-section-label" style={{ marginTop: 8 }}>
                    <Icon icon="chat" size={10} />
                    <span>Conversations</span>
                  </div>
                  <SidebarItemList
                    items={(conversations || []).map((c) => ({ id: c.id, title: c.title, icon: 'chat' as const }))}
                    selectedId={activeItemType === 'conversation' ? activeConversationId : null}
                    onSelect={handleSelectConversation}
                    onRename={handleRenameConversation}
                    onDelete={handleDeleteConversation}
                  />
                </>
              )}
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  )
}
