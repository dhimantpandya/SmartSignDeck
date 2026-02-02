import { Gender, Language, Roles } from '@/validations/user.validation'

export const paginationOptions = [10, 20, 30, 40, 50]
export const roleOptions: {
  label: string
  value: Roles
}[] = [
  { label: 'Admin', value: Roles.ADMIN },
  { label: 'User', value: Roles.USER },
  { label: 'Moderator', value: Roles.USER },
  { label: 'Guest', value: Roles.GUEST },
] as const

export const genderOptions: {
  label: string
  value: Gender
}[] = [
  { label: 'Male', value: Gender.MALE },
  { label: 'Female', value: Gender.FEMALE },
  { label: 'Other', value: Gender.OTHER },
]

export const languageOptions: {
  label: string
  value: Language
}[] = [
  { label: 'English', value: Language.ENGLISH },
  { label: 'French', value: Language.FRENCH },
  { label: 'German', value: Language.GERMEN },
]
