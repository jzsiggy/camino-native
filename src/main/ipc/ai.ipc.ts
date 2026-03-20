import { ipcMain, BrowserWindow } from 'electron'
import { v4 as uuid } from 'uuid'
import { IPC } from '@shared/constants/ipc-channels'
import { getAppDb } from '../db/app-db'
import { decryptString } from '../security/crypto'
import { AnthropicProvider } from '../ai/anthropic.provider'
import { OpenAIProvider } from '../ai/openai.provider'
import type { AiProviderInterface, AiProviderMessage } from '../ai/provider.interface'
import { buildSystemPrompt, buildSchemaText, buildAutoExecSystemPrompt, buildResultsFollowUp, WIZARD_SYSTEM_PROMPT } from '../ai/prompt-templates'
import {
  getConnectionContext,
  getCachedSchema,
  buildContextString,
  parseContextUpdates,
  saveContextUpdate,
  hasWizardContext
} from '../ai/context-manager'
import { poolManager } from '../db/pool-manager'

function getApiKey(key: string): string | null {
  const db = getAppDb()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
  if (!row) return null
  try {
    return decryptString(Buffer.from(row.value, 'base64'))
  } catch {
    return null
  }
}

function getProvider(): { provider: AiProviderInterface; model: string; maxTokens: number; temperature: number } {
  const db = getAppDb()
  const getSetting = (key: string): string | null => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    if (!row) return null
    try { return JSON.parse(row.value) } catch { return row.value }
  }

  const providerName = getSetting('aiProvider') || 'anthropic'
  const model = getSetting('aiModel') || (providerName === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o')
  const maxTokens = Number(getSetting('maxTokens')) || 4096
  const temperature = Number(getSetting('temperature')) || 0.3

  if (providerName === 'openai') {
    const apiKey = getApiKey('openaiApiKey')
    if (!apiKey) throw new Error('OpenAI API key not configured')
    return { provider: new OpenAIProvider(apiKey), model, maxTokens, temperature }
  } else {
    const apiKey = getApiKey('anthropicApiKey')
    if (!apiKey) throw new Error('Anthropic API key not configured')
    return { provider: new AnthropicProvider(apiKey), model, maxTokens, temperature }
  }
}

