import { useQuery, useQueryClient } from '@tanstack/react-query'
import { schemaApi } from '../lib/ipc-client'

export function useSchemas(connectionId: string | null) {
  return useQuery({
    queryKey: ['schemas', connectionId],
    queryFn: () => schemaApi.getSchemas(connectionId!),
    enabled: !!connectionId
  })
}

export function useTables(connectionId: string | null, schema?: string) {
  return useQuery({
    queryKey: ['tables', connectionId, schema],
    queryFn: () => schemaApi.getTables(connectionId!, schema),
    enabled: !!connectionId
  })
}

export function useColumns(connectionId: string | null, table: string | null, schema?: string) {
  return useQuery({
    queryKey: ['columns', connectionId, table, schema],
    queryFn: () => schemaApi.getColumns(connectionId!, table!, schema),
    enabled: !!connectionId && !!table
  })
}

export function useFullSchema(connectionId: string | null) {
  return useQuery({
    queryKey: ['fullSchema', connectionId],
    queryFn: () => schemaApi.getFull(connectionId!),
    enabled: !!connectionId
  })
}

export function useRefreshSchema(connectionId: string | null) {
  const queryClient = useQueryClient()
  return {
    refresh: async () => {
      if (!connectionId) return
      const schema = await schemaApi.refresh(connectionId)
      queryClient.setQueryData(['fullSchema', connectionId], schema)
      queryClient.invalidateQueries({ queryKey: ['tables', connectionId] })
      queryClient.invalidateQueries({ queryKey: ['schemas', connectionId] })
      return schema
    }
  }
}
