import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface PasswordStrengthIndicatorProps {
    password: string
    className?: string
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
    const strength = useMemo(() => {
        const checks = {
            length: false,
            uppercase: false,
            lowercase: false,
            digit: false,
            special: false,
        }

        if (!password) return { score: 0, label: '', color: '', checks }

        let score = 0
        checks.length = password.length >= 8
        checks.uppercase = /[A-Z]/.test(password)
        checks.lowercase = /[a-z]/.test(password)
        checks.digit = /\d/.test(password)
        checks.special = /[!@#$%^&*(),.?":{}|<>]/.test(password)

        // Calculate score
        if (checks.length) score++
        if (checks.uppercase) score++
        if (checks.lowercase) score++
        if (checks.digit) score++
        if (checks.special) score++

        // Determine strength
        if (score <= 2) {
            return { score, label: 'Weak', color: 'bg-red-500', checks }
        } else if (score <= 4) {
            return { score, label: 'Medium', color: 'bg-yellow-500', checks }
        } else {
            return { score, label: 'Strong', color: 'bg-green-500', checks }
        }
    }, [password])

    if (!password) return null

    return (
        <div className={cn('space-y-2', className)}>
            {/* Strength bar */}
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={cn(
                            'h-1 flex-1 rounded-full transition-colors',
                            level <= strength.score ? strength.color : 'bg-muted'
                        )}
                    />
                ))}
            </div>

            {/* Strength label */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                    Password strength: <span className={cn('font-semibold', {
                        'text-red-500': strength.label === 'Weak',
                        'text-yellow-500': strength.label === 'Medium',
                        'text-green-500': strength.label === 'Strong',
                    })}>{strength.label}</span>
                </span>
            </div>

            {/* Requirements checklist */}
            <div className="text-xs space-y-1 text-muted-foreground">
                <div className={cn('flex items-center gap-1', strength.checks.length && 'text-green-600')}>
                    <span className="font-bold">{strength.checks.length ? '✓' : '○'}</span>
                    <span className={cn(strength.checks.length ? 'font-bold text-foreground' : 'font-semibold')}>At least 8 characters</span>
                </div>
                <div className={cn('flex items-center gap-1', strength.checks.uppercase && 'text-green-600')}>
                    <span className="font-bold">{strength.checks.uppercase ? '✓' : '○'}</span>
                    <span className={cn(strength.checks.uppercase ? 'font-bold text-foreground' : 'font-semibold')}>One uppercase letter</span>
                </div>
                <div className={cn('flex items-center gap-1', strength.checks.lowercase && 'text-green-600')}>
                    <span className="font-bold">{strength.checks.lowercase ? '✓' : '○'}</span>
                    <span className={cn(strength.checks.lowercase ? 'font-bold text-foreground' : 'font-semibold')}>One lowercase letter</span>
                </div>
                <div className={cn('flex items-center gap-1', strength.checks.digit && 'text-green-600')}>
                    <span className="font-bold">{strength.checks.digit ? '✓' : '○'}</span>
                    <span className={cn(strength.checks.digit ? 'font-bold text-foreground' : 'font-semibold')}>One number</span>
                </div>
                <div className={cn('flex items-center gap-1', strength.checks.special && 'text-green-600')}>
                    <span className="font-bold">{strength.checks.special ? '✓' : '○'}</span>
                    <span className={cn(strength.checks.special ? 'font-bold text-foreground' : 'font-semibold')}>One special character</span>
                </div>
            </div>
        </div>
    )
}
