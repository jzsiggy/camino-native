import { create } from 'zustand'
import type { QueryResult } from '@shared/types/query'

export interface EditorTab {
  id: string
  title: string
  connectionId: string
  content: string
  isDirty: boolean
  result?: QueryResult
  isExecuting: boolean
}

export interface EditorState {
  tabs: EditorTab[]
  activeTabId: string | null

  openTab: (tab: EditorTab) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  setTabResult: (id: string, result: QueryResult) => void
  setTabExecuting: (id: string, executing: boolean) => void
  setTabTitle: (id: string, title: string) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) =>
    set((state) => {
      const existing = state.tabs.find((t) => t.id === tab.id)
      if (existing) return { activeTabId: tab.id }
      return { tabs: [...state.tabs, tab], activeTabId: tab.id }
    }),

  closeTab: (id) =>
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id)
      const activeTabId =
        state.activeTabId === id ? (tabs.length > 0 ? tabs[tabs.length - 1].id : null) : state.activeTabId
      return { tabs, activeTabId }
    }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, content, isDirty: true } : t))
    })),

  setTabResult: (id, result) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, result, isExecuting: false } : t))
    })),

  setTabExecuting: (id, executing) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, isExecuting: executing } : t))
    })),

  setTabTitle: (id, title) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, title } : t))
    }))
}))
