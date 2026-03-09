import { Button } from '@/components/custom/button'
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
import { PasswordStrengthIndicator } from '@/components/custom/password-strength-indicator'
import { PinInput, PinInputField } from '@/components/custom/pin-input'
import { cn } from '@/lib/utils'
import {
  ForgotPasswordRequest,
  forgotPasswordSchema,
} from '@/validations/auth.validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { HTMLAttributes, useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { authService } from '@/api'
import { toast } from '@/components/ui/use-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'


interface ForgotFormProps extends HTMLAttributes<HTMLDivElement> { }

// Schemas for different steps
const emailStepSchema = forgotPasswordSchema
const otpStepSchema = z.object({
  otp: z.string().min(6, 'OTP must be 6 characters'),
})
const passwordStepSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export function ForgotForm({ className, ...props }: ForgotFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [disabledOtpBtn, setDisabledOtpBtn] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialized = useRef(false)
  const { login } = useAuth()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const emailParam = searchParams.get('email')
    const stepParam = searchParams.get('step')

    if (emailParam) {
      setEmail(emailParam)
      emailForm.setValue('email', emailParam)
    }

    if (stepParam === '2' && emailParam) {
      setStep(2)
      setTimeLeft(120)
    }
  }, [searchParams])

  // Timer state (2 minutes = 120 seconds)
  const [timeLeft, setTimeLeft] = useState(120)
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Timer effects (same as OtpForm)
  useEffect(() => {
    if (step !== 2) return // Only run timer on OTP step
    if (timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, step])

  useEffect(() => {
    if (resendCooldown <= 0) {
      setCanResend(true)
      return
    }

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // --- Step 1: Email ---
  const emailForm = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
  })

  // --- Step 2: OTP ---
  const otpForm = useForm<{ otp: string }>({
    resolver: zodResolver(otpStepSchema),
    defaultValues: { otp: '' },
  })

  // --- Step 3: Password ---
  const passwordForm = useForm<z.infer<typeof passwordStepSchema>>({
    resolver: zodResolver(passwordStepSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  // Handlers
  const onEmailSubmit = async (data: ForgotPasswordRequest) => {
    setIsLoading(true)
    try {
      await authService.forgotPassword(data)
      setEmail(data.email)
      setStep(2)
      setTimeLeft(120) // Start 2m timer
      setCanResend(false)
      setResendCooldown(60) // Initial cooldown
      toast({ title: 'OTP sent to your email' })
    } catch (error: any) {
      if (error?.status === 401 && error?.message?.includes('not registered')) {
        toast({
          title: 'Email is not registered',
          description: 'Redirecting you to the sign-up page...',
        })
        setTimeout(() => {
          navigate('/sign-up', {
            state: { email: data.email }
          })
        }, 2000)
        return
      }
      toast({ title: error?.message ?? 'Failed to send OTP' })
    } finally {
      setIsLoading(false)
    }
  }

  const onOtpSubmit = async (data: { otp: string }) => {
    setIsLoading(true)
    try {
      const res = await authService.verifyResetOtp({ email, otp: data.otp })
      // Backend returns { status: 'success', data: { token: '...' } } ???
      // Checking controller response: successResponse(res, ..., { token: resetToken })
      // Service implementation logic? authService uses generic api.post
      // We assume response.data contains the token directly or nested.
      // Axios response structure: response.data is the payload.
      // Payload structure: { status: 'success', message: '...', data: { token: '...' } }

      const token = (res as any).token
      if (token) {
        setResetToken(token)
        setStep(3)
        toast({ title: 'OTP verified' })
      } else {
        toast({ title: 'Invalid response from server' })
      }
    } catch (error: any) {
      toast({ title: error?.message ?? 'Invalid OTP' })
      otpForm.reset() // Clear invalid OTP
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: z.infer<typeof passwordStepSchema>) => {
    setIsLoading(true)
    try {
      const res = await authService.resetPassword({ token: resetToken, password: data.password })

      const { user, tokens } = res as any
      if (user && tokens) {
        login(user, tokens.refresh.token, tokens.access)
        toast({ title: 'Password reset successful. Welcome back!' })
        navigate('/')
      } else {
        toast({ title: 'Password reset successful. Please login.' })
        navigate('/sign-in')
      }
    } catch (error: any) {
      toast({ title: error?.message ?? 'Failed to reset password' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await authService.forgotPassword({ email }); // Re-use forgot password to resend
      toast({ title: 'OTP resent successfully' });
      setTimeLeft(120)
      setResendCooldown(60)
      setCanResend(false)
      otpForm.reset()
    } catch (error: any) {
      toast({ title: error?.message ?? 'Failed to resend OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      {/* STEP 1: EMAIL */}
      {step === 1 && (
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
            <div className='grid gap-2'>
              <FormField
                control={emailForm.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-xs font-semibold text-[#1a1a2e] md:text-muted-foreground'>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='name@example.com'
                        {...field}
                        className='h-12 rounded-xl border-white/20 bg-white/5 text-[#1a1a2e] placeholder:text-[#1a1a2e]/60 focus-visible:ring-primary/50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='mt-4 h-12 rounded-xl font-black uppercase tracking-widest shadow-xl' loading={isLoading}>
                Send Reset Code
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* STEP 2: OTP */}
      {step === 2 && (
        <Form {...otpForm}>
          <form onSubmit={otpForm.handleSubmit(onOtpSubmit)}>
            <div className='grid gap-4'>
              <div className="flex flex-col space-y-2 text-center mb-4 w-full">
                <h1 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-[#1a1a2e]/90 md:text-muted-foreground/60 break-words whitespace-normal w-full px-2">
                  Enter the 6-digit code sent to <br className="hidden md:block" /> <span className="text-[#1a1a2e] md:text-foreground font-black break-all">{email}</span>
                </h1>
              </div>

              <FormField
                control={otpForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">OTP</FormLabel>
                    <FormControl>
                      <PinInput
                        {...field}
                        className="flex h-12 justify-center gap-2 md:gap-3"
                        onComplete={() => setDisabledOtpBtn(false)}
                        onIncomplete={() => setDisabledOtpBtn(true)}
                      >
                        {Array.from({ length: 6 }, (_, i) => (
                          <PinInputField
                            key={i}
                            component="input"
                            className="otp-digit-input w-10 h-10 md:w-14 md:h-14 text-center text-lg md:text-xl font-black rounded-xl md:rounded-2xl border-white/20 bg-white/5 focus:ring-primary/50"
                          />
                        ))}
                      </PinInput>
                    </FormControl>
                    <FormMessage />
                    <div className="text-center mt-4">
                      {timeLeft > 0 ? (
                        <span className="text-xs font-bold uppercase tracking-widest text-[#1a1a2e]/90 md:text-muted-foreground/60">
                          Code expires in <span className="text-[#1a1a2e] md:text-foreground font-black">{formatTime(timeLeft)}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-black uppercase tracking-widest text-destructive">OTP expired</span>
                      )}
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" loading={isLoading} disabled={disabledOtpBtn || timeLeft === 0} className='mt-4 h-12 rounded-xl font-black uppercase tracking-widest shadow-xl w-full'>
                Verify OTP
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#1a1a2e]/80 md:text-muted-foreground hover:text-[#1a1a2e] md:hover:text-primary transition-colors h-auto whitespace-normal break-words"
                onClick={handleResendOtp}
                disabled={!canResend || resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Didn\'t receive code? Resend OTP'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* STEP 3: RESET PASSWORD */}
      {step === 3 && (
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <div className='grid gap-2'>
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className='text-xs font-semibold text-[#1a1a2e] md:text-muted-foreground'>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="********"
                        {...field}
                        className='h-12 rounded-xl border-white/20 bg-white/5 focus-visible:ring-primary/50'
                      />
                    </FormControl>
                    <PasswordStrengthIndicator password={field.value} className="mt-2" />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className='text-xs font-semibold text-[#1a1a2e] md:text-muted-foreground'>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder="********"
                        {...field}
                        className='h-12 rounded-xl border-white/20 bg-white/5 focus-visible:ring-primary/50'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='mt-6 h-12 rounded-xl font-black uppercase tracking-widest shadow-xl w-full' loading={isLoading}>
                Secure Account
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
