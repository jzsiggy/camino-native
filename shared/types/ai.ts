export type AiProvider = 'anthropic' | 'openai'

export interface AiSettings {
  provider: AiProvider
  model: string
  apiKey?: string // Decrypted in memory only
  maxTokens: number
  temperature: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  sqlGenerated?: string
  sqlResults?: string
  chartConfig?: string
  tokenCount?: number
  createdAt: string
}

export interface Conversation {
  id: string
  connectionId: string
  title: string
  createdAt: string
  updatedAt: string
}

export type AiContextType =
  | 'schema_summary'
  | 'business_rule'
  | 'naming_convention'
  | 'relationship_note'
  | 'user_correction'
  | 'custom'

export interface AiConnectionContext {
  id: string
  connectionId: string
  contextType: AiContextType
  content: string
  source: string
  createdAt: string
  updatedAt: string
}

export interface AiStreamChunk {
  type: 'text' | 'done' | 'error' | 'sql_executing'
  content: string
  messageId?: string
}

export interface WizardQuestion {
  id: string
  question: string
  context: string
}

export interface WizardState {
  step: 'introspecting' | 'reviewing' | 'questions' | 'complete'
  schemaSummary?: string
  questions?: WizardQuestion[]
}
