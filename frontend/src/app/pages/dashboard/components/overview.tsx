import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { useTheme } from '@/components/theme-provider'

interface OverviewProps {
  data?: any[]
}

export function Overview({ data = [] }: OverviewProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  
  // Sort and take last 7 days
  const chartData = [...data].sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime()).slice(-7)

  const colors = {
    text: isDark ? 'hsl(var(--muted-foreground))' : '#888888',
    tooltip: isDark ? 'hsl(var(--card))' : '#fff',
    tooltipBorder: isDark ? 'hsl(var(--border))' : '#e5e7eb',
    tooltipText: isDark ? 'hsl(var(--foreground))' : '#000'
  }

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={chartData}>
        <XAxis
          dataKey='period'
          stroke={colors.text}
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString('en-US', { weekday: 'short' })
          }}
        />
        <YAxis
          stroke={colors.text}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          cursor={{ fill: 'transparent' }}
          contentStyle={{ 
            borderRadius: '12px', 
            border: `1px solid ${colors.tooltipBorder}`, 
            backgroundColor: colors.tooltip,
            color: colors.tooltipText,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}
          itemStyle={{ color: colors.tooltipText }}
        />
        <Bar
          dataKey='plays'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
