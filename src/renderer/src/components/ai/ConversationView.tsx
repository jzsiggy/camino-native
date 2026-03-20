import React, { useState, useRef, useEffect } from 'react'
import { Button, Callout, Intent, Icon, Spinner } from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useAiStore } from '../../stores/ai.store'
import { useConversationMessages, useSendMessage, useAiStream } from '../../hooks/useAiChat'
import { useConnection } from '../../hooks/useConnections'
import type { ChatMessage } from '@shared/types/ai'
import { ResultsChart } from './ResultsChart'

export const ConversationView: React.FC = () => {
  const { activeConnectionId } = useAppStore()
  const { activeConversationId, streamingContent, isStreaming, isExecutingQuery, pendingUserMessage } = useAiStore()
  const { data: messages = [] } = useConversationMessages(activeConversationId)
  const { data: connection } = useConnection(activeConnectionId)
  const sendMessage = useSendMessage()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useAiStream()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent, isExecutingQuery])

  const handleSend = async () => {
    if (!input.trim() || !activeConversationId || isStreaming) return
    const msg = input.trim()
    setInput('')
    await sendMessage.mutateAsync({ conversationId: activeConversationId, message: msg })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!activeConversationId) {
    return (
      <div className="empty-state">
        <Icon icon="chat" size={32} style={{ opacity: 0.3 }} />
        <p>No conversation selected</p>
      </div>
    )
  }

  return (
    <div className="conversation-view">
      {connection && (
        <div style={{ padding: '6px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon icon="database" size={10} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{connection.name}</span>
        </div>
      )}
      <div className="ai-chat-messages">
        {messages.map((msg: ChatMessage) => (
          <ConversationMessage key={msg.id} message={msg} />
        ))}
        {pendingUserMessage && (
          <div className="ai-message user">
            <div className="message-content">
              <span>{pendingUserMessage}</span>
            </div>
          </div>
        )}
        {isStreaming && streamingContent && (
          <div className="ai-message assistant">
            <MessageContent content={streamingContent} />
            {isExecutingQuery && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Spinner size={14} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Running query...</span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="ai-chat-input">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your database..."
          rows={1}
          disabled={isStreaming}
        />
        <Button
          icon="send-message"
          intent={Intent.PRIMARY}
          onClick={handleSend}
          loading={isStreaming}
          disabled={!input.trim()}
        />
      </div>
    </div>
  )
}

const ResultsContent: React.FC<{ sqlResults: string }> = ({ sqlResults }) => {
  try {
    const parsed = JSON.parse(sqlResults)
    if (parsed.error) {
      return <pre className="inline-results"><code>Error: {parsed.error}</code></pre>
    }
    if (parsed.columns && parsed.rows) {
      return (
        <div className="inline-results-wrapper">
          {parsed.truncated && (
            <Callout intent={Intent.WARNING} icon="info-sign" style={{ marginBottom: 8, fontSize: 12 }}>
              Results limited to {parsed.rows.length} rows
            </Callout>
          )}
          <div className="inline-table-scroll">
            <table className="results-table">
              <thead>
                <tr>
                  {parsed.columns.map((col: string) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.map((row: Record<string, unknown>, i: number) => (
                  <tr key={i}>
                    {parsed.columns.map((col: string) => (
                      <td key={col}>{row[col] == null ? 'NULL' : String(row[col])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    }
  } catch {
    // parse failed — fallback
  }
  return <pre className="inline-results"><code>{sqlResults}</code></pre>
}

function parseChartConfig(sqlResults?: string, chartConfig?: string): React.ReactNode {
  if (!chartConfig || !sqlResults) return null
  try {
    const config = JSON.parse(chartConfig)
    const parsed = JSON.parse(sqlResults)
    if (config.type && config.labelColumn && config.valueColumns && parsed.rows) {
      return <ResultsChart config={config} rows={parsed.rows} />
    }
  } catch {
    // invalid — skip
  }
  return null
}

const ConversationMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <div className={`ai-message ${message.role}`}>
      <MessageContent content={message.content} sqlGenerated={message.sqlGenerated} sqlResults={message.sqlResults} chartConfig={message.chartConfig} />
    </div>
  )
}

const MessageContent: React.FC<{ content: string; sqlGenerated?: string; sqlResults?: string; chartConfig?: string }> = ({ content, sqlGenerated, sqlResults, chartConfig }) => {
  // Parse content: split by code blocks
  const parts = content.split(/(```sql\n[\s\S]*?```|```\n[\s\S]*?```)/g)

  return (
    <div className="message-content">
      {parts.map((part, i) => {
        const sqlMatch = part.match(/```sql\n([\s\S]*?)```/)
        if (sqlMatch) {
          const sql = sqlMatch[1].trim()
          return <pre key={i}><code>{sql}</code></pre>
        }
        const codeMatch = part.match(/```\n([\s\S]*?)```/)
        if (codeMatch) {
          return <pre key={i}><code>{codeMatch[1].trim()}</code></pre>
        }
        if (part.trim() === '') return null
        return <span key={i}>{part}</span>
      })}
      {parseChartConfig(sqlResults, chartConfig)}
      {sqlResults && (
        <details className="sql-collapsible">
          <summary>View query results</summary>
          <ResultsContent sqlResults={sqlResults} />
        </details>
      )}
    </div>
  )
}
