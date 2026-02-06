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
  const { logout } = useAuth()
  const navigate = useNavigate()

  const { mutate: deleteAccount, isPending: isDeleting } = useMutation({
    mutationFn: async () => authService.deleteAccount(),
    onSuccess: async () => {
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted successfully.',
      })
      await logout()
      navigate('/sign-in')
    },
    onError: (error: any) => {
      toast({
        title: error?.message || 'Failed to delete account',
        variant: 'destructive',
      })
    },
  })

  const handleConfirmDelete = () => {
    deleteAccount()
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
                  onClick={() => setIsDeleteOpen(true)}
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
          title='Delete account?'
          message='This will permanently delete your SmartSignDeck account and related data. This action cannot be undone.'
          confirmBtnText='Yes, delete my account'
          cancelBtnText='Cancel'
          variant='destructive'
          isLoading={isDeleting}
        />
      </Layout.Body>
    </Layout>
  )
}

export default Profile
