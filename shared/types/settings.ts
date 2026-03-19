export interface AppSettings {
  theme: 'dark' | 'light'
  aiProvider: 'anthropic' | 'openai'
  aiModel: string
  anthropicApiKey?: string
  openaiApiKey?: string
  maxTokens: number
  temperature: number
  editorFontSize: number
  editorTabSize: number
  queryRowLimit: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  aiProvider: 'anthropic',
  aiModel: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.3,
  editorFontSize: 14,
  editorTabSize: 2,
  queryRowLimit: 1000
}
