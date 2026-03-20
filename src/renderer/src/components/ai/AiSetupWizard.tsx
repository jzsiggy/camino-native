import React, { useState } from 'react'
import {
  Dialog, DialogBody, DialogFooter,
  Button, Intent, TextArea, Spinner, Callout
} from '@blueprintjs/core'
import { useAiStore } from '../../stores/ai.store'
import { useAppStore } from '../../stores/app.store'
import { useWizard, useWizardAnswer } from '../../hooks/useAiChat'
import type { WizardQuestion } from '@shared/types/ai'

export const AiSetupWizard: React.FC = () => {
  const { wizardOpen, setWizardOpen } = useAiStore()
  const { activeConnectionId } = useAppStore()
  const wizard = useWizard()
  const wizardAnswer = useWizardAnswer()

  const [step, setStep] = useState<'start' | 'reviewing' | 'complete'>('start')
  const [schemaSummary, setSchemaSummary] = useState('')
  const [questions, setQuestions] = useState<WizardQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [additionalContext, setAdditionalContext] = useState('')

  const handleStart = async () => {
    if (!activeConnectionId) return
    setStep('reviewing')
    try {
      const result = await wizard.mutateAsync(activeConnectionId)
      setSchemaSummary(result.schemaSummary)
      setQuestions(result.questions)
      setStep('reviewing')
    } catch {
      setStep('start')
    }
  }

  const handleComplete = async () => {
    if (!activeConnectionId) return
    await wizardAnswer.mutateAsync({
      connectionId: activeConnectionId,
      answers,
      questions: questions.map((q) => ({ id: q.id, question: q.question })),
      additionalContext
    })
    setStep('complete')
    setTimeout(() => {
      setWizardOpen(false)
      resetState()
    }, 1500)
  }

  const resetState = () => {
    setStep('start')
    setSchemaSummary('')
    setQuestions([])
    setAnswers({})
    setAdditionalContext('')
  }

  const handleClose = () => {
    setWizardOpen(false)
    resetState()
  }

  return (
    <Dialog
      isOpen={wizardOpen}
      onClose={handleClose}
      title="AI Setup Wizard"
      style={{ width: 600 }}
    >
      <DialogBody>
        {step === 'start' && (
          <div>
            <p style={{ marginBottom: 12 }}>
              This wizard will analyze your database schema and set up AI context for natural language querying.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Make sure the schema has been loaded first (expand the connection in the sidebar).
            </p>
          </div>
        )}

        {step === 'reviewing' && wizard.isPending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Spinner size={16} /> Analyzing schema...
          </div>
        )}

        {step === 'reviewing' && !wizard.isPending && (
          <div>
            <Callout title="Schema Summary" style={{ maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'monospace' }}>
                {schemaSummary}
              </pre>
            </Callout>

            {questions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                  Answer these questions to help the AI better understand your database:
                </p>
                {questions.map((q) => (
                  <div key={q.id} style={{ marginBottom: 12 }}>
                    <p style={{ fontWeight: 500, fontSize: 13 }}>{q.question}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>{q.context}</p>
                    <TextArea
                      fill
                      rows={2}
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      placeholder="Your answer (optional)"
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <p style={{ marginBottom: 8, fontSize: 13 }}>
                Add any additional context about your database (business rules, conventions, etc.):
              </p>
              <TextArea
                fill
                rows={4}
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="e.g., 'status 1 = active, 2 = inactive. Customer names are stored as last_name, first_name.'"
              />
            </div>
          </div>
        )}

        {step === 'complete' && (
          <Callout intent={Intent.SUCCESS} title="Setup Complete">
            AI context has been saved. You can now use natural language to query your database.
          </Callout>
        )}
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={handleClose} />
            {step === 'start' && (
              <Button intent={Intent.PRIMARY} text="Start" onClick={handleStart} />
            )}
            {step === 'reviewing' && !wizard.isPending && (
              <Button
                intent={Intent.PRIMARY}
                text="Complete Setup"
                onClick={handleComplete}
                loading={wizardAnswer.isPending}
              />
            )}
          </>
        }
      />
    </Dialog>
  )
}
