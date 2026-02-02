import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getTableStatusMessage(isFetching: boolean, isError: boolean) {
  if (isFetching) return 'Fetching records'
  if (isError) return 'Error fetching data'
  return 'No results.'
}
