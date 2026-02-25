import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAtom } from 'jotai'
import { selectedCharacterAtom } from '@/store/auth-character'
import { CharacterSelection } from './character-selection'

interface AuthShellProps {
    children: ReactNode
    title: string
    subtitle?: string
    isPureForm?: boolean
}

export function AuthShell({ children, title, subtitle, isPureForm }: AuthShellProps) {
    const location = useLocation()
    const isSignIn = location.pathname.includes('sign-in')
    const [selectedCharacter] = useAtom(selectedCharacterAtom)

    // Pulling Animation Variants
    const formVariants = {
        initial: (isSignIn: boolean) => ({
            x: isSignIn ? -50 : 50,
            opacity: 0,
            scale: 0.95,
        }),
        animate: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 250,
                damping: 20,
                mass: 1,
            }
        },
        exit: (isSignIn: boolean) => ({
            x: isSignIn ? 50 : -50,
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.2 }
        })
    };

    const characterVariants = {
        initial: (isSignIn: boolean) => ({
            x: isSignIn ? 150 : -150,
            opacity: 0,
            scale: 1.1,
            rotate: isSignIn ? 10 : -10
        }),
        animate: {
            x: 0,
            opacity: 1,
            scale: 1,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 150,
                damping: 15,
                mass: 1.5,
                delay: 0.1 // Character follows slightly after form
            }
        },
        exit: (isSignIn: boolean) => ({
            x: isSignIn ? -150 : 150,
            opacity: 0,
            scale: 1.1,
            rotate: isSignIn ? -10 : 10,
            transition: { duration: 0.2 }
        })
    };

    return (
        <div className="relative w-full max-w-[1000px] mx-auto min-h-[600px] flex items-center justify-center perspective-[2000px]">
            {/* Show Character Selection if none selected */}
            <AnimatePresence>
                {!selectedCharacter && !isPureForm && (
                    <CharacterSelection key="selector" />
                )}
            </AnimatePresence>

            <motion.div
                layoutId="auth-card"
                layout
                initial={{ scale: 0.8, opacity: 0, rotateX: 10 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    mass: 1.2
                }}
                className={cn(
                    'relative w-full overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-3xl cursor-default flex min-h-[600px]',
                    isPureForm ? 'max-w-[600px]' : '',
                    // Dynamic background based on selection
                    selectedCharacter ? 'bg-background/80' : 'bg-background/30'
                )}
            >
                {/* Sliding Layout Wrapper */}
                <div className={cn(
                    'flex w-full flex-col md:flex-row relative z-10',
                    !isSignIn && !isPureForm ? 'md:flex-row-reverse' : ''
                )}>
                    {/* Form Section */}
                    <div className={cn(
                        'flex w-full flex-col justify-center p-8 lg:p-12 relative z-20',
                        isPureForm ? 'w-full' : 'md:w-1/2',
                        'bg-background' // Solid background for form area to hide character behind it
                    )}>
                        <AnimatePresence mode="wait" custom={isSignIn}>
                            <motion.div
                                key={isSignIn ? 'signin-form' : 'signup-form'}
                                custom={isSignIn}
                                variants={formVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full"
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
                        </AnimatePresence>
                    </div>

                    {/* Brand/Toggle Section (The "Character Pull") */}
                    {!isPureForm && (
                        <div className='relative hidden w-1/2 flex-col items-center justify-center bg-[#020817] p-12 text-white md:flex overflow-hidden z-10'>
                            {/* Decorative background gradient tied to character color */}
                            {selectedCharacter && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.3 }}
                                    className={cn(
                                        'absolute inset-0 z-0 bg-gradient-to-br',
                                        selectedCharacter.color
                                    )}
                                />
                            )}

                            <div className='absolute inset-0 z-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black/0 via-black/50 to-black/80' />

                            {/* Character Pulling Animation */}
                            <div className='absolute bottom-0 left-0 right-0 h-[85%] pointer-events-none z-10 overflow-hidden flex items-end justify-center'>
                                <AnimatePresence mode="wait" custom={isSignIn}>
                                    {selectedCharacter && (
                                        <motion.img
                                            key={`${selectedCharacter.id}-${isSignIn ? 'join' : 'welcome'}`}
                                            custom={isSignIn}
                                            variants={characterVariants}
                                            initial="initial"
                                            animate="animate"
                                            exit="exit"
                                            src={selectedCharacter.imageUrl}
                                            alt={selectedCharacter.name}
                                            className='h-full w-auto object-cover object-top drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] filter brightness-90 contrast-110'
                                            style={{
                                                maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
                                                WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)'
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className='relative z-20 text-center space-y-6 mt-auto mb-12 backdrop-blur-sm bg-black/20 p-6 rounded-3xl border border-white/10'>
                                <motion.h2
                                    key={isSignIn ? 'welcome' : 'join'}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.2 }}
                                    className='text-4xl font-black uppercase italic tracking-tighter shadow-2xl drop-shadow-lg'
                                >
                                    {isSignIn ? "Hello, Friend!" : "Welcome Back!"}
                                </motion.h2>
                                <p className='text-white/80 font-medium text-sm max-w-[280px] drop-shadow-md mx-auto'>
                                    {isSignIn
                                        ? "Enter your details and start your journey."
                                        : "To keep connected please login with your info."}
                                </p>
                                <Link to={isSignIn ? '/sign-up' : '/sign-in'} className="block">
                                    <motion.button
                                        whileHover={{ scale: 1.05, y: -2 }}
                                        whileTap={{ scale: 0.95 }}
                                        className='mt-4 rounded-full border-2 border-white/80 bg-white/10 backdrop-blur-md px-10 py-3 font-bold uppercase tracking-widest transition-all hover:bg-white hover:text-[#020817] shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                    >
                                        {isSignIn ? "Sign Up" : "Sign In"}
                                    </motion.button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
