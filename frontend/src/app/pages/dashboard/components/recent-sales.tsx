import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Screen } from '@/api/screen.service'
import { Skeleton } from '@/components/ui/skeleton'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { IconDeviceTv } from '@tabler/icons-react'

dayjs.extend(relativeTime)

interface RecentActivityProps {
  screens?: Screen[]
  isLoading?: boolean
}

export function RecentActivity({ screens = [], isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className='space-y-8'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className='flex items-center'>
            <Skeleton className='h-9 w-9 rounded-full' />
            <div className='ml-4 space-y-1'>
              <Skeleton className='h-4 w-[150px]' />
              <Skeleton className='h-3 w-[100px]' />
            </div>
            <Skeleton className='ml-auto h-4 w-16' />
          </div>
        ))}
      </div>
    )
  }

  if (screens.length === 0) {
    return (
      <div className='flex h-[300px] flex-col items-center justify-center space-y-3 text-center'>
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted'>
          <IconDeviceTv className="text-muted-foreground" size={24} />
        </div>
        <div className='space-y-1'>
          <p className='text-sm font-medium text-foreground'>No recent activity</p>
          <p className='text-xs text-muted-foreground'>
            No screens have been added yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {screens.map((screen, index) => (
        <div key={index} className='flex items-center'>
          <Avatar className='h-9 w-9'>
            <AvatarFallback className='bg-primary/10 text-primary'>
              <IconDeviceTv size={18} />
            </AvatarFallback>
          </Avatar>
          <div className='ml-4 space-y-1'>
            <p className='text-sm font-medium leading-none'>{screen.name}</p>
            <p className='text-xs text-muted-foreground'>
              Added {dayjs(screen.created_at).fromNow()}
            </p>
          </div>
          <div className={`ml-auto text-xs font-semibold px-2 py-1 rounded-full ${screen.status === 'online' ? 'bg-green-100 text-green-700' :
            screen.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
            {screen.status.toUpperCase()}
          </div>
        </div>
      ))}
    </div>
  )
}
