import { VismeAuthForm } from './visme-auth-form'

interface AuthShellProps {
    children?: React.ReactNode
    title?: string
    subtitle?: string
    isPureForm?: boolean
}

export function AuthShell({ isPureForm, children, title, subtitle }: AuthShellProps) {
    // Pure forms (OTP, forgot password) still use the old styled card
    if (isPureForm) {
        return (
            <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/30 shadow-2xl backdrop-blur-3xl p-10">
                {title && (
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-foreground mb-2">
                        {title}
                    </h1>
                )}
                {subtitle && (
                    <p className="text-muted-foreground font-medium text-lg mb-8">{subtitle}</p>
                )}
                {children}
            </div>
        )
    }

    // Main sign-in / sign-up: render Visme full-screen form with 3D character
    return <VismeAuthForm />
}
