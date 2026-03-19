import Anthropic from '@anthropic-ai/sdk'
import type { AiProviderInterface, AiProviderMessage, AiProviderOptions } from './provider.interface'

export class AnthropicProvider implements AiProviderInterface {
  private client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async chat(
    messages: AiProviderMessage[],
    options: AiProviderOptions,
    onChunk: (text: string) => void
  ): Promise<string> {
    const systemMessage = options.systemPrompt || messages.find((m) => m.role === 'system')?.content
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    let fullResponse = ''

    const stream = this.client.messages.stream({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: systemMessage || undefined,
      messages: chatMessages
    })

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullResponse += event.delta.text
        onChunk(event.delta.text)
      }
    }

    return fullResponse
  }
}
