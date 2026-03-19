import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scriptApi } from '../lib/ipc-client'

export function useScripts(connectionId: string | null) {
  return useQuery({
    queryKey: ['scripts', connectionId],
    queryFn: () => scriptApi.list(connectionId!),
    enabled: !!connectionId
  })
}

export function useScript(id: string | null) {
  return useQuery({
    queryKey: ['script', id],
    queryFn: () => scriptApi.get(id!),
    enabled: !!id
  })
}

export function useCreateScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ connectionId, title }: { connectionId: string; title?: string }) =>
      scriptApi.create(connectionId, title),
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({ queryKey: ['scripts', vars.connectionId] })
  })
}

export function useUpdateScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { title?: string; content?: string } }) =>
      scriptApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scripts'] })
      queryClient.invalidateQueries({ queryKey: ['script'] })
    }
  })
}

export function useDeleteScript() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => scriptApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scripts'] })
  })
}
