import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

export class ProcessedTaskTracker {
  private db: Database.Database | null = null
  private dbPath: string

  constructor(dataPath?: string) {
    const basePath = dataPath || process.env.STORE_DATA_PATH || './data'
    this.dbPath = path.join(basePath, 'processed-task-executions.db')
  }

  async initialize(): Promise<void> {
    try {
      // Ensure the directory exists
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      this.db = new Database(this.dbPath)

      // Enable WAL mode for better concurrent access
      this.db.exec('PRAGMA journal_mode=WAL')

      this.createTable()
      console.log('✅ Processed task executions database initialized')
    } catch (error: any) {
      throw new Error(`Failed to open database: ${error.message}`)
    }
  }

  private createTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS processed_task_executions (
        task_id TEXT NOT NULL,
        scheduled_time INTEGER NOT NULL,
        store_id TEXT NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (task_id, scheduled_time, store_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_task_store_time 
      ON processed_task_executions (store_id, scheduled_time);
    `

    try {
      this.db!.exec(sql)
    } catch (error: any) {
      throw new Error(`Failed to create table: ${error.message}`)
    }
  }

  async isTaskExecutionProcessed(
    taskId: string,
    scheduledTime: Date,
    storeId: string
  ): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      const stmt = this.db.prepare(
        'SELECT 1 FROM processed_task_executions WHERE task_id = ? AND scheduled_time = ? AND store_id = ?'
      )
      const row = stmt.get(taskId, scheduledTime.getTime(), storeId)
      return row !== undefined
    } catch (error: any) {
      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  async markTaskExecutionProcessed(
    taskId: string,
    scheduledTime: Date,
    storeId: string
  ): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    try {
      const stmt = this.db.prepare(
        'INSERT OR IGNORE INTO processed_task_executions (task_id, scheduled_time, store_id) VALUES (?, ?, ?)'
      )
      const result = stmt.run(taskId, scheduledTime.getTime(), storeId)
      // result.changes > 0 means we won the race (successfully inserted)
      return result.changes > 0
    } catch (error: any) {
      throw new Error(`Failed to mark processed: ${error.message}`)
    }
  }

  async getProcessedCount(storeId?: string): Promise<number> {
    if (!this.db) return 0

    try {
      const sql = storeId
        ? 'SELECT COUNT(*) as count FROM processed_task_executions WHERE store_id = ?'
        : 'SELECT COUNT(*) as count FROM processed_task_executions'

      const stmt = this.db.prepare(sql)
      const row: any = storeId ? stmt.get(storeId) : stmt.get()
      return row?.count || 0
    } catch (error: any) {
      throw new Error(`Failed to get count: ${error.message}`)
    }
  }

  async close(): Promise<void> {
    if (!this.db) return

    try {
      this.db.close()
      this.db = null
    } catch (error: any) {
      console.error('Error closing database:', error.message)
    }
  }

  get databasePath(): string {
    return this.dbPath
  }

  async cleanupOldExecutions(olderThanDays: number = 30): Promise<number> {
    if (!this.db) return 0

    try {
      const cutoffTime = new Date()
      cutoffTime.setDate(cutoffTime.getDate() - olderThanDays)

      const stmt = this.db.prepare('DELETE FROM processed_task_executions WHERE processed_at < ?')
      const result = stmt.run(cutoffTime.toISOString())
      return result.changes || 0
    } catch (error: any) {
      throw new Error(`Failed to cleanup old executions: ${error.message}`)
    }
  }
}
