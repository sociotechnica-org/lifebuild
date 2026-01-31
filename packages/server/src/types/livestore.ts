import type { Store } from '@livestore/livestore'
import { schema } from '@lifebuild/shared/schema'

type LiveStoreBase = Store<typeof schema>

export type LiveStore = Omit<LiveStoreBase, 'query'> & {
  query: <T = any>(...args: any[]) => T
}
