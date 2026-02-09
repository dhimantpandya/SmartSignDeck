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

  const calculatePercentage = (val: number, total: number) => {
    if (!total || total === 0) return '0%'
    return `${Math.round((val / total) * 100)}%`
  }

  return (
    <>
      <AnalyticsCard
        title='Total Templates'
        value={String(stats?.totalTemplates ?? 0)}
        percentageChange='100%'
        icon={
          <IconLayout className='h-4 w-4 text-muted-foreground' />
        }
      />
      <AnalyticsCard
        title='Total Screens'
        value={String(stats?.totalScreens ?? 0)}
        percentageChange='100%'
        icon={<IconDeviceTv className='h-4 w-4 text-muted-foreground' />}
      />
      <AnalyticsCard
        title='Online Screens'
        value={String(stats?.onlineScreens ?? 0)}
        percentageChange={calculatePercentage(stats?.onlineScreens ?? 0, stats?.totalScreens ?? 0)}
        icon={<IconCircleCheck className='h-4 w-4 text-green-500' />}
      />
      <AnalyticsCard
        title='Offline Screens'
        value={String(stats?.offlineScreens ?? 0)}
        percentageChange={calculatePercentage(stats?.offlineScreens ?? 0, stats?.totalScreens ?? 0)}
        icon={<IconCircleX className='h-4 w-4 text-red-500' />}
      />
    </>
  )
}
