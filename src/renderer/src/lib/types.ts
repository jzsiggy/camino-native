// Re-export shared types for convenient access in renderer
export type { ConnectionConfig, ConnectionCreateInput, ConnectionUpdateInput, ConnectionTestResult, DatabaseEngine } from '@shared/types/connection'
export type { QueryResult, QueryRequest, ColumnInfo } from '@shared/types/query'
export type { DatabaseSchema, SchemaInfo, TableInfo, ColumnDetail, SchemaCache } from '@shared/types/schema'
export type { AiProvider, AiSettings, ChatMessage, Conversation, AiContextType, AiConnectionContext, AiStreamChunk, WizardQuestion, WizardState } from '@shared/types/ai'
export type { AppSettings } from '@shared/types/settings'
export { DEFAULT_SETTINGS } from '@shared/types/settings'
