const HEAD_MISMATCH_REGEX =
  /During boot the backend head .* should never be greater than the local head/i

const extractMessages = (error: unknown, depth = 0, seen = new Set<object>()): string[] => {
  if (depth > 4) return []
  if (error === null || error === undefined) return []

  if (typeof error === 'string') {
    return [error]
  }

  if (typeof error !== 'object') {
    return [String(error)]
  }

  if (seen.has(error)) return []
  seen.add(error)

  const messages: string[] = []

  if (error instanceof Error) {
    messages.push(error.message, error.name)
  }

  const errorAny = error as {
    message?: unknown
    cause?: unknown
    _tag?: unknown
  }

  if (typeof errorAny.message === 'string') {
    messages.push(errorAny.message)
  }

  if (typeof errorAny._tag === 'string') {
    messages.push(errorAny._tag)
  }

  if ('cause' in errorAny) {
    messages.push(...extractMessages(errorAny.cause, depth + 1, seen))
  }

  return messages
}

export const isLiveStoreHeadMismatchError = (error: unknown): boolean => {
  const messages = extractMessages(error)

  for (const message of messages) {
    if (HEAD_MISMATCH_REGEX.test(message)) {
      return true
    }
  }

  return false
}
