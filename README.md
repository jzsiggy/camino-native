# Camino

**AI-powered database management for your desktop.**

Connect to PostgreSQL, MySQL, and SQLite. Write SQL with a professional editor. Let AI generate queries from natural language.

[![Build](https://github.com/jzsiggy/camino-native/actions/workflows/build.yml/badge.svg)](https://github.com/jzsiggy/camino-native/actions/workflows/build.yml)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-blue)
![Electron](https://img.shields.io/badge/electron-33.2.1-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/react-18.3.1-61DAFB?logo=react&logoColor=white)

---

## Overview

Camino is a cross-platform desktop application that combines a professional SQL development environment with AI-powered assistance. It provides a Monaco-based editor, real-time schema exploration, data visualization, and an AI chat interface that understands your database schema to generate, explain, and optimize SQL queries.

---

## Features

### Multi-Database Support
- **PostgreSQL** -- Full support with connection pooling, SSL/TLS, and schema introspection
- **MySQL** -- Connection pooling, SSL support, query cancellation via thread ID
- **SQLite** -- Local file-based databases with foreign key support

### Professional SQL Editor
- Monaco Editor with SQL syntax highlighting and auto-completion
- Multi-statement execution (`Cmd/Ctrl+Enter` for all, `Shift+Enter` for current statement)
- Cursor-aware statement detection
- Tab-based interface for multiple scripts

### AI Chat Interface
- Natural language to SQL conversion
- Streaming responses from **Claude** (Anthropic) or **GPT** (OpenAI)
- Full conversation history management
- Context-aware prompting that learns your database terminology, business rules, and naming conventions
- AI Setup Wizard for onboarding new database connections

### Data Visualization
- Instant chart generation from query results via Recharts
- Bar charts, line graphs, and more
- Interactive chart configuration

### Schema Explorer
- Visual tree view of databases, schemas, tables, and columns
- Dynamic schema introspection with caching
- Browse table structures at a glance

### Connection Management
- Save and organize multiple database connections
- Test connections with latency measurement
- Passwords encrypted at rest
- Per-connection settings and AI context

### Script Management
- Save SQL scripts per connection
- Organize and revisit past queries
- AI conversations stored with full message history and token tracking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Runtime | Electron 33.2.1 |
| Frontend | React 18.3.1, TypeScript 5.7.2 |
| Build Tooling | Vite 6.0.3, electron-vite 5.0.0 |
| UI Components | Blueprint.js 5.x |
| Code Editor | Monaco Editor 0.52.2 |
| Charts | Recharts 3.8.0 |
| State Management | Zustand 5.0.2, React Query 5.62.0 |
| Layout | Allotment 1.20.2 (resizable panes) |
| Database Drivers | pg 8.13.1, mysql2 3.12.0, better-sqlite3 11.7.0 |
| AI SDKs | @anthropic-ai/sdk 0.39.0, openai 4.77.0 |
| Packaging | electron-builder 25.1.8 |

---

## Getting Started

### Prerequisites

- **Node.js** 20 or later
- **npm** (bundled with Node.js)

### Installation

```bash
git clone https://github.com/jzsiggy/camino-native.git
cd camino-native
npm install
```

### Development

```bash
npm run dev
```

This starts the electron-vite dev server with hot module replacement for the renderer process.

### Build

```bash
# Build the JavaScript bundles
npm run build

# Build and package for distribution
npm run package
```

### All Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build production bundles |
| `npm run preview` | Preview the production build |
| `npm run package` | Build and package distributable binaries |

---

## Project Structure

```
camino-app-electron/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Window creation, IPC registration
│   │   ├── ai/                  # AI provider implementations
│   │   │   ├── anthropic.provider.ts
│   │   │   ├── openai.provider.ts
│   │   │   ├── context-manager.ts
│   │   │   ├── prompt-templates.ts
│   │   │   └── provider.interface.ts
│   │   ├── db/                  # Database layer
│   │   │   ├── app-db.ts        # Internal SQLite app database
│   │   │   ├── pool-manager.ts  # Connection pool management
│   │   │   └── adapters/        # Database drivers
│   │   │       ├── adapter.interface.ts
│   │   │       ├── postgres.adapter.ts
│   │   │       ├── mysql.adapter.ts
│   │   │       └── sqlite.adapter.ts
│   │   ├── ipc/                 # IPC channel handlers
│   │   │   ├── ai.ipc.ts
│   │   │   ├── connection.ipc.ts
│   │   │   ├── query.ipc.ts
│   │   │   ├── schema.ipc.ts
│   │   │   ├── conversation.ipc.ts
│   │   │   ├── script.ipc.ts
│   │   │   └── settings.ipc.ts
│   │   └── security/
│   │       └── crypto.ts        # Encryption utilities
│   ├── preload/                 # Preload scripts (main<->renderer bridge)
│   └── renderer/src/            # React frontend
│       ├── App.tsx
│       ├── components/
│       │   ├── ai/              # AI chat panel, setup wizard, context viewer
│       │   ├── editor/          # Monaco SQL editor, script management
│       │   ├── connections/     # Connection dialogs and tree view
│       │   ├── schema/          # Schema explorer tree
│       │   ├── results/         # Query results panel
│       │   ├── layout/          # App shell, sidebar, status bar
│       │   └── settings/        # Settings dialog
│       ├── stores/              # Zustand state stores
│       ├── hooks/               # React Query hooks
│       └── lib/                 # Utilities and types
├── shared/                      # Shared types across processes
│   ├── types/                   # Connection, query, schema, AI, settings types
│   └── constants/
│       └── ipc-channels.ts      # All IPC channel definitions
├── website/                     # Static marketing landing page
├── resources/                   # App icons
├── build/                       # macOS entitlements
├── .github/workflows/           # CI/CD pipelines
├── electron-builder.yml         # Packaging configuration
├── electron.vite.config.ts      # Vite config for main/preload/renderer
├── tsconfig.json                # TypeScript configuration
└── package.json
```

---

## Architecture

Camino follows Electron's multi-process architecture with strict separation between the main process and the renderer.

```
┌─────────────────────────────────────────────────────┐
│                   Renderer Process                   │
│                                                     │
│  React + Blueprint.js + Monaco Editor + Recharts    │
│  Zustand stores  |  React Query hooks               │
│                                                     │
└──────────────────────┬──────────────────────────────┘
                       │ IPC (typed channels)
┌──────────────────────┴──────────────────────────────┐
│                 Preload Scripts                       │
│          Typed API bridge (contextBridge)             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                    Main Process                       │
│                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ DB Adapters  │  │ AI Providers │  │  App DB    │ │
│  │ PG/MySQL/    │  │ Anthropic/   │  │  (SQLite)  │ │
│  │ SQLite       │  │ OpenAI       │  │            │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
│                                                     │
│  Pool Manager  |  Context Manager  |  Crypto        │
└─────────────────────────────────────────────────────┘
```

### Key Patterns

- **IPC Communication** -- All main/renderer communication goes through typed IPC channels defined in `shared/constants/ipc-channels.ts`
- **Database Adapter Interface** -- All database drivers implement a common `DatabaseAdapter` interface for query execution, schema introspection, and cancellation
- **AI Provider Interface** -- Both Anthropic and OpenAI providers implement a shared interface with streaming support
- **Reactive State** -- Zustand for UI state (active tabs, panels, streaming status), React Query for server state (queries, schema cache, refetching)

---

## Database Adapters

All adapters implement a common interface providing:

- Query execution with configurable result limits
- Schema introspection (databases, tables, columns, types)
- Query cancellation
- Connection testing with latency measurement

### PostgreSQL
- Driver: `pg` (node-postgres)
- Default port: 5432
- Connection pooling (max 5 connections)
- SSL/TLS support

### MySQL
- Driver: `mysql2/promise`
- Default port: 3306
- Connection pooling with SSL support
- Query cancellation via MySQL thread ID

### SQLite
- Driver: `better-sqlite3`
- File-based local databases
- Synchronous API for reliability
- Foreign key pragma enabled by default

---

## AI Integration

Camino supports two AI providers, configurable from the settings panel.

### Anthropic Claude
- Default model: `claude-sonnet-4-20250514`
- Streaming responses via the Anthropic SDK
- Token-aware context budgeting

### OpenAI GPT
- Default model: `gpt-4o`
- Streaming support via the OpenAI SDK

### Context Management

The AI system builds and maintains context about each database connection to improve query generation:

| Context Type | Description |
|-------------|-------------|
| Schema Summary | Automatically generated overview of tables and relationships |
| Business Rules | Domain-specific rules (e.g., "revenue = amount where status is completed") |
| Naming Conventions | How columns and tables are named in this database |
| Relationship Notes | Foreign key and join relationships |
| User Corrections | Learned from corrections during conversations |
| Custom Context | Freeform context added by the user |

Context is stored per-connection in the app database and automatically included in AI prompts, capped at ~8000 tokens.

---

## Configuration

### Settings

Settings are managed through the in-app settings dialog:

| Setting | Description | Default |
|---------|-------------|---------|
| AI Provider | `anthropic` or `openai` | `anthropic` |
| AI Model | Model identifier | Provider default |
| API Key | Anthropic or OpenAI API key | -- |
| Max Tokens | Maximum response tokens | 4096 |
| Temperature | Response creativity | 0.3 |
| Theme | `dark` or `light` | `dark` |

### App Database

Camino stores all application data in a local SQLite database:

- **Location**: `{userData}/camino.db` (platform-specific user data directory)
- **Tables**: connections, settings, conversations, messages, scripts, ai_connection_context, schema_cache

### Security

- API keys and database passwords are **encrypted at rest** in the app database
- Decryption happens in-memory only during active use
- No credentials are ever written to disk in plaintext

---

## CI/CD

### Build (`build.yml`)
Runs on every push and pull request to `main`:
- Ubuntu latest, Node.js 20
- Installs dependencies and runs `npm run build`

### Release (`release.yml`)
Triggered by version tags (`v*`):
- Multi-platform matrix build:
  - macOS (arm64 + x64)
  - Windows
  - Linux
- Code signing for macOS (CSC_LINK, CSC_KEY_PASSWORD secrets)
- Uploads artifacts to GitHub Releases

### Website Deployment (`deploy-website.yml`)
Deploys the marketing landing page to GitHub Pages:
- Triggers on pushes to `main` that modify `website/`
- Uses GitHub Pages Actions (no `gh-pages` branch needed)

---

## Building & Packaging

### Platform Targets

| Platform | Architecture | Format |
|----------|-------------|--------|
| macOS | arm64 (Apple Silicon) | DMG, ZIP |
| macOS | x64 (Intel) | DMG, ZIP |
| Windows | x64 | NSIS Installer |
| Linux | x64 | AppImage |

### Building Locally

```bash
# Package for current platform
npm run package

# Package for specific platform/arch (used in CI)
npm run package -- --mac --arm64
npm run package -- --mac --x64
npm run package -- --win
npm run package -- --linux
```

### Code Signing (macOS)

macOS builds require code signing. Set these environment variables:

```bash
export CSC_LINK="path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
```

Entitlements are configured in `build/entitlements.mac.plist`.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run the build to verify (`npm run build`)
5. Commit and push
6. Open a pull request

---

## License

See [LICENSE](LICENSE) for details.
