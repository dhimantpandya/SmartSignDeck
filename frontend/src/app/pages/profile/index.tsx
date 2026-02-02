import { FC } from 'react'
import { Layout } from '@/components/custom/layout'
import { UserNav } from '@/components/user-nav'
import ThemeSwitch from '@/components/theme-switch'
import { ProfileForm } from './components/profile-form'
import { IconHome } from '@tabler/icons-react'
import { BreadcrumbNavigation } from '@/components/ui/breadcrumb-navigation'
import ContentSection from './components/content-section'
import { ChangePasswordForm } from './components/change-password-form'
import { ProfilePictureForm } from './components/profile-picture-form'

const Profile: FC = () => {
  const breadcrumbItems = [
    { href: '/', icon: <IconHome size={18} /> },
    { label: 'Profile' },
  ]
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
          </div>
        </div>
      </Layout.Body>
    </Layout>
  )
}

export default Profile
