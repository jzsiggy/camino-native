import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { getAppDb, closeAppDb } from './db/app-db'
import { poolManager } from './db/pool-manager'
import { registerConnectionIpc } from './ipc/connection.ipc'
import { registerQueryIpc } from './ipc/query.ipc'
import { registerSchemaIpc } from './ipc/schema.ipc'
import { registerSettingsIpc } from './ipc/settings.ipc'
import { registerConversationIpc } from './ipc/conversation.ipc'
import { registerAiIpc } from './ipc/ai.ipc'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 10 },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.camino.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize app database
  getAppDb()

  // Register all IPC handlers
  registerConnectionIpc()
  registerQueryIpc()
  registerSchemaIpc()
  registerSettingsIpc()
  registerConversationIpc()
  registerAiIpc()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', async () => {
  await poolManager.disconnectAll()
  closeAppDb()
})
