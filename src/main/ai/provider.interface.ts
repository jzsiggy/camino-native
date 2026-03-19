export interface AiProviderMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AiProviderOptions {
  model: string
  maxTokens: number
  temperature: number
  systemPrompt?: string
}

export interface AiProviderInterface {
  /** Stream a chat completion, calling onChunk for each text delta */
  chat(
    messages: AiProviderMessage[],
    options: AiProviderOptions,
    onChunk: (text: string) => void
  ): Promise<string>
}
