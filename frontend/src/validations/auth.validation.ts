import { Regex } from '@/utilities/regex'
import { z } from 'zod'
const { UPPERCASE, LOWERCASE, NUMBER, SPECIAL_CHAR } = Regex

const passwordValidation = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .regex(UPPERCASE, {
    message: 'Password must include at least one uppercase letter',
  })
  .regex(LOWERCASE, {
    message: 'Password must include at least one lowercase letter',
  })
  .regex(NUMBER, { message: 'Password must include at least one number' })
  .regex(SPECIAL_CHAR, {
    message: 'Password must include at least one special character',
  })
  .max(20, { message: 'Password must be no longer than 20 characters' })

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
  password: passwordValidation,
})

export type LoginRequest = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: 'Please enter your email' })
      .email({ message: 'Invalid email address' }),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export type SignupRequest = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Please enter your email' })
    .email({ message: 'Invalid email address' }),
})

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordSchema>

export const changePasswordSchema = z
  .object({
    oldPassword: passwordValidation,
    newPassword: passwordValidation,
    confirmPassword: passwordValidation,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
