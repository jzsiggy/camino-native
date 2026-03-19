import type { DatabaseAdapter } from './adapters/adapter.interface'
import type { ConnectionConfig } from '@shared/types/connection'
import { PostgresAdapter } from './adapters/postgres.adapter'
import { MysqlAdapter } from './adapters/mysql.adapter'
import { SqliteAdapter } from './adapters/sqlite.adapter'

class PoolManager {
  private adapters = new Map<string, DatabaseAdapter>()

  createAdapter(config: ConnectionConfig): DatabaseAdapter {
    switch (config.engine) {
      case 'postgres':
        return new PostgresAdapter(config)
      case 'mysql':
        return new MysqlAdapter(config)
      case 'sqlite':
        return new SqliteAdapter(config)
      default:
        throw new Error(`Unsupported engine: ${config.engine}`)
    }
  }

  async connect(config: ConnectionConfig): Promise<DatabaseAdapter> {
    // Disconnect existing if any
    await this.disconnect(config.id)

    const adapter = this.createAdapter(config)
    await adapter.connect()
    this.adapters.set(config.id, adapter)
    return adapter
  }

  async disconnect(connectionId: string): Promise<void> {
    const adapter = this.adapters.get(connectionId)
    if (adapter) {
      await adapter.disconnect()
      this.adapters.delete(connectionId)
    }
  }

  getAdapter(connectionId: string): DatabaseAdapter | undefined {
    return this.adapters.get(connectionId)
  }

  isConnected(connectionId: string): boolean {
    const adapter = this.adapters.get(connectionId)
    return adapter?.isConnected() ?? false
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.adapters.entries()).map(async ([id]) => {
      await this.disconnect(id)
    })
    await Promise.all(promises)
  }
}

export const poolManager = new PoolManager()
