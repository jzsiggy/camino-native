import React, { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { ConnectionDialog } from './components/connections/ConnectionDialog'
import { ConnectionSettingsDialog } from './components/connections/ConnectionSettingsDialog'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { AiSetupWizard } from './components/ai/AiSetupWizard'
import { AiContextViewer } from './components/ai/AiContextViewer'
import { useAppStore } from './stores/app.store'
import { useEditorStore } from './stores/editor.store'
import { useExecuteQuery } from './hooks/useQuery'
import { v4 as uuid } from 'uuid'

const App: React.FC = () => {
  const { theme, activeConnectionId } = useAppStore()
  const { activeTabId, tabs, openTab } = useEditorStore()
  const { execute } = useExecuteQuery()

  // Apply theme class
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'bp5-dark' : ''
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }, [theme])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Cmd+T: New tab
      if (mod && e.key === 't') {
        e.preventDefault()
        if (activeConnectionId) {
          openTab({
            id: uuid(),
            title: `Query ${tabs.length + 1}`,
            connectionId: activeConnectionId,
            content: '',
            isDirty: false,
            isExecuting: false
          })
        }
      }

      // Cmd+Enter is handled by Monaco
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeConnectionId, tabs.length, openTab])

  return (
    <>
      <AppShell />
      <ConnectionDialog />
      <ConnectionSettingsDialog />
      <SettingsDialog />
      <AiSetupWizard />
      <AiContextViewer />
    </>
  )
}

export default App
