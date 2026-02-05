import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/custom/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  ChangePasswordRequest,
  changePasswordSchema,
} from '@/validations/auth.validation'
import { PasswordInput } from '@/components/custom/password-input'
import { useMutation } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'
import { authService } from '@/api'
import { Link, useNavigate } from 'react-router-dom'
import { Routes } from '@/utilities/routes'
import { useAuth } from '@/hooks/use-auth'

export function ChangePasswordForm() {
  const { user, login } = useAuth()
  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
  })
  const navigate = useNavigate()
  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (data: ChangePasswordRequest) =>
      authService.changePassword(data),
    onSuccess: (response: any) => {
      form.reset()
      if (response?.data?.tokens) {
        const { access, refresh } = response.data.tokens
        login({}, refresh?.token || null, access)
      }
      toast({
        title: 'Password updated successfully',
      })
    },
    onError: (error: any) => {
      const isIncorrect = error?.status === 401 && error?.message?.toLowerCase().includes('incorrect')

      toast({
        title: isIncorrect ? 'Current password is wrong' : 'Update failed',
        description: isIncorrect
          ? 'Redirecting you to the forgot password page...'
          : (error?.message || 'Something went wrong'),
        variant: 'destructive',
      })

      if (isIncorrect) {
        setTimeout(() => {
          navigate(`${Routes.FORGOT_PASSWORD}?email=${encodeURIComponent(user?.email || '')}`)
        }, 2000)
      }
    },
  })

  async function onSubmit(data: ChangePasswordRequest) {
    mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form className='mt-2' onSubmit={form.handleSubmit(onSubmit)}>
        <div className='grid gap-2'>
          <div className='grid grid-cols-1 gap-4'>
            <FormField
              control={form.control}
              name='oldPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old password*</FormLabel>
                  <FormControl {...field}>
                    <PasswordInput placeholder='Enter old password' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='newPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password*</FormLabel>
                  <FormControl {...field}>
                    <PasswordInput
                      showTooltip
                      placeholder='Enter new password'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password*</FormLabel>
                  <FormControl {...field}>
                    <PasswordInput placeholder='Enter confirm password' />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className='mt-3 flex items-center gap-6'>
            <Button
              type='submit'
              className='w-auto rounded-lg'
              loading={isPending}
            >
              Update Password
            </Button>
            <Link
              to={`${Routes.FORGOT_PASSWORD}?email=${encodeURIComponent(user?.email || '')}`}
              className='text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors'
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </form>
    </Form>
  )
}
