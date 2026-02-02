import { TableState } from '@/hooks/use-table-state'
import { GenericResponse } from './generic'
import { ProfileUpdateRequest, Roles } from '@/validations/user.validation'

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: Roles
  companyId?: string
  companyName?: string
  avatar?: string
  gender?: string
  dob?: string | Date
  language?: string
  is_email_verified: boolean
}

export type LoginResponse = GenericResponse<{
  user: User
  tokens: Tokens
}>

export interface Tokens {
  access: Access
  refresh?: Access
}

export interface Access {
  token: string
  expires: Date
}

export type GenerateNewTokenResponse = GenericResponse<Tokens>

export type UserListRequest = TableState<UserListFilter>

export type UserListResponse = GenericResponse<{
  users: User[]
  count: number
}>
export type UserListFilter = {
  role: Roles[]
  search: string
  companyId?: string
}

export type UserAddOrUpdateResponse = GenericResponse<User>
export type UserDeletionResponse = Pick<
  GenericResponse<unknown>,
  'status' | 'message'
>

export type ChangePasswordResponse = GenericResponse<{
  message: string
}>

export type UpdateProfileResponse = GenericResponse<ProfileUpdateRequest>
