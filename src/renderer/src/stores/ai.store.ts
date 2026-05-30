import { create } from 'zustand'
import type { ChatMessage, Conversation } from '@shared/types/ai'

export interface AiState {
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void

  streamingContent: string
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  clearStreamingContent: () => void

  streamError: string | null
  setStreamError: (error: string | null) => void

  isStreaming: boolean
  setIsStreaming: (streaming: boolean) => void

  isExecutingQuery: boolean
  setIsExecutingQuery: (executing: boolean) => void

  wizardOpen: boolean
  setWizardOpen: (open: boolean) => void

  pendingUserMessage: string | null
  setPendingUserMessage: (msg: string | null) => void

  contextViewerOpen: boolean
  setContextViewerOpen: (open: boolean) => void
}

export const useAiStore = create<AiState>((set) => ({
  activeConversationId: null,
  // Switching conversations must clear transient per-conversation state so a
  // message left over from a failed/in-flight send doesn't leak into another thread.
  setActiveConversationId: (id) =>
    set({
      activeConversationId: id,
      pendingUserMessage: null,
      streamingContent: '',
      streamError: null
    }),

  streamingContent: '',
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  clearStreamingContent: () => set({ streamingContent: '' }),

  streamError: null,
  setStreamError: (error) => set({ streamError: error }),

  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  isExecutingQuery: false,
  setIsExecutingQuery: (executing) => set({ isExecutingQuery: executing }),

  wizardOpen: false,
  setWizardOpen: (open) => set({ wizardOpen: open }),

  pendingUserMessage: null,
  setPendingUserMessage: (msg) => set({ pendingUserMessage: msg }),

  contextViewerOpen: false,
  setContextViewerOpen: (open) => set({ contextViewerOpen: open })
}))
