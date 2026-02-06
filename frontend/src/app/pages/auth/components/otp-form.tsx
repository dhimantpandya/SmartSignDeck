import { useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '@/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, HTMLAttributes } from 'react'
import { Button } from '@/components/custom/button'
import { Form, FormControl, FormField, FormItem, FormMessage, FormDescription } from '@/components/ui/form'
import { PinInput, PinInputField } from '@/components/custom/pin-input'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

import { useAuth } from '@/hooks/use-auth'

import { Routes } from '@/utilities/routes'

interface OtpFormProps extends HTMLAttributes<HTMLDivElement> { }

const formSchema = z.object({
  otp: z.string().min(6, { message: 'Please enter complete OTP code.' }).max(6),
})

export default function OtpForm({ className, ...props }: OtpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [disabledBtn, setDisabledBtn] = useState(true)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || ''

  // Timer state (10 minutes = 600 seconds)
  // Timer state (10 minutes = 600 seconds) persistent through reloads
  const [timeLeft, setTimeLeft] = useState(() => {
    const expiresAt = localStorage.getItem('otp_expires_at')
    if (!expiresAt) return 600
    const remaining = Math.floor((Number(expiresAt) - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  })

  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(() => {
    const availableAt = localStorage.getItem('resend_available_at')
    if (!availableAt) return 0
    const remaining = Math.floor((Number(availableAt) - Date.now()) / 1000)
    return remaining > 0 ? remaining : 0
  })

  const { login } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  })

  // OTP expiration countdown
  useEffect(() => {
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
  }, [timeLeft])

  // Resend cooldown timer
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

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const response = await authService.verifyOtp({ email, otp: data.otp }) as any
      const { user, tokens } = response

      if (user && tokens) {
        // Complete login and sync state
        login(user, tokens.refresh.token, tokens.access)

        toast({ title: 'Email verified successfully!' })
        localStorage.removeItem('otp_expires_at')
        localStorage.removeItem('resend_available_at')
        navigate(Routes.DASHBOARD)
      } else {
        toast({ title: 'Invalid OTP', variant: 'destructive' })
      }
    } catch (error: any) {
      if (error?.status === 401 && error?.message?.includes('not registered')) {
        toast({
          title: 'Email is not registered',
          description: 'Redirecting you to the sign-up page...',
        })
        setTimeout(() => {
          navigate('/sign-up', { state: { email } })
        }, 2000)
        return
      }

      // Clear OTP field for better UX when verification fails
      form.reset()

      toast({
        title: error?.message || 'OTP verification failed',
        description: 'Please check your code and try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResending(true)
    try {
      await authService.resendOtp(email)
      toast({ title: 'OTP resent successfully! Check your email.' })
      const otpExpiresAt = Date.now() + 600 * 1000
      const resendAvailableAt = Date.now() + 60 * 1000

      localStorage.setItem('otp_expires_at', otpExpiresAt.toString())
      localStorage.setItem('resend_available_at', resendAvailableAt.toString())

      setTimeLeft(600) // Reset timer to 10 minutes
      setResendCooldown(60) // 60 second cooldown before next resend
      setCanResend(false)
      form.reset()
    } catch (error: any) {
      if (error?.status === 401 && error?.message?.includes('not registered')) {
        toast({
          title: 'Email is not registered',
          description: 'Redirecting you to the sign-up page...',
        })
        setTimeout(() => {
          navigate('/sign-up', { state: { email } })
        }, 2000)
        return
      }
      toast({ title: error?.message ?? 'Failed to resend OTP', variant: 'destructive' })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={cn('grid gap-6', className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <PinInput
                    {...field}
                    className="flex h-10 justify-center gap-2"
                    onComplete={() => setDisabledBtn(false)}
                    onIncomplete={() => setDisabledBtn(true)}
                  >
                    {Array.from({ length: 6 }, (_, i) => (
                      <PinInputField key={i} component="input" className="w-12 h-12 text-center text-lg" />
                    ))}
                  </PinInput>
                </FormControl>
                <FormDescription className="text-center">
                  {timeLeft > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      Code expires in <span className="font-semibold text-foreground">{formatTime(timeLeft)}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-destructive font-semibold">OTP expired. Please request a new one.</span>
                  )}
                </FormDescription>
                {form.formState.isSubmitted && <FormMessage />}
              </FormItem>
            )}
          />
          <Button className="mt-4 w-full" disabled={disabledBtn || timeLeft === 0} loading={isLoading}>
            Verify
          </Button>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="ghost"
              disabled={!canResend || resendCooldown > 0 || isResending}
              onClick={handleResendOtp}
              className="text-sm"
              loading={isResending}
            >
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : 'Didn\'t receive code? Resend OTP'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
