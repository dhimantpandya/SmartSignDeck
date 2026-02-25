import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

// 4 characters that randomly appear to pull the form
const CHARACTERS = [
    { id: 'boy-1', src: '/images/characters/boy-1.png', side: 'left' },
    { id: 'girl-1', src: '/images/characters/girl-1.png', side: 'right' },
    { id: 'boy-2', src: '/images/characters/boy-2.png', side: 'left' },
    { id: 'girl-2', src: '/images/characters/girl-2.png', side: 'right' },
]

interface AuthShellProps {
    children?: React.ReactNode
    title?: string
    subtitle?: string
    isPureForm?: boolean
}

// ── Framer Motion variants ──────────────────────────────────────────────────

const characterVariants: Variants = {
    hidden: (side: string) => ({
        x: side === 'left' ? -220 : 220,
        opacity: 0,
        rotate: side === 'left' ? -15 : 15,
        scale: 0.85,
    }),
    visible: {
        x: 0,
        opacity: 1,
        rotate: 0,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 120,
            damping: 14,
            mass: 1.2,
        },
    },
    exit: (side: string) => ({
        x: side === 'left' ? -200 : 200,
        opacity: 0,
        transition: { duration: 0.25 },
    }),
}

const formVariants: Variants = {
    hidden: (side: string) => ({
        // Form enters from the opposite direction of where the character is pulling from
        x: side === 'left' ? 160 : -160,
        opacity: 0,
        scale: 0.92,
    }),
    visible: {
        x: 0,
        opacity: 1,
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 200,
            damping: 22,
            mass: 1,
            delay: 0.18, // character enters first; then pulls the form in
        },
    },
    exit: (side: string) => ({
        x: side === 'left' ? 160 : -160,
        opacity: 0,
        scale: 0.92,
        transition: { duration: 0.2 },
    }),
}

// ── Component ────────────────────────────────────────────────────────────────

export function AuthShell({ children, title, subtitle, isPureForm }: AuthShellProps) {
    const location = useLocation()

    // Deterministically pick a character per route so it doesn't flicker on re-renders
    const [character] = useState(() =>
        CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
    )

    const pageKey = location.pathname // AnimatePresence key trigger

    // ── Pure forms (OTP, Forgot Password) ──────────────────────────────────
    if (isPureForm) {
        return (
            <div className='relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/30 shadow-2xl backdrop-blur-3xl p-10'>
                {title && (
                    <h1 className='mb-2 text-4xl font-black uppercase italic tracking-tighter text-foreground'>
                        {title}
                    </h1>
                )}
                {subtitle && (
                    <p className='mb-8 text-lg font-medium text-muted-foreground'>{subtitle}</p>
                )}
                {children}
            </div>
        )
    }

    // ── Main Sign In / Sign Up ──────────────────────────────────────────────
    const isLeft = character.side === 'left'

    return (
        <AnimatePresence mode='wait' custom={character.side}>
            <div
                key={pageKey}
                className='relative flex w-full max-w-5xl items-end justify-center gap-0'
            >
                {/* LEFT character slot */}
                {isLeft && (
                    <motion.div
                        key={`char-${pageKey}`}
                        className='relative z-20 flex-shrink-0 self-end'
                        style={{ width: 220, height: 380 }}
                        variants={characterVariants}
                        custom={character.side}
                        initial='hidden'
                        animate='visible'
                        exit='exit'
                    >
                        <img
                            src={character.src}
                            alt='character'
                            className='h-full w-full object-contain object-bottom drop-shadow-2xl'
                        />
                    </motion.div>
                )}

                {/* Form card */}
                <motion.div
                    key={`form-${pageKey}`}
                    className={cn(
                        'relative z-10 w-full overflow-hidden rounded-[2rem] border border-white/10 bg-background/80 shadow-2xl backdrop-blur-2xl',
                        'flex flex-col gap-0',
                        isLeft ? 'rounded-tl-none' : 'rounded-tr-none'
                    )}
                    variants={formVariants}
                    custom={character.side}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                >
                    <div className='px-10 pt-10 pb-4'>
                        {title && (
                            <h1 className='text-3xl font-black uppercase italic tracking-tighter text-foreground'>
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className='mt-2 text-sm font-medium text-muted-foreground'>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className='px-10 pb-10'>
                        {children}
                    </div>
                </motion.div>

                {/* RIGHT character slot */}
                {!isLeft && (
                    <motion.div
                        key={`char-${pageKey}`}
                        className='relative z-20 flex-shrink-0 self-end'
                        style={{ width: 220, height: 380 }}
                        variants={characterVariants}
                        custom={character.side}
                        initial='hidden'
                        animate='visible'
                        exit='exit'
                    >
                        <img
                            src={character.src}
                            alt='character'
                            className='h-full w-full object-contain object-bottom drop-shadow-2xl'
                            style={{ transform: 'scaleX(-1)' }} // mirror to face the form
                        />
                    </motion.div>
                )}
            </div>
        </AnimatePresence>
    )
}
