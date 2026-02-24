import { FC, useState } from 'react'
import { Layout } from '@/components/custom/layout'
import { UserNav } from '@/components/user-nav'
import ThemeSwitch from '@/components/theme-switch'
import { ProfileForm } from './components/profile-form'
import { IconHome } from '@tabler/icons-react'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import ContentSection from './components/content-section'
import { ChangePasswordForm } from './components/change-password-form'
import { ProfilePictureForm } from './components/profile-picture-form'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/api'
import { useAuth } from '@/hooks/use-auth'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/custom/button'
import { useNavigate } from 'react-router-dom'

const Profile: FC = () => {
  const breadcrumbItems = [
    { href: '/', icon: <IconHome size={18} /> },
    { label: 'Profile' },
  ]

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const { logout, user: currentUser } = useAuth()
  const navigate = useNavigate()

  const { mutate: requestDelete, isPending: isRequesting } = useMutation({
    mutationFn: () => authService.requestDeleteAccount(),
    onSuccess: () => {
      setIsOtpStep(true)
      toast({
        title: 'Verification code sent',
        description: 'Please check your email for the deletion code.',
      })
    },
    onError: (error: any) => {
      toast({
        title: error?.message || 'Failed to request deletion',
        variant: 'destructive',
      })
    },
  })

  const { mutate: confirmDelete, isPending: isConfirming } = useMutation({
    mutationFn: (token: string) => authService.confirmDeleteAccount(currentUser?.email || '', token),
    onSuccess: async () => {
      toast({
        title: 'Account deleted',
        description: 'Your account and data have been removed.',
      })
      await logout()
      navigate('/sign-in')
    },
    onError: (error: any) => {
      toast({
        title: error?.message || 'Invalid or expired code',
        variant: 'destructive',
      })
    },
  })

  const handleConfirmDelete = () => {
    if (!isOtpStep) {
      requestDelete()
    } else {
      if (!otp.trim()) {
        toast({ title: 'Please enter the code', variant: 'destructive' })
        return
      }
      confirmDelete(otp)
    }
  }

  return (
    <Layout>
      <Layout.Header sticky>
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <UserNav />
        </div>
      </Layout.Header>

      <Layout.Body>
        <div className='mb-4'>
          <BreadcrumbNavigation items={breadcrumbItems} />
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <div className='md:col-span-1'>
            <ContentSection title='' desc=''>
              <ProfilePictureForm />
            </ContentSection>
          </div>
          <div className='space-y-4 md:col-span-2'>
            <ContentSection title='General Information' desc=''>
              <ProfileForm />
            </ContentSection>
            <ContentSection title='Password Information' desc=''>
              <ChangePasswordForm />
            </ContentSection>
            <ContentSection title='Danger Zone' desc='Delete your account and all associated data.'>
              <div className='flex flex-col gap-2'>
                <p className='text-sm text-muted-foreground'>
                  This action is permanent and cannot be undone.
                </p>
                <Button
                  type='button'
                  variant='destructive'
                  className='w-fit'
                  onClick={() => {
                    setIsOtpStep(false)
                    setIsDeleteOpen(true)
                  }}
                >
                  Delete my account
                </Button>
              </div>
            </ContentSection>
          </div>
        </div>
        <ConfirmationDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleConfirmDelete}
          title={isOtpStep ? 'Verify Deletion' : 'Delete account?'}
          message={isOtpStep
            ? 'We have sent a verification code to your email. Please enter it below to confirm permanent deletion.'
            : 'This will send a verification code to your email. You will need this code to confirm permanent deletion of your account and data.'}
          confirmBtnText={isOtpStep ? 'Permanently Delete' : 'Send Code'}
          cancelBtnText='Cancel'
          variant='destructive'
          isLoading={isRequesting || isConfirming}
        >
          {isOtpStep && (
            <div className='mt-4'>
              <input
                type='text'
                placeholder='Enter 6-digit code'
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </ConfirmationDialog>
      </Layout.Body>
    </Layout>
  )
}

export default Profile
