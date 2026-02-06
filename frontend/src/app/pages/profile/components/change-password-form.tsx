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
import { useState } from 'react'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'

export function ChangePasswordForm() {
  const { user, login, logout } = useAuth()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await authService.deleteAccount()
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted successfully.',
      })
      await logout()
    } catch (error: any) {
      toast({
        title: error?.message || 'Failed to delete account',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteOpen(false)
    }
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

          <div className='mt-3 flex flex-col gap-4'>
            <div className='flex items-center gap-6'>
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

            <div className='mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-4'>
              <h4 className='text-sm font-semibold text-destructive'>
                Delete account
              </h4>
              <p className='mt-1 text-xs text-muted-foreground'>
                This will permanently delete your SmartSignDeck account and related data. This action cannot be undone.
              </p>
              <Button
                type='button'
                variant='destructive'
                className='mt-3 w-fit'
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete my account
              </Button>
            </div>
          </div>
        </div>

        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title='Delete account?'
          message='This will permanently delete your SmartSignDeck account and related data. This action cannot be undone.'
          confirmBtnText='Yes, delete my account'
          cancelBtnText='Cancel'
          variant='destructive'
          isLoading={isDeleting}
        />
      </form>
    </Form>
  )
}
