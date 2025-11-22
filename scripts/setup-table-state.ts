import { createStore } from '../packages/server/src/factories/store-factory.js'
import { events } from '../packages/shared/src/livestore/schema.js'
import { nextPriorityQueueVersion } from '../packages/shared/src/table-state.js'

interface BootstrapOptions {
  store: string
  gold?: string | null
  silver?: string | null
  bronzeMode: 'minimal' | 'target' | 'maximal'
  bronzeTargetExtra: number
  bronzeTasks: string[]
}

const parseArgs = (): BootstrapOptions => {
  const rawArgs = Object.fromEntries(
    process.argv
      .slice(2)
      .map(arg => arg.replace(/^--/, ''))
      .map(pair => {
        const [key, value] = pair.split('=')
        return [key, value ?? '']
      })
  )

  const bronzeTasks = (rawArgs.bronzeTasks || process.env.BRONZE_TASK_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean)

  return {
    store: rawArgs.store || process.env.STORE_ID || 'default',
    gold: rawArgs.gold || process.env.GOLD_PROJECT_ID || null,
    silver: rawArgs.silver || process.env.SILVER_PROJECT_ID || null,
    bronzeMode: (rawArgs.bronzeMode || process.env.BRONZE_MODE || 'minimal') as
      | 'minimal'
      | 'target'
      | 'maximal',
    bronzeTargetExtra: Number(rawArgs.bronzeExtra ?? process.env.BRONZE_EXTRA ?? 0),
    bronzeTasks,
  }
}

async function main() {
  const options = parseArgs()
  const now = new Date()

  console.log(`Connecting to store ${options.store}...`)
  const { store } = await createStore(options.store, { enableDevtools: false })

  console.log('Seeding table configuration...')
  await store.commit(
    events.tableConfigurationInitialized({
      storeId: options.store,
      goldProjectId: options.gold ?? null,
      silverProjectId: options.silver ?? null,
      bronzeMode: options.bronzeMode,
      bronzeTargetExtra: options.bronzeTargetExtra,
      version: 0,
      priorityQueueVersion: 0,
      updatedAt: now,
    })
  )

  let queueVersion = 0
  for (const [index, taskId] of options.bronzeTasks.entries()) {
    const nextQueueVersion = nextPriorityQueueVersion({ priorityQueueVersion: queueVersion })
    await store.commit(
      events.bronzeTaskAdded({
        id: crypto.randomUUID(),
        storeId: options.store,
        taskId,
        position: index,
        insertedAt: new Date(now.getTime() + index),
        insertedBy: 'setup-script',
        expectedQueueVersion: queueVersion,
        nextQueueVersion,
      })
    )
    queueVersion = nextQueueVersion
  }

  console.log(
    `Table state ready for store ${options.store} (gold: ${
      options.gold ?? 'none'
    }, silver: ${options.silver ?? 'none'}, bronze tasks: ${options.bronzeTasks.length})`
  )
}

main().catch(err => {
  console.error('Failed to seed table state', err)
  process.exit(1)
})
