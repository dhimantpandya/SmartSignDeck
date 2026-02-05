// src/components/forms/UserAuthForm.tsx

import { useState, type HTMLAttributes } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'

import { authService } from '@/api'
import { LoginRequest, loginSchema } from '@/validations/auth.validation'
import { useAuth } from '@/hooks/use-auth'
import { User } from '@/models/user.model'
import { cn } from '@/lib/utils'
import { Routes } from '@/utilities/routes'
import { toast } from '@/components/ui/use-toast'
import { mapApiUserToUser } from '@/utilities/mappers/user.mapper'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/custom/password-input'
import { Button } from '@/components/custom/button'

/* ================= API RESPONSE ================= */

/* ================= API RESPONSE ================= */

interface LoginResponse {
  user: {
    id: number | string
    email: string
    first_name: string
    last_name: string
    role?: User['role'] | string
    is_email_verified?: boolean
    avatar?: string
    gender?: string
    dob?: string | Date
    language?: string
  }
  tokens?: {
    access: { token: string }
    refresh?: { token: string }
  }
}

interface UserAuthFormProps extends HTMLAttributes<HTMLDivElement> { }

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  /* ================= MUTATION ================= */

  const mutation = useMutation<LoginResponse, any, LoginRequest>({
    mutationFn: (data) =>
      authService.login(data) as Promise<LoginResponse>,

    onSuccess: (response) => {
      const apiUser = response.user

      const user = mapApiUserToUser(apiUser)

      const refreshToken =
        !import.meta.env.VITE_COOKIE_BASED_AUTHENTICATION
          ? response.tokens?.refresh?.token ?? null
          : null

      const accessToken = response.tokens?.access ?? null
      login(user, refreshToken, accessToken)
      setIsLoading(false)

      toast({ title: 'Login successful' })
      form.reset()
      navigate(Routes.DASHBOARD)
    },

    onError: (error: any) => {
      setIsLoading(false)

      const message = error?.message || '';
      const isUnregistered =
        (error?.status === 401 && message.toLowerCase().includes('not registered')) ||
        error?.status === 404

      if (isUnregistered) {
        toast({
          title: 'Email is not registered',
          description: 'Redirecting you to the sign-up page...',
        })

        // Wait a bit so the user can see the message
        setTimeout(() => {
          navigate('/sign-up', {
            state: {
              email: form.getValues('email'),
            },
          })
        }, 2000)
        return
      }

      if (error?.status === 403 && error?.message === 'Email not verified') {
        const email = form.getValues('email')
        authService.resendOtp(email).catch(console.error) // Trigger resend in background

        const expiresIn = 600 // 10 minutes
        localStorage.setItem('otp_expires_at', (Date.now() + expiresIn * 1000).toString())
        toast({
          title: 'Email not verified',
          description: 'A new OTP has been sent to your email. Please verify your account.',
        })
        navigate(`/otp?email=${email}`)
        return
      }

      if (error?.status === 400 && error?.message?.includes('This account was created with')) {
        toast({
          variant: 'destructive',
          title: 'Wrong Login Method',
          description: error.message,
        })
        return
      }

      toast({ title: error?.message ?? 'Login failed' })
      form.reset()
    },
  })

  const onSubmit = (data: LoginRequest) => {
    setIsLoading(true)
    mutation.mutate(data)
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Password</FormLabel>
                  </div>
                  <FormControl>
                    <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                  </FormControl>
                  <div className="flex justify-end">
                    <Link
                      to={Routes.FORGOT_PASSWORD}
                      className='text-sm font-medium text-muted-foreground hover:opacity-75'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={isLoading} className='mt-2'>
              Sign In
            </Button>

            <div className='relative mt-2'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-background px-2 text-muted-foreground'>
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant='outline'
              type='button'
              disabled={isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  form.clearErrors(); // Clear any pre-existing validation errors
                  // Dynamic import to avoid SSR/build issues if needed, though standard import is fine
                  const { signInWithPopup } = await import('firebase/auth');
                  const { auth, googleProvider } = await import('@/lib/firebase'); // Import from our init file

                  const result = await signInWithPopup(auth, googleProvider);
                  const idToken = await result.user.getIdToken();

                  const response = await authService.firebaseLogin(idToken, 'login');

                  // Handle success similar to standard login
                  const apiUser = response.user;
                  const user = mapApiUserToUser(apiUser)

                  const refreshToken = !import.meta.env.VITE_COOKIE_BASED_AUTHENTICATION
                    ? response.tokens?.refresh?.token ?? null
                    : null;
                  const accessToken = response.tokens?.access ?? null

                  login(user, refreshToken, accessToken);

                  toast({ title: 'Login successful' });
                  navigate(Routes.DASHBOARD);
                } catch (error: any) {
                  console.error('Google Sign-In Error:', error);

                  // Check if user closed the popup without selecting an account
                  const isPopupClosed =
                    error?.code === 'auth/popup-closed-by-user' ||
                    error?.code === 'auth/cancelled-popup-request' ||
                    error?.message?.includes('popup') ||
                    error?.message?.includes('closed');

                  if (isPopupClosed) {
                    // User cancelled the popup - just close silently without showing error
                    console.log('Google Sign-In popup closed by user');
                    return; // Exit early, don't show error toast
                  }

                  // Check if it's the 404 User Not Found error from our backend
                  const isUserNotFound =
                    error?.message === 'User not found' ||
                    error?.status === 404 ||
                    error?.response?.status === 404

                  if (isUserNotFound) {
                    toast({
                      title: 'Email is not registered',
                      description: 'Redirecting you to the sign-up page...',
                    })

                    const { auth } = await import('@/lib/firebase');
                    const currentUser = auth.currentUser;

                    // Wait 2 seconds so the user can read the message
                    setTimeout(() => {
                      if (currentUser) {
                        const displayName = currentUser.displayName || '';
                        const [firstName, ...rest] = displayName.split(' ');
                        const lastName = rest.join(' ');

                        navigate('/sign-up', {
                          state: {
                            email: currentUser.email,
                            first_name: firstName || '',
                            last_name: lastName || ''
                          }
                        });
                      } else {
                        navigate('/sign-up');
                      }
                    }, 2000)
                    return;
                  }

                  if (error?.status === 400 && error?.message?.includes('This account was created with')) {
                    toast({
                      variant: 'destructive',
                      title: 'Wrong Login Method',
                      description: error.message,
                    })
                    return
                  }

                  const errorMessage = error?.message || (typeof error === 'string' ? error : 'Google Sign-In failed');
                  toast({ variant: 'destructive', title: 'Sign-In Failed', description: errorMessage });
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <svg
                role='img'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
                className='mr-2 h-4 w-4'
              >
                <path
                  d='M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.152-1.928 4.176-1.152 1.152-2.8 2.392-5.92 2.392-5.336 0-9.44-4.32-9.44-9.656 0-5.336 4.104-9.656 9.44-9.656 3.152 0 5.44 1.232 7.144 2.84l2.368-2.368A11.332 11.332 0 0 0 12.48 0C5.584 0 0 5.584 0 12.48s5.584 12.48 12.48 12.48c3.752 0 6.592-1.232 8.872-3.6 2.328-2.328 3.072-5.576 3.072-8.184 0-.752-.056-1.464-.176-2.112H12.48z'
                  fill='currentColor'
                />
              </svg>
              Google
            </Button>


            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link to="/sign-up" className="underline hover:text-primary">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </div >
  )
}
