import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface AuthShellProps {
    children: ReactNode
    title: string
    subtitle?: string
    isPureForm?: boolean
}

export function AuthShell({ children, title, subtitle, isPureForm }: AuthShellProps) {
    const location = useLocation()
    const isSignIn = location.pathname.includes('sign-in')

    return (
        <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
            }}
            className={cn(
                'relative mx-auto flex min-h-[600px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/30 shadow-2xl backdrop-blur-3xl',
                isPureForm ? 'max-w-[600px]' : 'max-w-[1000px]'
            )}
        >
            {/* Sliding Content Container */}
            <div className={cn(
                'flex w-full flex-col md:flex-row',
                !isSignIn && !isPureForm ? 'md:flex-row-reverse' : ''
            )}>

                {/* Form Section */}
                <motion.div
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={cn(
                        'flex w-full flex-col justify-center p-8 lg:p-12',
                        isPureForm ? 'w-full' : 'md:w-1/2'
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            delay: 0.1
                        }}
                    >
                        <h1 className='text-4xl font-black uppercase italic tracking-tighter text-foreground'>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className='mt-2 text-muted-foreground font-medium text-lg'>
                                {subtitle}
                            </p>
                        )}
                        <div className='mt-8'>
                            {children}
                        </div>
                    </motion.div>
                </motion.div>

                {/* Brand/Toggle Section (The "Sliding Door") */}
                {!isPureForm && (
                    <motion.div
                        layout
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className='relative hidden w-1/2 flex-col items-center justify-center bg-[#020817] p-12 text-white md:flex'
                    >
                        {/* Decorative background for the dark section */}
                        <div className='absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent' />

                        <div className='relative z-10 text-center space-y-6'>
                            <motion.h2
                                key={isSignIn ? 'welcome' : 'join'}
                                initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className='text-5xl font-black uppercase italic tracking-tighter shadow-2xl'
                            >
                                {isSignIn ? "Hello, Friend!" : "Welcome Back!"}
                            </motion.h2>
                            <p className='text-white/70 font-medium text-lg'>
                                {isSignIn
                                    ? "Enter your personal details and start your journey with us."
                                    : "To keep connected with us please login with your personal info."}
                            </p>
                            <Link to={isSignIn ? '/sign-up' : '/sign-in'}>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 2 }}
                                    whileTap={{ scale: 0.9, rotate: -2 }}
                                    className='mt-8 rounded-full border-2 border-white px-12 py-3 font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-[#020817] shadow-[0_0_30px_rgba(255,255,255,0.2)]'
                                >
                                    {isSignIn ? "Sign Up" : "Sign In"}
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
