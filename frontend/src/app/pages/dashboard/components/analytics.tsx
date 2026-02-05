import {
  IconLayout,
  IconDeviceTv,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react'
import { AnalyticsCard } from './analytics-card'
import { Skeleton } from '@/components/ui/skeleton'

interface AnalyticsProps {
  stats?: any
  isLoading?: boolean
}

export const Analytics = ({ stats, isLoading }: AnalyticsProps) => {
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

  return (
    <>
      <AnalyticsCard
        title='Total Templates'
        value={String(stats?.totalTemplates ?? 0)}
        percentageChange='0%'
        icon={
          <IconLayout className='h-4 w-4 text-muted-foreground' />
        }
      />
      <AnalyticsCard
        title='Total Screens'
        value={String(stats?.totalScreens ?? 0)}
        percentageChange='0%'
        icon={<IconDeviceTv className='h-4 w-4 text-muted-foreground' />}
      />
      <AnalyticsCard
        title='Online Screens'
        value={String(stats?.onlineScreens ?? 0)}
        percentageChange='0%'
        icon={<IconCircleCheck className='h-4 w-4 text-green-500' />}
      />
      <AnalyticsCard
        title='Offline Screens'
        value={String(stats?.offlineScreens ?? 0)}
        percentageChange='0%'
        icon={<IconCircleX className='h-4 w-4 text-red-500' />}
      />
    </>
  )
}
