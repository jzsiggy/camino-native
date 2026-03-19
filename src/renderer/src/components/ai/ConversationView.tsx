import React, { useState, useRef, useEffect } from 'react'
import { Button, Intent, Icon, Spinner } from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useAiStore } from '../../stores/ai.store'
import { useConversationMessages, useSendMessage, useAiStream } from '../../hooks/useAiChat'
import type { ChatMessage } from '@shared/types/ai'

export const ConversationView: React.FC = () => {
  const { activeConnectionId } = useAppStore()
  const { activeConversationId, streamingContent, isStreaming, isExecutingQuery } = useAiStore()
  const { data: messages = [] } = useConversationMessages(activeConversationId)
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
      <div className="ai-chat-messages">
        {messages.map((msg: ChatMessage) => (
          <ConversationMessage key={msg.id} message={msg} />
        ))}
        {isExecutingQuery && (
          <div className="ai-message assistant" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner size={14} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Running query...</span>
          </div>
        )}
        {isStreaming && streamingContent && !isExecutingQuery && (
          <div className="ai-message assistant">
            <MessageContent content={streamingContent} />
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

const ConversationMessage: React.FC<{ message: ChatMessage }> = ({ message }) => {
  return (
    <div className={`ai-message ${message.role}`}>
      <MessageContent content={message.content} sqlGenerated={message.sqlGenerated} sqlResults={message.sqlResults} />
    </div>
  )
}

const MessageContent: React.FC<{ content: string; sqlGenerated?: string; sqlResults?: string }> = ({ content, sqlGenerated, sqlResults }) => {
  // Parse content: split by code blocks
  const parts = content.split(/(```sql\n[\s\S]*?```|```\n[\s\S]*?```)/g)

  return (
    <div>
      {parts.map((part, i) => {
        const sqlMatch = part.match(/```sql\n([\s\S]*?)```/)
        if (sqlMatch) {
          const sql = sqlMatch[1].trim()
          return (
            <details key={i} className="sql-collapsible">
              <summary>View SQL query</summary>
              <pre><code>{sql}</code></pre>
            </details>
          )
        }
        const codeMatch = part.match(/```\n([\s\S]*?)```/)
        if (codeMatch) {
          return <pre key={i}><code>{codeMatch[1].trim()}</code></pre>
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
      })}
      {sqlResults && (
        <details className="sql-collapsible">
          <summary>View query results</summary>
          <pre className="inline-results"><code>{sqlResults}</code></pre>
        </details>
      )}
    </div>
  )
}
