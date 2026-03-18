
interface AuthShellProps {
    children?: React.ReactNode
    title?: string
    subtitle?: string
    isPureForm?: boolean
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
    return (
        <div className='relative mx-auto w-[calc(100%-32px)] md:w-full max-w-[480px] overflow-hidden rounded-2xl border border-white/10 bg-background/80 shadow-2xl backdrop-blur-2xl p-6 md:p-10'>
            {title && (
                <h1 className='mb-2 text-[1.75rem] leading-tight md:text-3xl font-black tracking-tight !text-blue-950 break-words'>
                    {title}
                </h1>
            )}
            {subtitle && (
                <p className='mb-6 md:mb-8 text-xs md:text-sm !text-blue-950 font-bold leading-relaxed'>{subtitle}</p>
            )}
            {children}
        </div>
    )
}
