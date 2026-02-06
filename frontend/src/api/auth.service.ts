// src/api/auth.service.ts
import { apiService } from './api.service'
import { z } from 'zod'

// ===== INTERFACES =====
export interface SignupRequest {
  [key: string]: unknown          // <-- needed for apiService compatibility
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  companyName?: string
  companyId?: string
}

export interface LoginRequest {
  [key: string]: unknown
  email: string
  password: string
}

export interface VerifyOtpRequest {
  [key: string]: unknown
  email: string
  otp: string
}

export interface ForgotPasswordRequest {
  [key: string]: unknown
  email: string
}

export interface VerifyResetOtpRequest {
  [key: string]: unknown
  email: string
  otp: string
}

export interface ResetPasswordRequest {
  [key: string]: unknown
  token: string
  password: string
}

export interface ChangePasswordRequest {
  [key: string]: unknown
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

// ===== ZOD SCHEMA =====
export const signupSchema = z
  .object({
    first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(32, 'Password must not exceed 32 characters')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/\d/, 'Password must contain at least 1 digit')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character'),
    confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters'),
    companyName: z.string().min(1, 'Company Name is required'),
    companyId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ===== AUTH FUNCTIONS =====
const register = async (data: SignupRequest) => {
  return apiService.post('/v1/auth/register', data)
}

const login = async (data: LoginRequest) => {
  return apiService.post('/v1/auth/login', data)
}

const verifyOtp = async (data: VerifyOtpRequest) => {
  return apiService.post('/v1/auth/verify-otp', data)
}

const resendOtp = async (email: string) => {
  return apiService.post('/v1/auth/resend-otp', { email })
}

/* ================= FORGOT PASSWORD ================= */
const forgotPassword = async (data: ForgotPasswordRequest) => {
  return apiService.post('/v1/auth/forgot-password', data)
}

const verifyResetOtp = async (data: VerifyResetOtpRequest) => {
  return apiService.post('/v1/auth/verify-reset-otp', data)
}

const resetPassword = async (data: ResetPasswordRequest) => {
  return apiService.post('/v1/auth/reset-password', data)
}

const changePassword = async (data: ChangePasswordRequest) => {
  return apiService.post<any>('/v1/auth/change-password', data)
}

/* ================= FIREBASE LOGIN ================= */
const firebaseLogin = async (idToken: string, mode: 'login' | 'register' = 'login') => {
  return apiService.post<any>('/v1/auth/firebase', { idToken, mode })
}

const getAccessToken = async (refreshToken: string) => {
  return apiService.post<any>('/v1/auth/refresh-tokens', { refreshToken })
}

const getUserInfo = async () => {
  return apiService.get<any>('/v1/auth/profile')
}

const logout = async (refreshToken: string) => {
  return apiService.post('/v1/auth/logout', { refreshToken })
}

/* ================= DELETE ACCOUNT (SELF) ================= */
const deleteAccount = async () => {
  return apiService.delete<void>('/v1/auth/account')
}

// ===== EXPORT SINGLE OBJECT =====
export const authService = {
  register,
  login,
  verifyOtp,
  resendOtp,
  firebaseLogin,
  getAccessToken,
  getUserInfo,
  logout,
  signupSchema,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  changePassword,
  deleteAccount,
}
