import {
  IconLayout,
  IconDeviceTv,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react'
import { AnalyticsCard } from './analytics-card'
import { useQuery } from '@tanstack/react-query'
import { signageService } from '@/api/signage.service'
import { Skeleton } from '@/components/ui/skeleton'

export const Analytics = () => {
  const { isLoading, data } = useQuery({
    queryKey: ['signage-stats'],
    queryFn: () => signageService.getStats(),
  })

  if (isLoading) {
    return (
      <>
        <Skeleton className='h-32 rounded-xl' />
        <Skeleton className='h-32 rounded-xl' />
        <Skeleton className='h-32 rounded-xl' />
        <Skeleton className='h-32 rounded-xl' />
      </>
    )
  }

  if (data) {
    return (
      <>
        <AnalyticsCard
          title='Total Templates'
          value={String(data.totalTemplates)}
          percentageChange='0%'
          icon={
            <IconLayout className='h-4 w-4 text-muted-foreground' />
          }
        />
        <AnalyticsCard
          title='Total Screens'
          value={String(data.totalScreens)}
          percentageChange='0%'
          icon={<IconDeviceTv className='h-4 w-4 text-muted-foreground' />}
        />
        <AnalyticsCard
          title='Online Screens'
          value={String(data.onlineScreens)}
          percentageChange='0%'
          icon={<IconCircleCheck className='h-4 w-4 text-green-500' />}
        />
        <AnalyticsCard
          title='Offline Screens'
          value={String(data.offlineScreens)}
          percentageChange='0%'
          icon={<IconCircleX className='h-4 w-4 text-red-500' />}
        />
      </>
    )
  }

  return null
}
