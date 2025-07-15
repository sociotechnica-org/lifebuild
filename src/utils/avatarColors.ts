export const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-lime-500',
  'bg-amber-500',
  'bg-sky-500',
  'bg-fuchsia-500',
  'bg-slate-500',
  'bg-gray-500',
  'bg-stone-500',
] as const

export function getAvatarColor(workerId: string): string {
  // Create a simple hash from the worker ID
  let hash = 0
  for (let i = 0; i < workerId.length; i++) {
    const char = workerId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash | 0 // Convert to 32-bit integer
  }

  // Use absolute value to ensure positive index
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index] as string
}
