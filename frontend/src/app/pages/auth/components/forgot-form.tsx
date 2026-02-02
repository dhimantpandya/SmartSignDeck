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
      setTimeLeft(600)
    }
  }, [searchParams])

  // Timer state
  const [timeLeft, setTimeLeft] = useState(600)
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
      setTimeLeft(600) // Start 10m timer
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
      setTimeLeft(600)
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder='name@example.com' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='mt-2' loading={isLoading}>
                Continue
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
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-sm text-muted-foreground">
                  Enter the 6-digit OTP sent to {email}
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
                        className="flex h-10 justify-center gap-2"
                        onComplete={() => setDisabledOtpBtn(false)}
                        onIncomplete={() => setDisabledOtpBtn(true)}
                      >
                        {Array.from({ length: 6 }, (_, i) => (
                          <PinInputField key={i} component="input" className="w-12 h-12 text-center text-lg" />
                        ))}
                      </PinInput>
                    </FormControl>
                    <FormMessage />
                    <div className="text-center text-sm text-muted-foreground mt-2">
                      {timeLeft > 0 ? (
                        <span>
                          Code expires in <span className="font-semibold">{formatTime(timeLeft)}</span>
                        </span>
                      ) : (
                        <span className="text-destructive font-semibold">OTP expired. Please resend.</span>
                      )}
                    </div>
                  </FormItem>
                )}
              />
              <Button type="submit" loading={isLoading} disabled={disabledOtpBtn || timeLeft === 0}>
                Verify OTP
              </Button>
              <Button
                type="button"
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={handleResendOtp}
                disabled={!canResend || resendCooldown > 0 || isLoading}
              >
                {resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : 'Resend OTP'}
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
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
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
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='mt-2' loading={isLoading}>
                Reset Password
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}
