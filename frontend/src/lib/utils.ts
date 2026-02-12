import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function extractId(obj: any): string {
  if (!obj) return ''
  if (typeof obj === 'string') return obj.trim().toLowerCase()
  const id = obj.id || obj._id || obj.userId || obj.friendId || obj.senderId || obj.recipientId
  if (id) return id.toString().trim().toLowerCase()
  return ''
}

export function isSameId(id1: any, id2: any): boolean {
  const s1 = extractId(id1)
  const s2 = extractId(id2)
  return s1 !== '' && s2 !== '' && s1 === s2
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRole(role?: string) {
  if (!role) return 'User'
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getTableStatusMessage(isFetching: boolean, isError: boolean) {
  if (isFetching) return 'Fetching records'
  if (isError) return 'Error fetching data'
  return 'No results.'
}
