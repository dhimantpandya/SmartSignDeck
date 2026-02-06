// src/components/forms/SignUpForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService, signupSchema } from '@/api/auth.service'
import { useAuth } from '@/hooks/use-auth'

import { Button } from '@/components/custom/button'
import { PasswordInput } from '@/components/custom/password-input'
import { PasswordStrengthIndicator } from '@/components/custom/password-strength-indicator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Routes } from '@/utilities/routes'
import { toast } from '@/components/ui/use-toast'
import { HTMLAttributes } from 'react'
import { mapApiUserToUser } from '@/utilities/mappers/user.mapper'

type SignupRequest = z.infer<typeof signupSchema>

interface SignUpFormProps extends HTMLAttributes<HTMLDivElement> { }

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const queryParams = new URLSearchParams(location.search)
  const inviteCompanyId = queryParams.get('companyId')

  const form = useForm<SignupRequest>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      companyId: inviteCompanyId || '',
    },
  })

  // Pre-fill from navigation state (e.g. redirected from Login)
  if (location.state && !form.formState.isDirty) {
    if (location.state.email) form.setValue('email', location.state.email);
    if (location.state.first_name) form.setValue('first_name', location.state.first_name);
    if (location.state.last_name) form.setValue('last_name', location.state.last_name);
  }

  const onSubmit = async (data: SignupRequest) => {
    setIsLoading(true)
    try {
      await authService.register(data)
      const expiresIn = 600 // 10 minutes
      localStorage.setItem('otp_expires_at', (Date.now() + expiresIn * 1000).toString())
      toast({ title: 'Registration successful! Check your email for OTP.' })
      form.reset()
      navigate(`/otp?email=${data.email}`)
    } catch (error: any) {
      if (error?.message === 'Email already registered but not verified') {
        authService.resendOtp(data.email).catch(console.error) // Trigger resend in background

        toast({
          title: 'Account exists but email is not verified',
          description: 'A new OTP has been sent. Redirecting to verification page...',
        })
        const expiresIn = 600 // 10 minutes
        localStorage.setItem('otp_expires_at', (Date.now() + expiresIn * 1000).toString())
        setTimeout(() => {
          navigate(`/otp?email=${data.email}`)
        }, 2000)
        return
      }

      const message = error?.message || '';
      if (message.includes('Email already registered') || message.includes('Email already taken')) {
        toast({
          title: 'Email is already registered',
          description: 'Redirecting you to the sign-in page...',
        })
        setTimeout(() => {
          navigate('/sign-in', {
            state: { email: data.email }
          })
        }, 2000)
        return
      }

      if (error?.status === 400 && error?.message?.includes('This account was created with')) {
        toast({
          variant: 'destructive',
          title: 'Already Registered',
          description: error.message,
        })
        return
      }

      toast({ title: error?.message ?? 'Registration failed' })
      form.reset()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            {/* First Name */}
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Company Name - Hide if joining via invite */}
            {!inviteCompanyId && (
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                  </FormControl>
                  <PasswordStrengthIndicator password={field.value} className="mt-2" />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirm Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="********" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="mt-2" loading={isLoading}>
              Create Account
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

                  const { signInWithPopup } = await import('firebase/auth');
                  const { auth, googleProvider, isFirebaseConfigured } = await import('@/lib/firebase');

                  if (!isFirebaseConfigured() || !auth || !googleProvider) {
                    toast({
                      variant: 'destructive',
                      title: 'Configuration Error',
                      description: 'Google Sign-Up is not correctly configured. Please check your Firebase API keys.'
                    });
                    return;
                  }

                  const result = await signInWithPopup(auth, googleProvider);
                  const googleUser = result.user;

                  const displayName = googleUser.displayName || '';
                  const [firstName, ...rest] = displayName.split(' ');
                  const lastName = rest.join(' ');

                  form.setValue('email', googleUser.email || '');
                  form.setValue('first_name', firstName || '');
                  form.setValue('last_name', lastName || '');

                  form.clearErrors();

                  toast({
                    title: 'Google details filled',
                    description: 'Please complete registration and verify OTP sent to your email.',
                  });
                } catch (error: any) {
                  // Check if user closed the popup without selecting an account
                  const isPopupClosed =
                    error?.code === 'auth/popup-closed-by-user' ||
                    error?.code === 'auth/cancelled-popup-request' ||
                    error?.message?.includes('popup') ||
                    error?.message?.includes('closed');

                  if (isPopupClosed) {
                    // User cancelled the popup - just close silently without showing error
                    console.log('Google Sign-Up popup closed by user');
                    return; // Exit early, don't show error toast
                  }

                  // The API service throws error.response.data, so we might receive { message: 'User not found' }
                  // We also check error.response?.status just in case the API service behavior changes or we get a raw error.
                  const isUserNotFound =
                    error?.message === 'User not found' ||
                    error?.response?.status === 404

                  if (isUserNotFound) {
                    const { auth } = await import('@/lib/firebase');
                    const currentUser = auth?.currentUser;
                    if (currentUser) {
                      const displayName = currentUser.displayName || '';
                      const [firstName, ...rest] = displayName.split(' ');
                      const lastName = rest.join(' ');

                      form.setValue('email', currentUser.email || '');
                      form.setValue('first_name', firstName || '');
                      form.setValue('last_name', lastName || '');

                      // Clear errors again after setting values to ensure no red highlights on filled fields
                      form.clearErrors();

                      if (error?.status === 400 && error?.message?.includes('This account was created with')) {
                        toast({
                          variant: 'destructive',
                          title: 'Wrong Signup Method',
                          description: error.message,
                        })
                        return
                      }

                      toast({ title: 'Please complete registration', description: 'Enter password and company name.' });
                      return;
                    }
                  } else if (
                    (error?.status === 400 || error?.response?.status === 400) &&
                    error?.message === 'Email already registered'
                  ) {
                    // Set the error on the email field specifically
                    form.setError('email', {
                      type: 'manual',
                      message: 'Email already registered'
                    });

                    toast({
                      title: 'Email is already registered',
                      description: 'Redirecting you to the sign-in page...',
                    });

                    // Wait 2 seconds so the user can read the message
                    setTimeout(() => {
                      navigate('/sign-in', {
                        state: {
                          email: form.getValues('email')
                        }
                      });
                    }, 2000)
                    return;
                  }

                  console.error('Google Sign-Up Error:', error);
                  toast({ title: error?.message ?? 'Google Sign-Up failed', variant: 'destructive' });
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
              Already have an account?{' '}
              <Link to="/sign-in" className="underline hover:text-primary">
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </div >
  )
}
