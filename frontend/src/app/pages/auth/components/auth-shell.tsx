import { cn } from '@/lib/utils'

interface AuthShellProps {
    children?: React.ReactNode
    title?: string
    subtitle?: string
    isPureForm?: boolean
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
    return (
        <div className='relative mx-auto w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-background/80 shadow-2xl backdrop-blur-2xl p-10'>
            {title && (
                <h1 className='mb-1 text-3xl font-black tracking-tight text-foreground'>
                    {title}
                </h1>
            )}
            {subtitle && (
                <p className='mb-8 text-sm text-muted-foreground'>{subtitle}</p>
            )}
            {children}
        </div>
    )
}
