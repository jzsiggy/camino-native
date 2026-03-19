import React, { useState, useRef, useEffect } from 'react'
import { Button, Intent, Icon } from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { useAiStore } from '../../stores/ai.store'
import { useConversations, useConversationMessages, useCreateConversation, useSendMessage, useAiStream } from '../../hooks/useAiChat'
import { useEditorStore } from '../../stores/editor.store'
import { useExecuteQuery } from '../../hooks/useQuery'
import { v4 as uuid } from 'uuid'
import type { ChatMessage } from '@shared/types/ai'

export const AiChatPanel: React.FC = () => {
  const { activeConnectionId, setRightPanel } = useAppStore()
  const { activeConversationId, setActiveConversationId, streamingContent, isStreaming } = useAiStore()
  const { data: conversations = [] } = useConversations(activeConnectionId)
  const { data: messages = [] } = useConversationMessages(activeConversationId)
  const createConversation = useCreateConversation()
  const sendMessage = useSendMessage()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useAiStream()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleNewConversation = async () => {
    if (!activeConnectionId) return
    const conv = await createConversation.mutateAsync({ connectionId: activeConnectionId })
    setActiveConversationId(conv.id)
  }

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

  if (!activeConnectionId) {
    return (
      <div className="ai-chat-panel">
        <div className="results-header">
          <span style={{ fontWeight: 600 }}>AI Chat</span>
          <Button minimal small icon="th" text="Results" onClick={() => setRightPanel('results')} />
        </div>
        <div className="empty-state">
          <p>Connect to a database to start chatting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-chat-panel">
      <div className="results-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600 }}>AI Chat</span>
          {activeConversationId && (
            <select
              value={activeConversationId}
              onChange={(e) => setActiveConversationId(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                fontSize: 11, cursor: 'pointer'
              }}
            >
              {conversations.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <Button minimal small icon="plus" onClick={handleNewConversation} />
          <Button minimal small icon="th" text="Results" onClick={() => setRightPanel('results')} />
        </div>
      </div>

      {!activeConversationId ? (
        <div className="empty-state">
          <Icon icon="chat" size={32} style={{ opacity: 0.3 }} />
          <p>Start a new conversation</p>
          <Button intent={Intent.PRIMARY} text="New Conversation" onClick={handleNewConversation} />
        </div>
      ) : (
        <>
          <div className="ai-chat-messages">
            {messages.map((msg: ChatMessage) => (
              <AiMessage key={msg.id} message={msg} connectionId={activeConnectionId} />
            ))}
            {isStreaming && streamingContent && (
              <div className="ai-message assistant">
                <MessageContent content={streamingContent} connectionId={activeConnectionId} />
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
        </>
      )}
    </div>
  )
}

const AiMessage: React.FC<{ message: ChatMessage; connectionId: string }> = ({ message, connectionId }) => {
  return (
    <div className={`ai-message ${message.role}`}>
      <MessageContent content={message.content} connectionId={connectionId} />
    </div>
  )
}

const MessageContent: React.FC<{ content: string; connectionId: string }> = ({ content, connectionId }) => {
  const { openTab } = useEditorStore()
  const { execute } = useExecuteQuery()

  const handleExecuteSql = (sql: string) => {
    const tabId = uuid()
    openTab({
      id: tabId,
      title: 'AI Query',
      connectionId,
      content: sql,
      isDirty: false,
      isExecuting: false
    })
    execute(tabId, connectionId, sql)
  }

  // Simple parsing: split by code blocks
  const parts = content.split(/(```sql\n[\s\S]*?```|```\n[\s\S]*?```)/g)

  return (
    <div>
      {parts.map((part, i) => {
        const sqlMatch = part.match(/```sql\n([\s\S]*?)```/)
        if (sqlMatch) {
          const sql = sqlMatch[1].trim()
          return (
            <div key={i}>
              <pre><code>{sql}</code></pre>
              <Button
                small
                className="execute-sql-btn"
                icon="play"
                text="Execute"
                intent={Intent.SUCCESS}
                onClick={() => handleExecuteSql(sql)}
              />
            </div>
          )
        }
        const codeMatch = part.match(/```\n([\s\S]*?)```/)
        if (codeMatch) {
          return <pre key={i}><code>{codeMatch[1].trim()}</code></pre>
        }
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>
      })}
    </div>
  )
}
