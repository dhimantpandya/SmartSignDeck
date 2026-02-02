import { User } from '@/models/user.model'
import { atomWithStorage } from 'jotai/utils'

export const userAtom = atomWithStorage<User | null>('user', null)
export const isLoggedInAtom = atomWithStorage<boolean>('isLoggedIn', false)
