import { useEffect } from 'react'
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

export function useUpdateConversation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { title?: string } }) =>
      conversationApi.update(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
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
  const { setIsStreaming, appendStreamingContent, clearStreamingContent, setPendingUserMessage } = useAiStore()

  return useMutation({
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      clearStreamingContent()
      setPendingUserMessage(message)
      setIsStreaming(true)
      try {
        const result = await aiApi.sendMessage(conversationId, message)
        return result
      } finally {
        setIsStreaming(false)
      }
    },
    onSuccess: (_data, vars) => {
      setPendingUserMessage(null)
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] })
      clearStreamingContent()
    }
  })
}

export function useAiStream() {
  const { appendStreamingContent, setIsStreaming, clearStreamingContent, setIsExecutingQuery } = useAiStore()

  useEffect(() => {
    const unsubStream = aiApi.onStream((chunk: unknown) => {
      const data = chunk as AiStreamChunk
      if (data.type === 'text') {
        setIsExecutingQuery(false)
        appendStreamingContent(data.content)
      } else if (data.type === 'sql_executing') {
        setIsExecutingQuery(true)
      }
    })

    const unsubEnd = aiApi.onStreamEnd(() => {
      setIsStreaming(false)
      setIsExecutingQuery(false)
    })

    const unsubError = aiApi.onStreamError(() => {
      setIsStreaming(false)
      setIsExecutingQuery(false)
      clearStreamingContent()
    })

    return () => {
      unsubStream()
      unsubEnd()
      unsubError()
    }
  }, [appendStreamingContent, setIsStreaming, clearStreamingContent, setIsExecutingQuery])
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
    mutationFn: ({
      connectionId,
      answers,
      questions,
      additionalContext
    }: {
      connectionId: string
      answers: Record<string, string>
      questions: { id: string; question: string }[]
      additionalContext: string
    }) => aiApi.wizardAnswer(connectionId, answers, questions, additionalContext),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['aiContext', vars.connectionId] })
      queryClient.invalidateQueries({ queryKey: ['wizardStatus', vars.connectionId] })
    }
  })
}

export function useWizardStatus(connectionId: string | null) {
  return useQuery({
    queryKey: ['wizardStatus', connectionId],
    queryFn: () => aiApi.wizardStatus(connectionId!),
    enabled: !!connectionId
  })
}