export function registerAiIpc(): void {
  ipcMain.handle(IPC.AI_CHAT_SEND, async (event, conversationId: string, userMessage: string) => {
    const db = getAppDb()
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) throw new Error('No window found')

    // Get conversation + connection info
    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId) as Record<string, string> | undefined
    if (!conversation) throw new Error('Conversation not found')

    const connectionId = conversation.connection_id
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId) as Record<string, string> | undefined
    if (!connection) throw new Error('Connection not found')

    // Save user message
    const userMsgId = uuid()
    const now = new Date().toISOString()
    db.prepare(
      'INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userMsgId, conversationId, 'user', userMessage, now)

    // Build context
    const cachedSchemaJson = getCachedSchema(connectionId)
    const schema = cachedSchemaJson ? JSON.parse(cachedSchemaJson) : null
    const schemaText = schema ? buildSchemaText(schema) : 'No schema loaded. Run schema introspection first.'
    const contexts = getConnectionContext(connectionId)
    const contextText = buildContextString(contexts)
    const systemPrompt = buildAutoExecSystemPrompt(connection.engine, schemaText, contextText)

    // Load conversation history
    const history = db
      .prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
      .all(conversationId) as { role: string; content: string }[]

    const messages: AiProviderMessage[] = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }))

    // Get AI provider
    const { provider, model, maxTokens, temperature } = getProvider()

    // Stream response — Pass 1: AI generates SQL
    const assistantMsgId = uuid()
    let fullResponse = ''
    let sqlGenerated: string | null = null
    let sqlResults: string | null = null
    let chartConfig: string | null = null

    try {
      fullResponse = await provider.chat(
        messages,
        { model, maxTokens, temperature, systemPrompt },
        (chunk) => {
          window.webContents.send(IPC.AI_CHAT_STREAM, { type: 'text', content: chunk, messageId: assistantMsgId })
        }
      )

      // Extract SQL from response
      const sqlMatch = fullResponse.match(/```sql\n([\s\S]*?)```/)
      sqlGenerated = sqlMatch ? sqlMatch[1].trim() : null

      // Pass 2: Auto-execute SQL and feed results back to AI
      if (sqlGenerated) {
        const adapter = poolManager.getAdapter(connectionId)
        if (adapter) {
          // Notify frontend that query is executing
          window.webContents.send(IPC.AI_CHAT_STREAM, { type: 'sql_executing', content: sqlGenerated, messageId: assistantMsgId })

          try {
            const queryResult = await adapter.execute(sqlGenerated)
            // Format results for AI
            const resultRows = queryResult.rows.slice(0, 50)
            const resultsText = queryResult.error
              ? `Error: ${queryResult.error}`
              : `${queryResult.rowCount} rows returned.\nColumns: ${queryResult.columns.map((c) => c.name).join(', ')}\n\nData:\n${JSON.stringify(resultRows, null, 2)}`

            sqlResults = JSON.stringify({ columns: queryResult.columns.map(c => c.name), rows: resultRows })

            // Pass 2: Feed results to AI for natural language summary
            const pass2Messages: AiProviderMessage[] = [
              ...messages,
              { role: 'assistant', content: fullResponse },
              { role: 'user', content: buildResultsFollowUp(resultsText) }
            ]

            let pass2Response = ''
            pass2Response = await provider.chat(
              pass2Messages,
              { model, maxTokens, temperature, systemPrompt },
              (chunk) => {
                window.webContents.send(IPC.AI_CHAT_STREAM, { type: 'text', content: chunk, messageId: assistantMsgId })
              }
            )

            // Extract chart config from pass 2 response
            const chartMatch = pass2Response.match(/```chart\n([\s\S]*?)```/)
            if (chartMatch) {
              try {
                JSON.parse(chartMatch[1].trim())
                chartConfig = chartMatch[1].trim()
              } catch {
                // Invalid JSON — ignore chart config
              }
              pass2Response = pass2Response.replace(/```chart\n[\s\S]*?```/, '').trim()
            }

            // Append pass 2 response to full response
            fullResponse = fullResponse + '\n\n' + pass2Response
          } catch (execErr) {
            const errorText = `\n\nQuery execution failed: ${(execErr as Error).message}`
            fullResponse = fullResponse + errorText
            sqlResults = JSON.stringify({ error: (execErr as Error).message })
            window.webContents.send(IPC.AI_CHAT_STREAM, { type: 'text', content: errorText, messageId: assistantMsgId })
          }
        }
      }

      // Parse and save context updates
      const updates = parseContextUpdates(fullResponse)
      for (const update of updates) {
        saveContextUpdate(connectionId, update.type, update.content, 'conversation')
      }

      // Strip context_update tags from displayed/saved content
      fullResponse = fullResponse.replace(/<context_update type="[^"]*">[\s\S]*?<\/context_update>/g, '').trim()

      // Save assistant message
      db.prepare(
        'INSERT INTO messages (id, conversation_id, role, content, sql_generated, sql_results, chart_config, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(assistantMsgId, conversationId, 'assistant', fullResponse, sqlGenerated, sqlResults, chartConfig, new Date().toISOString())

      // Update conversation timestamp
      db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?')
        .run(new Date().toISOString(), conversationId)

      window.webContents.send(IPC.AI_CHAT_STREAM_END, {
        type: 'done',
        content: fullResponse,
        messageId: assistantMsgId
      })

      return { messageId: assistantMsgId, content: fullResponse, sqlGenerated, sqlResults, chartConfig }
    } catch (err) {
      window.webContents.send(IPC.AI_CHAT_STREAM_ERROR, {
        type: 'error',
        content: (err as Error).message,
        messageId: assistantMsgId
      })
      throw err
    }
  })

  // AI Setup Wizard
  ipcMain.handle(IPC.AI_SETUP_WIZARD_START, async (event, connectionId: string) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) throw new Error('No window found')

    const db = getAppDb()
    const connection = db.prepare('SELECT * FROM connections WHERE id = ?').get(connectionId) as Record<string, string> | undefined
    if (!connection) throw new Error('Connection not found')

    // Get cached schema, or fetch & cache it now
    let cachedSchemaJson = getCachedSchema(connectionId)
    if (!cachedSchemaJson) {
      const adapter = poolManager.getAdapter(connectionId)
      if (!adapter) throw new Error('Not connected. Please connect to the database first.')
      const schema = await adapter.getFullSchema()
      const db2 = getAppDb()
      db2.prepare(
        `INSERT OR REPLACE INTO schema_cache (connection_id, schema_json, cached_at)
         VALUES (?, ?, datetime('now'))`
      ).run(connectionId, JSON.stringify(schema))
      cachedSchemaJson = JSON.stringify(schema)
    }

    const schema = JSON.parse(cachedSchemaJson)
    const schemaText = buildSchemaText(schema)

    // Generate questions using AI
    const { provider, model, maxTokens, temperature } = getProvider()

    const response = await provider.chat(
      [{ role: 'user', content: `Here is the database schema:\n\n${schemaText}\n\nGenerate clarifying questions.` }],
      { model, maxTokens, temperature, systemPrompt: WIZARD_SYSTEM_PROMPT },
      () => {} // No streaming needed
    )

    // Parse questions
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      const questions = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      return { schemaSummary: schemaText, questions }
    } catch {
      return { schemaSummary: schemaText, questions: [] }
    }
  })

  ipcMain.handle(IPC.AI_SETUP_WIZARD_ANSWER, async (
    _event,
    connectionId: string,
    answers: Record<string, string>,
    questions: { id: string; question: string }[],
    additionalContext: string
  ) => {
    // Save question answers with metadata
    for (const q of questions) {
      const answer = answers[q.id]
      if (answer && answer.trim()) {
        saveContextUpdate(
          connectionId,
          'business_rule',
          answer,
          'wizard',
          JSON.stringify({ questionText: q.question })
        )
      }
    }
    // Save additional context
    if (additionalContext && additionalContext.trim()) {
      saveContextUpdate(
        connectionId,
        'custom',
        additionalContext,
        'wizard',
        JSON.stringify({ subSource: 'additional_context' })
      )
    }

    // Mark wizard as completed on the connection
    const db = getAppDb()
    db.prepare('UPDATE connections SET ai_wizard_completed = 1 WHERE id = ?')
      .run(connectionId)

    return { success: true }
  })

  ipcMain.handle(IPC.AI_WIZARD_STATUS, (_event, connectionId: string) => {
    return { completed: hasWizardContext(connectionId) }
  })

  // Context management
  ipcMain.handle(IPC.AI_CONTEXT_GET, (_event, connectionId: string) => {
    return getConnectionContext(connectionId)
  })

  ipcMain.handle(IPC.AI_CONTEXT_UPDATE, (_event, contextId: string, content: string) => {
    const db = getAppDb()
    db.prepare('UPDATE ai_connection_context SET content = ?, updated_at = ? WHERE id = ?')
      .run(content, new Date().toISOString(), contextId)
    return { success: true }
  })

  ipcMain.handle(IPC.AI_CONTEXT_DELETE, (_event, contextId: string) => {
    const db = getAppDb()
    db.prepare('DELETE FROM ai_connection_context WHERE id = ?').run(contextId)
    return { success: true }
  })
}
