// src/components/forms/SignUpForm.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authService, signupSchema } from '@/api/auth.service'
import { Routes } from '@/utilities/routes'

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
import { toast } from '@/components/ui/use-toast'
import { HTMLAttributes } from 'react'

type SignupRequest = z.infer<typeof signupSchema>

interface SignUpFormProps extends HTMLAttributes<HTMLDivElement> { }

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const queryParams = new URLSearchParams(location.search)
  const inviteCompanyId = queryParams.get('companyId')
  const inviteRole = queryParams.get('role')
  const inviteToken = queryParams.get('inviteToken')

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
      role: inviteRole || '',
    },
  })

  // Pre-fill from navigation state (e.g. redirected from Login)
  useEffect(() => {
    if (location.state) {
      if (location.state.email) form.setValue('email', location.state.email);
      if (location.state.first_name) form.setValue('first_name', location.state.first_name);
      if (location.state.last_name) form.setValue('last_name', location.state.last_name);
    }
  }, [location.state, form]);

  const onSubmit = async (data: SignupRequest) => {
    setIsLoading(true)

    // 5s safety timeout
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    try {
      await authService.register({
        ...data,
        companyId: data.companyId || inviteCompanyId || undefined,
        role: data.role || inviteRole || undefined,
        inviteToken: inviteToken || undefined,
      })
      const expiresIn = 120 // 2 minutes
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
        const expiresIn = 120 // 2 minutes
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
      if (timeoutId) clearTimeout(timeoutId);
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
                  <FormLabel className='text-xs font-semibold text-white'>First Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John"
                      {...field}
                      className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                    />
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
                  <FormLabel className='text-xs font-semibold text-white'>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Doe"
                      {...field}
                      className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                    />
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
                  <FormLabel className='text-xs font-semibold text-white'>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com"
                      autoComplete="off"
                      {...field}
                      className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                    />
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
                    <FormLabel className='text-xs font-semibold text-white'>Company Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Inc."
                        autoComplete="off"
                        {...field}
                        className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                      />
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
                  <FormLabel className='text-xs font-semibold text-white'>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="********"
                      autoComplete="new-password"
                      {...field}
                      className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                    />
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
                  <FormLabel className='text-xs font-semibold text-white'>Confirm Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="********"
                      autoComplete="new-password"
                      {...field}
                      className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" className="mt-4 h-12 w-full rounded-xl font-black uppercase tracking-widest shadow-xl" loading={isLoading}>
              Create Account
            </Button>

            <div className='relative my-8'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-white/10' />
              </div>
              <div className='relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em]'>
                <span className='bg-transparent px-4 text-white font-bold'>
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant='outline'
              type='button'
              className='h-12 w-full rounded-xl border-white/20 bg-white/5 font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-lg'
              disabled={isLoading}
              onClick={async () => {
                let timeoutId: any;
                try {
                  setIsLoading(true);
                  // 5s safety timeout for loading state
                  timeoutId = setTimeout(() => setIsLoading(false), 5000);

                  form.clearErrors();

                  const { signInWithPopup } = await import('firebase/auth');
                  const { auth, googleProvider, isFirebaseConfigured } = await import('@/lib/firebase');

                  if (!isFirebaseConfigured() || !auth || !googleProvider) {
                    toast({
                      variant: 'destructive',
                      title: 'Configuration Error',
                      description: 'Google Sign-Up is not correctly configured. Please check your Firebase API keys.'
                    });
                    setIsLoading(false);
                    return;
                  }

                  const result = await signInWithPopup(auth, googleProvider);
                  const idToken = await result.user.getIdToken();
                  const role = inviteRole || 'user';

                  // Call backend API with mode 'register'
                  const response = await authService.firebaseLogin(
                    idToken,
                    'register',
                    role,
                    inviteToken || undefined
                  );


                  const expiresIn = 120; // 2 minutes
                  localStorage.setItem('otp_expires_at', (Date.now() + expiresIn * 1000).toString());

                  toast({
                    title: 'Google authentication successful',
                    description: 'Directing you to verification page...'
                  });

                  navigate(`/otp?email=${response.user?.email || result.user.email}`);
                } catch (error: any) {
                  // Check if user closed the popup without selecting an account
                  const isPopupClosed =
                    error?.code === 'auth/popup-closed-by-user' ||
                    error?.code === 'auth/cancelled-popup-request' ||
                    error?.message?.includes('popup') ||
                    error?.message?.includes('closed');

                  if (isPopupClosed) {
                    console.log('Google Sign-Up popup closed by user');
                    setIsLoading(false);
                    return;
                  }

                  if (error?.status === 400 && error?.message === 'Email already registered') {
                    toast({
                      title: 'Email is already registered',
                      description: 'Redirecting you to the sign-in page...',
                    });

                    setTimeout(() => {
                      navigate('/sign-in', {
                        state: { email: error.email || form.getValues('email') } // Use error.email if available, otherwise form value
                      });
                    }, 2000);
                    setIsLoading(false);
                    return;
                  }

                  if (error?.status === 400 && error?.message?.includes('This account was created with')) {
                    toast({
                      variant: 'destructive',
                      title: 'Wrong Signup Method',
                      description: error.message,
                    });
                    setIsLoading(false);
                    return;
                  }

                  console.error('Google Sign-Up Error:', error);
                  toast({ title: error?.message ?? 'Google Sign-Up failed', variant: 'destructive' });
                } finally {
                  if (timeoutId) clearTimeout(timeoutId);
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
            <div className='mt-6 flex flex-col items-center gap-4 text-center text-[10px] font-bold uppercase tracking-[0.2em]'>
              <div className='flex items-center gap-2 text-white font-bold transition-colors'>
                Need help? <Link to={Routes.CONTACT_US} className='text-white underline underline-offset-4 hover:text-white/80 transition-colors'>Reach out</Link>
              </div>
              <div className='flex items-center gap-2 text-white font-bold'>
                <span className='h-[1px] w-6 bg-white/20' />
                <span>OR</span>
                <span className='h-[1px] w-6 bg-white/20' />
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-white">
                Have an invitation?{' '}
                <Link
                  to={Routes.INVITED}
                  className='text-white underline underline-offset-4 hover:text-white/80 transition-colors'
                >
                  Join workspace
                </Link>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div >
  )
}
