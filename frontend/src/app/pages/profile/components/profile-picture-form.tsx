import { useState } from 'react'
import { ProfilePictureImg } from '@/assets'
import { Button } from '@/components/custom/button'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { useAuth } from '@/hooks/use-auth'
import { apiService, userService } from '@/api'
import { toast } from '@/components/ui/use-toast'
import { useMutation } from '@tanstack/react-query'

export function ProfilePictureForm() {
  const { user, login } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const { mutateAsync: updateProfile } = useMutation({
    mutationFn: (avatar: string | null) => userService.updateProfile({ avatar } as any),
    onSuccess: (response) => {
      if (response.data) {
        login(response.data as any)
      }
      toast({ title: response.message || 'Profile picture updated' })
    },
    onError: (err: any) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' })
    }
  })

  const handleOpenCloudinaryWidget = async () => {
    setIsProcessing(true)
    try {
      // Get signature from backend
      const { signature, timestamp, cloud_name, api_key } = await apiService.get<any>('/v1/cloudinary/signature', {
        params: {
          timestamp: Math.round(new Date().getTime() / 1000)
        }
      })

      // Open Cloudinary Media Library Widget
      // @ts-ignore - Cloudinary added via script tag
      window.cloudinary.openMediaLibrary({
        cloud_name: cloud_name,
        api_key: api_key,
        timestamp: timestamp,
        signature: signature,
        button_class: 'hidden',
        multiple: false, // Only one profile picture
      }, {
        insertHandler: async (data: any) => {
          const asset = data.assets[0]
          if (asset) {
            await updateProfile(asset.secure_url)
          }
        }
      })
    } catch (error: any) {
      toast({ title: 'Could not open Cloudinary', description: error.message, variant: 'destructive' })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return
    await updateProfile(null)
  }

  const avatarUrl = (user as any)?.avatar || ProfilePictureImg

  return (
    <div className='items-center sm:flex sm:space-x-4 xl:block xl:space-x-0 2xl:flex 2xl:space-x-4'>
      <div className='relative mb-4 h-28 w-28 flex-shrink-0 sm:mb-0 xl:mb-4 2xl:mb-0'>
        <img
          className='h-full w-full rounded-full border-2 border-primary/10 object-cover shadow-sm'
          src={avatarUrl}
          alt='profile picture'
        />
        {isProcessing && (
          <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/40'>
            <div className='h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent' />
          </div>
        )}
      </div>
      <div>
        <h3 className='mb-1 text-xl font-bold'>Profile picture</h3>
        <div className='mb-4 text-sm text-gray-500 dark:text-gray-400'>
          JPG, GIF or PNG. Max size of 800K
        </div>
        <div className='flex items-center gap-3'>
          <Button
            type='button'
            onClick={handleOpenCloudinaryWidget}
            disabled={isProcessing}
          >
            <IconUpload className='mr-2' size={18} />
            {user?.avatar ? 'Change' : 'Upload'} picture
          </Button>
          {user?.avatar && (
            <Button
              type='button'
              variant='outline'
              onClick={handleDelete}
              className='text-destructive hover:bg-destructive/5'
            >
              <IconTrash className='mr-2' size={18} />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
