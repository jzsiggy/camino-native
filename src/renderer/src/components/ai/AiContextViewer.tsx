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

export const AiContextViewer: React.FC = () => {
  const { contextViewerOpen, setContextViewerOpen } = useAiStore()
  const { activeConnectionId } = useAppStore()
  const { data: contexts = [], refetch } = useAiContext(activeConnectionId)
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleEdit = (ctx: AiConnectionContext) => {
    setEditingId(ctx.id)
    setEditContent(ctx.content)
  }

  const handleSave = async () => {
    if (!editingId) return
    await aiApi.updateContext(editingId, editContent)
    setEditingId(null)
    queryClient.invalidateQueries({ queryKey: ['aiContext', activeConnectionId] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this context entry?')) return
    await aiApi.deleteContext(id)
    queryClient.invalidateQueries({ queryKey: ['aiContext', activeConnectionId] })
  }

  return (
    <Dialog
      isOpen={contextViewerOpen}
      onClose={() => setContextViewerOpen(false)}
      title="AI Context"
      style={{ width: 600, maxHeight: '80vh' }}
    >
      <DialogBody>
        {contexts.length === 0 ? (
          <NonIdealState
            icon="search"
            title="No context yet"
            description="Run the AI Setup Wizard to add context, or context will be learned from conversations."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contexts.map((ctx) => (
              <div
                key={ctx.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  padding: 12
                }}
              >
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
                {editingId === ctx.id ? (
                  <div>
                    <TextArea
                      fill
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <Button small text="Save" intent={Intent.PRIMARY} onClick={handleSave} />
                      <Button small text="Cancel" onClick={() => setEditingId(null)} />
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13 }}>
                    <p>{ctx.content}</p>
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      <Button small minimal icon="edit" onClick={() => handleEdit(ctx)} />
                      <Button small minimal icon="trash" intent={Intent.DANGER} onClick={() => handleDelete(ctx.id)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogBody>
      <DialogFooter actions={<Button text="Close" onClick={() => setContextViewerOpen(false)} />} />
    </Dialog>
  )
}
