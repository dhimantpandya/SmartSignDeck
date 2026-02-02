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
import { Link } from 'react-router-dom'
import { Routes } from '@/utilities/routes'
import { useAuth } from '@/hooks/use-auth'

export function ChangePasswordForm() {
  const { login } = useAuth()
  const form = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
  })
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
        title: response.message,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error?.message || 'Something went wrong',
        variant: 'destructive',
      })
    },
  })

  async function onSubmit(data: ChangePasswordRequest) {
    mutateAsync(data)
  }

  return (
    <Form {...form}>
      <form className='mt-2' onSubmit={form.handleSubmit(onSubmit)}>
        <div className='grid gap-2 '>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='oldPassword'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Old password*</FormLabel>
                    <Link
                      to={Routes.FORGOT_PASSWORD}
                      className='text-sm font-medium text-primary hover:underline'
                    >
                      Forgot password?
                    </Link>
                  </div>
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

          <Button
            type='submit'
            className='mr-auto mt-3  w-auto rounded-lg'
            loading={isPending}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Form>
  )
}
