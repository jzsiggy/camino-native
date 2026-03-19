import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogBody, DialogFooter,
  Button, FormGroup, InputGroup, HTMLSelect, NumericInput, Intent, Tabs, Tab, Switch
} from '@blueprintjs/core'
import { useAppStore } from '../../stores/app.store'
import { settingsApi } from '../../lib/ipc-client'

export const SettingsDialog: React.FC = () => {
  const { settingsDialogOpen, setSettingsDialogOpen, theme, setTheme } = useAppStore()

  const [aiProvider, setAiProvider] = useState('anthropic')
  const [aiModel, setAiModel] = useState('claude-sonnet-4-20250514')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [maxTokens, setMaxTokens] = useState(4096)
  const [temperature, setTemperature] = useState(0.3)
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false)
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false)

  useEffect(() => {
    if (settingsDialogOpen) {
      loadSettings()
    }
  }, [settingsDialogOpen])

  const loadSettings = async () => {
    const all = await settingsApi.getAll()
    if (all.aiProvider) setAiProvider(all.aiProvider as string)
    if (all.aiModel) setAiModel(all.aiModel as string)
    if (all.maxTokens) setMaxTokens(all.maxTokens as number)
    if (all.temperature) setTemperature(all.temperature as number)
    setHasAnthropicKey(all.anthropicApiKey === '********')
    setHasOpenaiKey(all.openaiApiKey === '********')
  }

  const handleSave = async () => {
    await settingsApi.set('aiProvider', aiProvider)
    await settingsApi.set('aiModel', aiModel)
    await settingsApi.set('maxTokens', maxTokens)
    await settingsApi.set('temperature', temperature)
    await settingsApi.set('theme', theme)

    if (anthropicKey) {
      await settingsApi.set('anthropicApiKey', anthropicKey)
    }
    if (openaiKey) {
      await settingsApi.set('openaiApiKey', openaiKey)
    }
    setSettingsDialogOpen(false)
  }

  return (
    <Dialog
      isOpen={settingsDialogOpen}
      onClose={() => setSettingsDialogOpen(false)}
      title="Settings"
      style={{ width: 550 }}
    >
      <DialogBody>
        <Tabs>
          <Tab
            id="ai"
            title="AI"
            panel={
              <div style={{ paddingTop: 12 }}>
                <FormGroup label="AI Provider">
                  <HTMLSelect
                    value={aiProvider}
                    onChange={(e) => {
                      setAiProvider(e.target.value)
                      setAiModel(e.target.value === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o')
                    }}
                    fill
                  >
                    <option value="anthropic">Anthropic (Claude)</option>
                    <option value="openai">OpenAI (GPT)</option>
                  </HTMLSelect>
                </FormGroup>

                <FormGroup label="Model">
                  <HTMLSelect value={aiModel} onChange={(e) => setAiModel(e.target.value)} fill>
                    {aiProvider === 'anthropic' ? (
                      <>
                        <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                        <option value="claude-opus-4-20250514">Claude Opus 4</option>
                        <option value="claude-haiku-4-20250514">Claude Haiku 4</option>
                      </>
                    ) : (
                      <>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-4o-mini">GPT-4o Mini</option>
                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      </>
                    )}
                  </HTMLSelect>
                </FormGroup>

                <FormGroup
                  label="Anthropic API Key"
                  helperText={hasAnthropicKey ? 'Key is saved (enter new to replace)' : ''}
                >
                  <InputGroup
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder={hasAnthropicKey ? '••••••••' : 'sk-ant-...'}
                  />
                </FormGroup>

                <FormGroup
                  label="OpenAI API Key"
                  helperText={hasOpenaiKey ? 'Key is saved (enter new to replace)' : ''}
                >
                  <InputGroup
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={hasOpenaiKey ? '••••••••' : 'sk-...'}
                  />
                </FormGroup>

                <div style={{ display: 'flex', gap: 12 }}>
                  <FormGroup label="Max Tokens" style={{ flex: 1 }}>
                    <NumericInput
                      value={maxTokens}
                      onValueChange={(v) => setMaxTokens(v)}
                      min={256}
                      max={32768}
                      fill
                    />
                  </FormGroup>
                  <FormGroup label="Temperature" style={{ flex: 1 }}>
                    <NumericInput
                      value={temperature}
                      onValueChange={(v) => setTemperature(v)}
                      min={0}
                      max={2}
                      stepSize={0.1}
                      fill
                    />
                  </FormGroup>
                </div>

              </div>
            }
          />
          <Tab
            id="appearance"
            title="Appearance"
            panel={
              <div style={{ paddingTop: 12 }}>
                <FormGroup label="Theme">
                  <Switch
                    label="Dark Mode"
                    checked={theme === 'dark'}
                    onChange={(e) => setTheme((e.target as HTMLInputElement).checked ? 'dark' : 'light')}
                  />
                </FormGroup>
              </div>
            }
          />
        </Tabs>
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={() => setSettingsDialogOpen(false)} />
            <Button text="Save" intent={Intent.PRIMARY} onClick={handleSave} />
          </>
        }
      />
    </Dialog>
  )
}
