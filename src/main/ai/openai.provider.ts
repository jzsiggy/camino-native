import OpenAI from 'openai'
import type { AiProviderInterface, AiProviderMessage, AiProviderOptions } from './provider.interface'

export class OpenAIProvider implements AiProviderInterface {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async chat(
    messages: AiProviderMessage[],
    options: AiProviderOptions,
    onChunk: (text: string) => void
  ): Promise<string> {
    const openaiMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content
    }))

    if (options.systemPrompt) {
      openaiMessages.unshift({ role: 'system', content: options.systemPrompt })
    }

    let fullResponse = ''

    const stream = await this.client.chat.completions.create({
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: openaiMessages,
      stream: true
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        fullResponse += delta
        onChunk(delta)
      }
    }

    return fullResponse
  }
}
