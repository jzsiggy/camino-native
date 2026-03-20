export const IPC = {
  // Connection management
  CONNECTION_LIST: 'connection:list',
  CONNECTION_GET: 'connection:get',
  CONNECTION_CREATE: 'connection:create',
  CONNECTION_UPDATE: 'connection:update',
  CONNECTION_DELETE: 'connection:delete',
  CONNECTION_TEST: 'connection:test',
  CONNECTION_CONNECT: 'connection:connect',
  CONNECTION_DISCONNECT: 'connection:disconnect',

  // Schema introspection
  SCHEMA_GET_DATABASES: 'schema:get-databases',
  SCHEMA_GET_SCHEMAS: 'schema:get-schemas',
  SCHEMA_GET_TABLES: 'schema:get-tables',
  SCHEMA_GET_COLUMNS: 'schema:get-columns',
  SCHEMA_GET_FULL: 'schema:get-full',
  SCHEMA_REFRESH: 'schema:refresh',

  // Query execution
  QUERY_EXECUTE: 'query:execute',
  QUERY_CANCEL: 'query:cancel',

  // AI chat
  AI_CHAT_SEND: 'ai:chat-send',
  AI_CHAT_STREAM: 'ai:chat-stream', // event channel for streaming
  AI_CHAT_STREAM_END: 'ai:chat-stream-end',
  AI_CHAT_STREAM_ERROR: 'ai:chat-stream-error',
  AI_SETUP_WIZARD_START: 'ai:setup-wizard-start',
  AI_SETUP_WIZARD_ANSWER: 'ai:setup-wizard-answer',
  AI_WIZARD_STATUS: 'ai:wizard-status',
  AI_CONTEXT_GET: 'ai:context-get',
  AI_CONTEXT_UPDATE: 'ai:context-update',
  AI_CONTEXT_DELETE: 'ai:context-delete',

  // Scripts
  SCRIPT_LIST: 'script:list',
  SCRIPT_GET: 'script:get',
  SCRIPT_CREATE: 'script:create',
  SCRIPT_UPDATE: 'script:update',
  SCRIPT_DELETE: 'script:delete',

  // Conversations
  CONVERSATION_LIST: 'conversation:list',
  CONVERSATION_GET: 'conversation:get',
  CONVERSATION_CREATE: 'conversation:create',
  CONVERSATION_DELETE: 'conversation:delete',
  CONVERSATION_MESSAGES: 'conversation:messages',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all'
} as const

export type IpcChannel = (typeof IPC)[keyof typeof IPC]
