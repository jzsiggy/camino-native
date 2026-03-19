import { create } from 'zustand'
import type { ConnectionConfig } from '@shared/types/connection'

export interface AppState {
  // Sidebar
  sidebarWidth: number
  setSidebarWidth: (width: number) => void

  // Active connection
  activeConnectionId: string | null
  setActiveConnectionId: (id: string | null) => void

  // Connected connections
  connectedIds: Set<string>
  addConnectedId: (id: string) => void
  removeConnectedId: (id: string) => void

  // Theme
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Dialogs
  connectionDialogOpen: boolean
  setConnectionDialogOpen: (open: boolean) => void
  editingConnection: ConnectionConfig | null
  setEditingConnection: (conn: ConnectionConfig | null) => void
  settingsDialogOpen: boolean
  setSettingsDialogOpen: (open: boolean) => void
  connectionSettingsOpen: boolean
  setConnectionSettingsOpen: (open: boolean) => void
  connectionSettingsId: string | null
  setConnectionSettingsId: (id: string | null) => void

  // Active item selection
  activeItemType: 'script' | 'conversation' | null
  activeScriptId: string | null
  selectItem: (type: 'script' | 'conversation' | null, id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarWidth: 280,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  activeConnectionId: null,
  setActiveConnectionId: (id) => set({ activeConnectionId: id }),

  connectedIds: new Set(),
  addConnectedId: (id) =>
    set((state) => ({ connectedIds: new Set([...state.connectedIds, id]) })),
  removeConnectedId: (id) =>
    set((state) => {
      const next = new Set(state.connectedIds)
      next.delete(id)
      return { connectedIds: next }
    }),

  theme: 'dark',
  setTheme: (theme) => set({ theme }),

  connectionDialogOpen: false,
  setConnectionDialogOpen: (open) => set({ connectionDialogOpen: open }),
  editingConnection: null,
  setEditingConnection: (conn) => set({ editingConnection: conn }),
  settingsDialogOpen: false,
  setSettingsDialogOpen: (open) => set({ settingsDialogOpen: open }),
  connectionSettingsOpen: false,
  setConnectionSettingsOpen: (open) => set({ connectionSettingsOpen: open }),
  connectionSettingsId: null,
  setConnectionSettingsId: (id) => set({ connectionSettingsId: id }),

  activeItemType: null,
  activeScriptId: null,
  selectItem: (type, id) => {
    if (type === 'script') {
      set({ activeItemType: 'script', activeScriptId: id })
    } else if (type === 'conversation') {
      set({ activeItemType: 'conversation', activeScriptId: null })
      // activeConversationId is managed in ai.store
    } else {
      set({ activeItemType: null, activeScriptId: null })
    }
  }
}))
