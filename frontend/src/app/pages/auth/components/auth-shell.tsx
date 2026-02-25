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
        <div className={cn(
            'relative mx-auto flex min-h-[600px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-background/30 shadow-2xl backdrop-blur-3xl transition-all duration-500',
            isPureForm ? 'max-w-[600px]' : 'max-w-[1000px]'
        )}>
            {/* Sliding Content Container */}
            <div className='flex w-full flex-col md:flex-row'>

                {/* Form Section */}
                <motion.div
                    layout
                    className={cn(
                        'flex w-full flex-col justify-center p-8 lg:p-12',
                        isPureForm ? 'w-full' : 'md:w-1/2',
                        !isSignIn && !isPureForm ? 'md:order-2' : 'md:order-1'
                    )}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className='text-3xl font-black uppercase italic tracking-tighter text-foreground'>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className='mt-2 text-muted-foreground font-medium'>
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
                        className={cn(
                            'relative hidden w-1/2 flex-col items-center justify-center bg-[#020817] p-12 text-white md:flex',
                            !isSignIn ? 'md:order-1' : 'md:order-2'
                        )}
                    >
                        {/* Decorative background for the dark section */}
                        <div className='absolute inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent' />

                        <div className='relative z-10 text-center space-y-6'>
                            <motion.h2
                                key={isSignIn ? 'welcome' : 'join'}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className='text-4xl font-black uppercase italic tracking-tighter'
                            >
                                {isSignIn ? "Hello, Friend!" : "Welcome Back!"}
                            </motion.h2>
                            <p className='text-white/70 font-medium'>
                                {isSignIn
                                    ? "Enter your personal details and start your journey with us."
                                    : "To keep connected with us please login with your personal info."}
                            </p>
                            <Link to={isSignIn ? '/sign-up' : '/sign-in'}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className='mt-8 rounded-full border-2 border-white px-12 py-3 font-bold uppercase tracking-widest transition-colors hover:bg-white hover:text-[#020817]'
                                >
                                    {isSignIn ? "Sign Up" : "Sign In"}
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
