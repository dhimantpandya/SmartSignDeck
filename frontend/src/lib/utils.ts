import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
