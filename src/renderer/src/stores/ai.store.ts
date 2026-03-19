import { create } from 'zustand'
import type { ChatMessage, Conversation } from '@shared/types/ai'

export interface AiState {
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void

  streamingContent: string
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  clearStreamingContent: () => void

  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void

  wizardOpen: boolean
  setWizardOpen: (open: boolean) => void

  contextViewerOpen: boolean
  setContextViewerOpen: (open: boolean) => void
}

export const useAiStore = create<AiState>((set) => ({
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  streamingContent: '',
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  clearStreamingContent: () => set({ streamingContent: '' }),

  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  wizardOpen: false,
  setWizardOpen: (open) => set({ wizardOpen: open }),

  contextViewerOpen: false,
  setContextViewerOpen: (open) => set({ contextViewerOpen: open })
}))
