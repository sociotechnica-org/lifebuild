const UINT32_MAX = 0xffffffff

const normalizeUnitSeed = (value: number): number => {
  const normalized = value % 1
  return normalized >= 0 ? normalized : normalized + 1
}

const fallbackRandomSeed = (): number => {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    return (randomBuffer[0] ?? 0) / UINT32_MAX
  }

  return Math.random()
}

export const deriveMapShaderSeedFromStoreId = (storeId: string): number => {
  // FNV-1a 32-bit hash for deterministic per-store seed derivation.
  let hash = 0x811c9dc5

  for (let index = 0; index < storeId.length; index += 1) {
    hash ^= storeId.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }

  return normalizeUnitSeed((hash >>> 0) / UINT32_MAX)
}

export const parseMapShaderSeed = (value: string | null | undefined): number | null => {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return normalizeUnitSeed(parsed)
}

export const formatMapShaderSeed = (value: number): string => {
  return normalizeUnitSeed(value).toFixed(6)
}

export const getStoreIdFromSearch = (search: string): string | null => {
  const resolvedSearch = search.startsWith('?') ? search.slice(1) : search
  const params = new URLSearchParams(resolvedSearch)
  const storeId = params.get('storeId')?.trim()
  return storeId ? storeId : null
}

export const createInitialMapShaderSeed = (storeId: string | null | undefined): number => {
  if (storeId) {
    return deriveMapShaderSeedFromStoreId(storeId)
  }

  return fallbackRandomSeed()
}
