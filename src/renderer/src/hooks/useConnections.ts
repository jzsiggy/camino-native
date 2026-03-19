import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { connectionApi } from '../lib/ipc-client'
import type { ConnectionCreateInput, ConnectionUpdateInput } from '@shared/types/connection'
import { useAppStore } from '../stores/app.store'

export function useConnections() {
  return useQuery({
    queryKey: ['connections'],
    queryFn: connectionApi.list
  })
}

export function useConnection(id: string | null) {
  return useQuery({
    queryKey: ['connection', id],
    queryFn: () => (id ? connectionApi.get(id) : null),
    enabled: !!id
  })
}

export function useCreateConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ConnectionCreateInput) => connectionApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] })
  })
}

export function useUpdateConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ConnectionUpdateInput) => connectionApi.update(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['connections'] })
  })
}

export function useDeleteConnection() {
  const queryClient = useQueryClient()
  const { removeConnectedId } = useAppStore()
  return useMutation({
    mutationFn: (id: string) => connectionApi.delete(id),
    onSuccess: (_data, id) => {
      removeConnectedId(id)
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    }
  })
}

export function useTestConnection() {
  return useMutation({
    mutationFn: connectionApi.test
  })
}

export function useConnectConnection() {
  const { addConnectedId } = useAppStore()
  return useMutation({
    mutationFn: connectionApi.connect,
    onSuccess: (_data, id) => addConnectedId(id)
  })
}

export function useDisconnectConnection() {
  const { removeConnectedId } = useAppStore()
  return useMutation({
    mutationFn: connectionApi.disconnect,
    onSuccess: (_data, id) => removeConnectedId(id)
  })
}
