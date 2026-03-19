import { useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { aiApi, conversationApi } from '../lib/ipc-client'
import { useAiStore } from '../stores/ai.store'
import type { AiStreamChunk } from '@shared/types/ai'

export function useConversations(connectionId: string | null) {
  return useQuery({
    queryKey: ['conversations', connectionId],
    queryFn: () => conversationApi.list(connectionId!),
    enabled: !!connectionId
  })
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => conversationApi.messages(conversationId!),
    enabled: !!conversationId
  })
}

export function useCreateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ connectionId, title }: { connectionId: string; title?: string }) =>
      conversationApi.create(connectionId, title),
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['conversations', vars.connectionId] })
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => conversationApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
  })
}

export function useSendMessage() {
  const queryClient = useQueryClient()
  const { setIsStreaming, appendStreamingContent, clearStreamingContent } = useAiStore()

  return useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      clearStreamingContent()
      setIsStreaming(true)
      try {
        const result = await aiApi.sendMessage(conversationId, message)
        return result
      } finally {
        setIsStreaming(false)
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] })
      clearStreamingContent()
    }
  })
}

export function useAiStream() {
  const { appendStreamingContent, setIsStreaming, clearStreamingContent } = useAiStore()

  useEffect(() => {
    const unsubStream = aiApi.onStream((chunk: unknown) => {
      const data = chunk as AiStreamChunk
      if (data.type === 'text') {
        appendStreamingContent(data.content)
      }
    })

    const unsubEnd = aiApi.onStreamEnd(() => {
      setIsStreaming(false)
    })

    const unsubError = aiApi.onStreamError(() => {
      setIsStreaming(false)
      clearStreamingContent()
    })

    return () => {
      unsubStream()
      unsubEnd()
      unsubError()
    }
  }, [appendStreamingContent, setIsStreaming, clearStreamingContent])
}

export function useAiContext(connectionId: string | null) {
  return useQuery({
    queryKey: ['aiContext', connectionId],
    queryFn: () => aiApi.getContext(connectionId!),
    enabled: !!connectionId
  })
}

export function useWizard() {
  return useMutation({
    mutationFn: (connectionId: string) => aiApi.wizardStart(connectionId)
  })
}

export function useWizardAnswer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ connectionId, answers }: { connectionId: string; answers: Record<string, string> }) =>
      aiApi.wizardAnswer(connectionId, answers),
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['aiContext', vars.connectionId] })
  })
}
