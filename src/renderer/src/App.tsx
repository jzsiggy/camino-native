import React, { useEffect } from 'react'
import { AppShell } from './components/layout/AppShell'
import { ConnectionDialog } from './components/connections/ConnectionDialog'
import { ConnectionSettingsDialog } from './components/connections/ConnectionSettingsDialog'
import { SettingsDialog } from './components/settings/SettingsDialog'
import { AiSetupWizard } from './components/ai/AiSetupWizard'
import { AiContextViewer } from './components/ai/AiContextViewer'
import { useAppStore } from './stores/app.store'

const App: React.FC = () => {
  const { theme } = useAppStore()

  // Apply theme class
  useEffect(() => {
    document.body.className = theme === 'dark' ? 'bp5-dark' : ''
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }, [theme])

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
