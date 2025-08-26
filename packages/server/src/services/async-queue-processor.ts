interface QueuedTask<T> {
  id: string
  task: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

export class AsyncQueueProcessor<T = any> {
  private queue: QueuedTask<T>[] = []
  private processing = false
  private destroyed = false

  /**
   * Add a task to the queue for sequential processing
   */
  async enqueue(id: string, task: () => Promise<T>): Promise<T> {
    if (this.destroyed) {
      throw new Error('Queue processor has been destroyed')
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({ id, task, resolve, reject })
      
      // Start processing if not already running
      if (!this.processing) {
        this.processQueue().catch(error => {
          console.error('Unexpected error in queue processing:', error)
        })
      }
    })
  }

  /**
   * Process all queued tasks sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.destroyed) {
      return
    }

    this.processing = true

    try {
      while (this.queue.length > 0 && !this.destroyed) {
        const queuedTask = this.queue.shift()!
        
        try {
          const result = await queuedTask.task()
          queuedTask.resolve(result)
        } catch (error) {
          queuedTask.reject(error instanceof Error ? error : new Error(String(error)))
        }
      }
    } finally {
      this.processing = false
    }
  }

  /**
   * Get the current queue length
   */
  getQueueLength(): number {
    return this.queue.length
  }

  /**
   * Check if the processor is currently processing a task
   */
  isProcessing(): boolean {
    return this.processing
  }

  /**
   * Check if the processor has been destroyed
   */
  isDestroyed(): boolean {
    return this.destroyed
  }

  /**
   * Clear all queued tasks and reject them
   */
  clear(): void {
    const tasks = this.queue.splice(0)
    const error = new Error('Queue cleared')
    
    for (const task of tasks) {
      task.reject(error)
    }
  }

  /**
   * Destroy the processor and reject all pending tasks
   */
  destroy(): void {
    this.destroyed = true
    this.clear()
  }
}