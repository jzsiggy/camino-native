import React, { useState } from 'react'
import {
  Dialog, DialogBody, DialogFooter,
  Button, Intent, TextArea, Tag, NonIdealState
} from '@blueprintjs/core'
import { useAiStore } from '../../stores/ai.store'
import { useAppStore } from '../../stores/app.store'
import { useAiContext } from '../../hooks/useAiChat'
import { aiApi } from '../../lib/ipc-client'
import { useQueryClient } from '@tanstack/react-query'
import type { AiConnectionContext } from '@shared/types/ai'

const typeColors: Record<string, string> = {
  schema_summary: '#89b4fa',
  business_rule: '#a6e3a1',
  naming_convention: '#fab387',
  relationship_note: '#cba6f7',
  user_correction: '#f38ba8',
  custom: '#94e2d5'
}

interface ParsedMetadata {
  questionText?: string
  subSource?: string
}

function parseMetadata(metadata?: string): ParsedMetadata | null {
  if (!metadata) return null
  try {
    return JSON.parse(metadata)
  } catch {
    return null
  }
}

function categorize(ctx: AiConnectionContext): 'additional' | 'questions' | 'conversation' {
  if (ctx.source === 'conversation') return 'conversation'
  if (ctx.source === 'wizard') {
    const meta = parseMetadata(ctx.metadata)
    if (meta?.subSource === 'additional_context') return 'additional'
    return 'questions'
  }
  // Legacy entries without proper source
  return 'questions'
}

interface ContextEntryProps {
  ctx: AiConnectionContext
  connectionId: string | null
}

const ContextEntry: React.FC<ContextEntryProps> = ({ ctx, connectionId }) => {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const queryClient = useQueryClient()
  const meta = parseMetadata(ctx.metadata)

  const handleEdit = () => {
    setEditing(true)
    setEditContent(ctx.content)
  }

  const handleSave = async () => {
    await aiApi.updateContext(ctx.id, editContent)
    setEditing(false)
    queryClient.invalidateQueries({ queryKey: ['aiContext', connectionId] })
  }

  const handleDelete = async () => {
    if (!confirm('Delete this context entry?')) return
    await aiApi.deleteContext(ctx.id)
    queryClient.invalidateQueries({ queryKey: ['aiContext', connectionId] })
  }

  return (
    <div
      style={{
        border: '1px solid var(--border-color)',
        borderRadius: 6,
        padding: 12
      }}
    >
      {meta?.questionText && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', margin: '0 0 4px 0' }}>
          Q: {meta.questionText}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Tag
          style={{ background: typeColors[ctx.contextType] || '#666', color: '#000' }}
          minimal
        >
          {ctx.contextType}
        </Tag>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
          {ctx.source}
        </span>
      </div>
      {editing ? (
        <div>
          <TextArea
            fill
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <Button small text="Save" intent={Intent.PRIMARY} onClick={handleSave} />
            <Button small text="Cancel" onClick={() => setEditing(false)} />
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13 }}>
          <p style={{ margin: 0 }}>{ctx.content}</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            <Button small minimal icon="edit" onClick={handleEdit} />
            <Button small minimal icon="trash" intent={Intent.DANGER} onClick={handleDelete} />
          </div>
        </div>
      )}
    </div>
  )
}

export const AiContextList: React.FC<{ connectionId: string | null }> = ({ connectionId }) => {
  const { data: contexts = [] } = useAiContext(connectionId)

  if (contexts.length === 0) {
    return (
      <NonIdealState
        icon="search"
        title="No context yet"
        description="Run the AI Setup Wizard to add context, or context will be learned from conversations."
      />
    )
  }

  const additional = contexts.filter((c) => categorize(c) === 'additional')
  const questions = contexts.filter((c) => categorize(c) === 'questions')
  const conversation = contexts.filter((c) => categorize(c) === 'conversation')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {additional.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>Additional Context</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {additional.map((ctx) => (
              <ContextEntry key={ctx.id} ctx={ctx} connectionId={connectionId} />
            ))}
          </div>
        </div>
      )}
      {questions.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>Questions & Answers</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {questions.map((ctx) => (
              <ContextEntry key={ctx.id} ctx={ctx} connectionId={connectionId} />
            ))}
          </div>
        </div>
      )}
      {conversation.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 13, fontWeight: 600 }}>Learned from Conversations</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conversation.map((ctx) => (
              <ContextEntry key={ctx.id} ctx={ctx} connectionId={connectionId} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const AiContextViewer: React.FC = () => {
  const { contextViewerOpen, setContextViewerOpen } = useAiStore()
  const { activeConnectionId } = useAppStore()

  return (
    <Dialog
      isOpen={contextViewerOpen}
      onClose={() => setContextViewerOpen(false)}
      title="AI Context"
      style={{ width: 600, maxHeight: '80vh' }}
    >
      <DialogBody>
        <AiContextList connectionId={activeConnectionId} />
      </DialogBody>
      <DialogFooter actions={<Button text="Close" onClick={() => setContextViewerOpen(false)} />} />
    </Dialog>
  )
}
