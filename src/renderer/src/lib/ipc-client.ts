import { IPC } from '@shared/constants/ipc-channels'
import type { ConnectionConfig, ConnectionCreateInput, ConnectionUpdateInput, ConnectionTestResult } from '@shared/types/connection'
import type { QueryRequest, QueryResult } from '@shared/types/query'
import type { DatabaseSchema, ColumnDetail } from '@shared/types/schema'
import type { Conversation, ChatMessage, AiConnectionContext, AiStreamChunk, WizardQuestion } from '@shared/types/ai'
import type { Script } from '@shared/types/script'

function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return window.api.invoke(channel, ...args) as Promise<T>
}

function on(channel: string, callback: (...args: unknown[]) => void): () => void {
  return window.api.on(channel, callback)
}

// Connection API
export const connectionApi = {
  list: () => invoke<ConnectionConfig[]>(IPC.CONNECTION_LIST),
  get: (id: string) => invoke<ConnectionConfig | null>(IPC.CONNECTION_GET, id),
  create: (input: ConnectionCreateInput) => invoke<ConnectionConfig>(IPC.CONNECTION_CREATE, input),
  update: (input: ConnectionUpdateInput) => invoke<{ success: boolean }>(IPC.CONNECTION_UPDATE, input),
  delete: (id: string) => invoke<{ success: boolean }>(IPC.CONNECTION_DELETE, id),
  test: (input: ConnectionCreateInput) => invoke<ConnectionTestResult>(IPC.CONNECTION_TEST, input),
  connect: (id: string) => invoke<{ success: boolean }>(IPC.CONNECTION_CONNECT, id),
  disconnect: (id: string) => invoke<{ success: boolean }>(IPC.CONNECTION_DISCONNECT, id)
}

// Schema API
export const schemaApi = {
  getDatabases: (connectionId: string) => invoke<string[]>(IPC.SCHEMA_GET_DATABASES, connectionId),
  getSchemas: (connectionId: string) => invoke<string[]>(IPC.SCHEMA_GET_SCHEMAS, connectionId),
  getTables: (connectionId: string, schema?: string) => invoke<{ name: string; type: 'table' | 'view' }[]>(IPC.SCHEMA_GET_TABLES, connectionId, schema),
  getColumns: (connectionId: string, table: string, schema?: string) => invoke<ColumnDetail[]>(IPC.SCHEMA_GET_COLUMNS, connectionId, table, schema),
  getFull: (connectionId: string) => invoke<DatabaseSchema>(IPC.SCHEMA_GET_FULL, connectionId),
  refresh: (connectionId: string) => invoke<DatabaseSchema>(IPC.SCHEMA_REFRESH, connectionId)
}

// Query API
export const queryApi = {
  execute: (request: QueryRequest) => invoke<QueryResult>(IPC.QUERY_EXECUTE, request)
}

// AI API
export const aiApi = {
  sendMessage: (conversationId: string, message: string) =>
    invoke<{ messageId: string; content: string; sqlGenerated?: string }>(IPC.AI_CHAT_SEND, conversationId, message),
  onStream: (callback: (chunk: AiStreamChunk) => void) => on(IPC.AI_CHAT_STREAM, callback as (...args: unknown[]) => void),
  onStreamEnd: (callback: (chunk: AiStreamChunk) => void) => on(IPC.AI_CHAT_STREAM_END, callback as (...args: unknown[]) => void),
  onStreamError: (callback: (chunk: AiStreamChunk) => void) => on(IPC.AI_CHAT_STREAM_ERROR, callback as (...args: unknown[]) => void),
  wizardStart: (connectionId: string) => invoke<{ schemaSummary: string; questions: WizardQuestion[] }>(IPC.AI_SETUP_WIZARD_START, connectionId),
  wizardAnswer: (
    connectionId: string,
    answers: Record<string, string>,
    questions: { id: string; question: string }[],
    additionalContext: string
  ) => invoke<{ success: boolean }>(IPC.AI_SETUP_WIZARD_ANSWER, connectionId, answers, questions, additionalContext),
  wizardStatus: (connectionId: string) => invoke<{ completed: boolean }>(IPC.AI_WIZARD_STATUS, connectionId),
  getContext: (connectionId: string) => invoke<AiConnectionContext[]>(IPC.AI_CONTEXT_GET, connectionId),
  updateContext: (contextId: string, content: string) => invoke<{ success: boolean }>(IPC.AI_CONTEXT_UPDATE, contextId, content),
  deleteContext: (contextId: string) => invoke<{ success: boolean }>(IPC.AI_CONTEXT_DELETE, contextId)
}

// Script API
export const scriptApi = {
  list: (connectionId: string) => invoke<Script[]>(IPC.SCRIPT_LIST, connectionId),
  get: (id: string) => invoke<Script | null>(IPC.SCRIPT_GET, id),
  create: (connectionId: string, title?: string) => invoke<Script>(IPC.SCRIPT_CREATE, connectionId, title),
  update: (id: string, updates: { title?: string; content?: string }) => invoke<{ success: boolean }>(IPC.SCRIPT_UPDATE, id, updates),
  delete: (id: string) => invoke<{ success: boolean }>(IPC.SCRIPT_DELETE, id)
}

// Conversation API
export const conversationApi = {
  list: (connectionId: string) => invoke<Conversation[]>(IPC.CONVERSATION_LIST, connectionId),
  get: (id: string) => invoke<Conversation | null>(IPC.CONVERSATION_GET, id),
  create: (connectionId: string, title?: string) => invoke<Conversation>(IPC.CONVERSATION_CREATE, connectionId, title),
  delete: (id: string) => invoke<{ success: boolean }>(IPC.CONVERSATION_DELETE, id),
  messages: (conversationId: string) => invoke<ChatMessage[]>(IPC.CONVERSATION_MESSAGES, conversationId)
}

// Settings API
export const settingsApi = {
  get: <T>(key: string) => invoke<T | null>(IPC.SETTINGS_GET, key),
  set: (key: string, value: unknown) => invoke<{ success: boolean }>(IPC.SETTINGS_SET, key, value),
  getAll: () => invoke<Record<string, unknown>>(IPC.SETTINGS_GET_ALL)
}
