import posthog from 'posthog-js'

type QueuedEvent = {
  id: string
  event: string
  properties?: Record<string, any>
  distinct_id: string
  ts: string
  retries: number
}

interface EventQueueStore {
  add(ev: QueuedEvent): Promise<void>
  list(limit: number): Promise<QueuedEvent[]>
  remove(ids: string[]): Promise<void>
  size(): Promise<number>
}

export function liveStoreQueueAdapter(liveStore: { table<T>(name: string): any }): EventQueueStore {
  const table = liveStore.table<QueuedEvent>('analyticsQueue')
  return {
    async add(ev) {
      await table.add(ev)
    },
    async list(limit) {
      return await table.orderBy('ts').limit(limit).toArray()
    },
    async remove(ids) {
      await table.bulkDelete(ids)
    },
    async size() {
      return table.count()
    },
  }
}

function idbAdapter(): EventQueueStore {
  const DB = 'phq'
  const STORE = 'q'
  let dbPromise: Promise<IDBDatabase> | null = null
  function db(): Promise<IDBDatabase> {
    if (!dbPromise)
      dbPromise = new Promise((res, rej) => {
        const r = indexedDB.open(DB, 1)
        r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' })
        r.onsuccess = () => res(r.result)
        r.onerror = () => rej(r.error)
      })
    return dbPromise
  }
  return {
    async add(ev) {
      const d = await db()
      await new Promise<void>((res, rej) => {
        const tx = d.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(ev)
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
      })
    },
    async list(limit) {
      const d = await db()
      return await new Promise<QueuedEvent[]>((res, rej) => {
        const tx = d.transaction(STORE, 'readonly')
        const store = tx.objectStore(STORE)
        const req = store.openCursor()
        const out: QueuedEvent[] = []
        req.onsuccess = () => {
          const cur = req.result
          if (!cur || out.length >= limit) return res(out)
          out.push(cur.value)
          cur.continue()
        }
        req.onerror = () => rej(req.error)
      })
    },
    async remove(ids) {
      const d = await db()
      await new Promise<void>((res, rej) => {
        const tx = d.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        ids.forEach(id => store.delete(id))
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error)
      })
    },
    async size() {
      const d = await db()
      return await new Promise<number>((res, rej) => {
        const tx = d.transaction(STORE, 'readonly')
        const req = tx.objectStore(STORE).count()
        req.onsuccess = () => res(req.result)
        req.onerror = () => rej(req.error)
      })
    },
  }
}

const MAX_QUEUE = 1000
const BATCH_SIZE = 50
const FLUSH_INTERVAL_MS = 30_000

let store: EventQueueStore
let flushing = false
let backoffMs = 1000

function distinctId(): string {
  const k = 'ph_did'
  let id = localStorage.getItem(k)
  if (!id) {
    id = (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2)
    localStorage.setItem(k, id as string)
  }
  return id as string
}

export function initAnalytics(opts: {
  liveStore?: any
  posthogKey: string
  apiBase?: string
  debug?: boolean
}) {
  store = opts?.liveStore ? liveStoreQueueAdapter(opts.liveStore) : idbAdapter()

  posthog.init(opts.posthogKey, {
    api_host: (opts?.apiBase ?? '/e').replace(/\/$/, ''),
    capture_pageview: false,
    persistence: 'localStorage+cookie',
    property_blacklist: [],
    debug: !!opts?.debug,
  })

  posthog.register({ $device_id: distinctId() })

  void flush()
  window.addEventListener('online', () => void flush())
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') beaconFlush()
  })
  setInterval(() => void flush(), FLUSH_INTERVAL_MS)
}

export async function capture(event: string, properties?: Record<string, any>) {
  const did = distinctId()
  const ev: QueuedEvent = {
    id: (crypto as any).randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    event,
    properties: { ...properties, $device_id: did },
    distinct_id: did,
    ts: new Date().toISOString(),
    retries: 0,
  }

  const online = navigator.onLine
  if (online) {
    try {
      posthog.capture(event, ev.properties)
      return
    } catch {
      // fallthrough to queue
    }
  }

  if ((await store.size()) >= MAX_QUEUE) {
    const old = await store.list(1)
    if (old[0]) await store.remove([old[0].id])
  }
  await store.add(ev)
}

export async function flush() {
  if (flushing) return
  if (!navigator.onLine) return

  flushing = true
  try {
    for (;;) {
      const batch = await store.list(BATCH_SIZE)
      if (batch.length === 0) {
        backoffMs = 1000
        break
      }

      const payload = {
        batch: batch.map(b => ({
          event: b.event,
          distinct_id: b.distinct_id,
          properties: b.properties,
          timestamp: b.ts,
        })),
      }

      const res = await fetch('/e/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        await store.remove(batch.map(b => b.id))
        backoffMs = 1000
        continue
      } else {
        await sleep(backoffMs)
        backoffMs = Math.min(backoffMs * 2, 5000)
        break
      }
    }
  } finally {
    flushing = false
  }
}

function beaconFlush() {
  const run = async () => {
    const head = await store.list(20)
    if (head.length === 0) return
    const payload = {
      batch: head.map(b => ({
        event: b.event,
        distinct_id: b.distinct_id,
        properties: b.properties,
        timestamp: b.ts,
      })),
    }
    const data = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const ok = navigator.sendBeacon?.('/e/batch', data)
    if (ok) await store.remove(head.map(b => b.id))
  }
  void run()
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
