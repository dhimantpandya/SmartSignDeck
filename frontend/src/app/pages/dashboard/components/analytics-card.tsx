import { CardHeader, Card, CardTitle, CardContent } from '@/components/ui/card'
import { IconProps } from '@tabler/icons-react'
import React from 'react'

interface AnalyticsCardProps {
  title: string
  value: string
  percentageChange: string
  icon: React.ReactElement<IconProps>
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  percentageChange,
  icon,
}) => {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <p className='text-xs text-muted-foreground'>{percentageChange}</p>
      </CardContent>
    </Card>
  )
}
